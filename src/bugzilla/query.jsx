import { fetchJson, URL } from '../vendor/requests';
import {
  coalesce, exists, first, missing, toArray,
} from '../vendor/utils';
import { Log } from '../vendor/logs';
import { selectFrom, toPairs } from '../vendor/vectors';
import { Data } from '../vendor/datas';
import { escapeRegEx } from '../vendor/convert';
import { collate } from '../vendor/jx/utils';

const BUGZILLA_URL = 'https://bugzilla.mozilla.org/buglist.cgi';
const BUGZILLA_REST = 'https://bugzilla.mozilla.org/rest/bug';
const DEFAULT_COLUMNLIST = [
  'priority',
  'component',
  'assigned_to',
  'bug_status',
  'short_desc',
  'status_whiteboard',
  'changeddate',
];

function readOp(expr) {
  const [[, params]] = Object.entries(expr);
  const [[fld, val]] = Object.entries(params);

  return [fld, val];
}

const expressionLookup = {};
const convert = expr => {
  try {
    const output = toPairs(expressionLookup)
      .map((restful, op) => (expr[op] ? restful(expr) : []))
      .flatten()
      .toArray();

    if (missing(output)) {
      Log.error('Can not find operator for {{expr|json}}', { expr });
    }

    return output;
  } catch (e) {
    Log.warning('Bad filter {{expr|json}}', { expr }, e);

    return [];
  }
};

Data.setDefault(expressionLookup, {
  and(expr) {
    const and = selectFrom(toArray(expr.and));

    if (and.length > 1) {
      return [
        { f: 'OP', j: 'AND' },
        ...and.map(convert).flatten(),
        { f: 'CP' },
      ];
    }

    if (and.length === 1) return convert(first(and));

    return []; // RETURN true
  },
  or(expr) {
    const or = selectFrom(toArray(expr.or));

    if (or.length > 1) {
      return [{ f: 'OP', j: 'OR' }, ...or.map(convert).flatten(), { f: 'CP' }];
    }

    if (or.length === 1) return convert(first(or));

    return [
      {
        // RETURN false
        f: 'bug_id',
        o: 'equals',
        v: -1,
      },
    ];
  },
  eq(expr) {
    const patterns = Object.entries(coalesce(expr.eq, expr.in, expr.term, expr.terms));

    if (patterns.length > 1) {
      return [
        { f: 'OP', j: 'AND' },
        ...patterns.flatMap(([k, v]) => convert({ eq: { [k]: v } })),
        { f: 'CP' },
      ];
    }

    const [[fld, val]] = patterns;
    const vals = toArray(val);

    if (vals.length > 1) {
      return [
        {
          f: fld,
          o: 'anyexact',
          v: vals.join(','),
        },
      ];

      // return [
      //   { f: 'OP', j: 'OR' },
      //   ...val.map(v => ({ f: fld, o: 'equals', v })),
      //   { f: 'CP' },
      // ];
    }

    return [
      {
        f: fld,
        o: 'equals',
        v: vals[0],
      },
    ];
  },
  prefix(expr) {
    const [fld, val] = readOp(expr);
    const vals = toArray(val);

    if (vals.length > 1) {
      return [
        { f: 'OP', j: 'OR' },
        ...val.map(v => ({ f: fld, o: 'regexp', v: `${escapeRegEx(v)}.*` })),
        { f: 'CP' },
      ];
    }

    return [
      {
        f: fld,
        o: 'regexp',
        v: `${escapeRegEx(vals[0])}.*`,
      },
    ];
  },
  find(expr) {
    const [fld, val] = readOp(expr);

    return [
      {
        f: fld,
        o: 'contains',
        v: val,
      },
    ];
  },
  not(expr) {
    expr.not.forEach(e => {
      e.n = 1;
    });

    return expr.not;
  },
  missing(expr) {
    const fld = expr.missing;

    return [
      {
        f: fld,
        o: 'isempty',
      },
    ];
  },
  regex(expr) {
    const [fld, val] = readOp(expr);

    return [
      {
        f: fld,
        o: 'regexp',
        v: val,
      },
    ];
  },
  match_all() {
    return []; // RETURN true
  },
});

expressionLookup.in = expressionLookup.eq;
expressionLookup.term = expressionLookup.eq;
expressionLookup.terms = expressionLookup.eq;

