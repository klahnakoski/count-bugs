/* eslint-disable camelcase */
import { fetchJson, URL } from './requests';
import {
  array, exists, first, missing, toArray,
} from './utils';
import { selectFrom, toPairs } from './vectors';
import jx from './jx/expressions';
import { Log } from './logs';
import { ceiling } from './math';
import { delayedValue } from './signals';
import { collate } from './jx/utils';

const DEBUG = false;
const MAX_CHUNK_SIZE = 40; // NUMBER OF SIGNATURES FROM PERFHERDER
const MIN_CHUNK_SIZE = 10; // ACCUMULATE SIGNATURE REQUESTS TO A SINGLE REQUEST
const PERFHERDER = {
  signatures: [],
};
const TREEHERDER = 'https://treeherder.mozilla.org';
const getAllOptions = (async () => {
  const output = await fetchJson(
    URL({ path: [TREEHERDER, 'api/optioncollectionhash/'] }),
    { expire: 'month' },
  );

  return selectFrom(output)
    .map(({ option_collection_hash, options }) => [
      first(options).name,
      option_collection_hash,
    ])
    .args()
    .fromPairs();
})();
const frameworkCache = {};
const getFramework = async ({ repo, framework }) => {
  const comboString = JSON.stringify({ repo, framework });

  if (frameworkCache[comboString] === undefined) {
    frameworkCache[comboString] = (async () => {
      const url = URL({
        path: [TREEHERDER, 'api/project', repo, 'performance/signatures/'],
        query: { framework, subtests: 1 },
      });
      const rawData = await fetchJson(url, { expire: 'month' });
      // ADD OPTION SIGNATURES
      const lookup = await getAllOptions;
      const clean = toPairs(rawData)
        .map((meta, signature) => {
          const { suite, test, lower_is_better } = meta;
          const cleanTest = (() => {
            if (missing(test)) return null;

            if (test === suite) return null;

            if (test.startsWith(suite)) return test.slice(suite.length + 1);

            return test;
          })();
          let lowerIsBetter = lower_is_better;
          let unit = 'Score';

          if (suite.includes('youtube-playback')) {
            lowerIsBetter = true;
            unit = 'count';

            if (exists(test) && test.includes('%')) {
              unit = '';
            }
          } else if (suite.endsWith('-power')) {
            lowerIsBetter = true;
            unit = 'mAh';
          } else if (lower_is_better === undefined) {
            if (
              [
                'raptor-speedometer',
                'raptor-stylebench',
                'raptor-wasm',
                'raptor-motionmark',
                'raptor-sunspider',
                'raptor-webaudio',
                'raptor-unity',
              ].some(prefix => suite.startsWith(prefix))
            ) {
              lowerIsBetter = false;
            } else if (
              [
                'raptor-tp6',
                'raptor-firefox',
                'raptor-chrome',
                'raptor-google',
                'raptor-assorted-dom',
                'tp4',
                'tp5',
              ].some(prefix => suite.startsWith(prefix))
            ) {
              lowerIsBetter = true;
              unit = 'Duration';
            } else {
              if (DEBUG) {
                Log.note('Do not have direction for {{suite}}', { suite });
              }

              lowerIsBetter = false;
              unit = 'Score';
            }
          }

          return {
            signature,
            suite,
            test: cleanTest,
            lowerIsBetter,
            unit,
            options: lookup[meta.option_collection_hash],
            extraOptions: toArray(meta.extra_options).sort(),
            platform: meta.machine_platform,
            parent: meta.parent_signature,
            id: meta.id,
            framework: meta.framework_id,
            repo,
          };
        })
        .toArray();

      PERFHERDER.signatures.push(...clean);
    })();
  }

  await frameworkCache[comboString];
};


const dataCache = {}; // MAP FROM SIGNATURE TO PROMISE OF DATA
const activeFetch = {}; // MAP FROM repo TO COUNT OF ACTIVE FETCHES
const pendingFetch = {}; // MAP FROM repo TO LIST OF PENDING

function internalFetch(repo, todo) {
  // LANCH PROMISE CHAIN TO GET THE DATA, AND then RELEASE SIGNAL
  let pending = pendingFetch[repo];

  if (pending === undefined) {
    pending = [];
    pendingFetch[repo] = pending;
    activeFetch[repo] = 0;
  }

  pending.push(...todo);

  array(ceiling(pending.length / MAX_CHUNK_SIZE)).forEach(() => {
    (async () => {
      while (
        // WE ARE NOT JUST CHUNKING, BUT ALSO ACCUMULATING MULTIPLE REQUESTS
        // INTO CHUNKS
        // LOOPS TWICE, OR LESS
        (activeFetch[repo] > 0 && pending.length >= MIN_CHUNK_SIZE)
        || (activeFetch[repo] === 0 && pending.length > 0)
      ) {
        const todo = selectFrom(pending.slice(0, MAX_CHUNK_SIZE));

        pending.splice(0, MAX_CHUNK_SIZE);

        const url = URL({
          path: [TREEHERDER, 'api/project', repo, 'performance/data/'],
          query: { signatures: todo.select('signature') },
        });
        let data = null;

        try {
          activeFetch[repo] += 1;

          // eslint-disable-next-line no-await-in-loop
          data = await fetchJson(url);
        } finally {
          activeFetch[repo] -= 1;
        }

        todo.forEach(meta => {
          dataCache[meta.signature].resolve({
            meta,
            data: data[meta.signature].map(row => ({
              ...row,
              meta,
            })),
          });
        });
      }
    })();
  });
}

const getDataBySignature = async metadatas => {
  // SCHEDULE ANY MISSING SIGNATURES
  selectFrom(metadatas)
    .groupBy('repo')
    .forEach((sigs, repo) => {
      const todo = sigs.filter(({ signature }) => missing(dataCache[signature]));

      todo.forEach(meta => {
        dataCache[meta.signature] = delayedValue();
      });
      internalFetch(repo, todo);
    });

  return Promise.all(toArray(metadatas).map(m => dataCache[m.signature]));
};

/*
return a list of {meta, data} objects, each representing
a perfhereder signature that matches the given filter
 */
const getData = async condition => {
  const collated = collate(condition, ['push_timestamp', 'repo', 'framework']);

  const results = await Promise.all(collated
    .map(async ([pushDate, repo, framework, rest]) => {
      if (missing(repo) || missing(framework)) {
        Log.error('expecting expression to have both repo and framework');
      }
      await getFramework({ repo: repo.eq.repo, framework: framework.eq.framework });

      Log.note('scan {{num}} signatures', { num: PERFHERDER.signatures.length });

      const signatures = PERFHERDER.signatures.filter(jx(rest));
      const data = await getDataBySignature(signatures);

      if (missing(pushDate)) return data;

      return selectFrom(data)
        .map(({ data, ...rest }) => ({
          data: data.filter(jx(pushDate)),
          ...rest,
        }));
    }));

  return selectFrom(results).flatten();
};

export {
  getAllOptions, getData, TREEHERDER, PERFHERDER, getFramework,
};