const tokenizedMap = {
  regexp: ({ f, v }) => ({
    f: f.substring(0, f.length - 10),
    o: 'regexp',
    v: toArray(v).map(vv => `.*\\[${vv}.*`),
  }),
  equals: ({ f, v }) => ({
    f: f.substring(0, f.length - 10),
    o: 'substring',
    v: toArray(v).map(vv => `[${vv}]`),
  }),
  anyexact: ({ f, v }) => ({
    f: f.substring(0, f.length - 10),
    o: 'anywordssubstr',
    v: toArray(v).map(vv => `[${vv}]`),
  }),
};
/*
convert json query expression to Bugzilla rest query
https://github.com/mozilla/ActiveData/blob/dev/docs/jx.md
https://github.com/mozilla/ActiveData/blob/dev/docs/jx_expressions.md
https://wiki.mozilla.org/Bugzilla:REST_API
 */
const jx2rest = expr => {
  const output = { query_format: 'advanced' };
  const params = convert(expr);

  params.forEach((e, i) => {
    // SPECIAL CONVERT *.tokenized TO [] TAGS
    if (e.f.endsWith('.tokenized')) {
      const func = tokenizedMap[e.o];

      if (missing(func)) throw Log.error(`can not tokenize operator ${e.o}`);

      const f = func(e);

      Object.entries(f).forEach(([k, v]) => {
        output[k + (i + 1)] = v;
      });
    } else {
      Object.entries(e).forEach(([k, v]) => {
        output[k + (i + 1)] = v;
      });
    }
  });

  return output;
};


const simpleQueryBugzilla = async query => {
  /*
  send json query expression to Bugzilla
   */
  const filter = coalesce(query.where, query.filter);
  const url = URL({
    path: BUGZILLA_REST,
    query: {
      ...jx2rest(filter),
      include_fields: toArray(coalesce(query.select, 'bug_id')).join(','),
      order: coalesce(query.sort, 'bug_id'),
    },
  });

  const response = await fetchJson(url);
  return response.bugs;
};


const getBlockers = async bugId => {
  /*
  GET ALL THE BLOCKING BUGS, RECURSIVELY
   */
  let bugs = toArray(bugId);
  let newBugs = bugs;
  while (newBugs.length > 0) {
    const query = {
      select: 'depends_on',
      where: { eq: { bug_id: newBugs } },
    };
    // eslint-disable-next-line no-await-in-loop
    const children = await simpleQueryBugzilla(query);
    newBugs = selectFrom(children)
      .select('depends_on')
      .flatten()
      .subtract(bugs)
      .union()
      .toArray();
    bugs = selectFrom(bugs)
      .append(...newBugs)
      .union()
      .sort()
      .toArray();
  }
  return bugs;
};


const queryBugzilla = async query => {
  /*
  send json query expression to Bugzilla
   */
  const filter = coalesce(query.where, query.filter);
  // THE root FIELD IS SPECIAL: IT IS CONSIDERED RECURSIVE
  const collated = collate(filter, ['root']);
  const result = await Promise.all(collated.map(async pair => {
    const [root, filter] = pair;

    if (exists(root)) {
      if (missing(root.eq)) {
        Log.error('expecting {"eq":{"root": bugs}}');
      }
      const blockers = await getBlockers(root.eq.root);
      const url = URL({
        path: BUGZILLA_REST,
        query: {
          ...jx2rest({ and: [{ in: { bug_id: blockers } }, filter] }),
          include_fields: coalesce(query.select, 'bug_id').join(','),
          order: coalesce(query.sort, 'bug_id'),
        },
      });

      const result = await fetchJson(url);
      return result.bugs;
    }
    return simpleQueryBugzilla(query);
  }));
  return selectFrom(result).flatten().toArray();
};

const showBugsUrl = query => URL({
  /*
  open a window to show given bugs
   */
  path: BUGZILLA_URL,
  query: {
    ...jx2rest(coalesce(query.where, query.filter)),
    columnlist: coalesce(query.select, DEFAULT_COLUMNLIST).join(','),
    order: coalesce(query.sort, 'Bug Number'),
  },
});

export {
  jx2rest, queryBugzilla, showBugsUrl, BUGZILLA_URL,
};
