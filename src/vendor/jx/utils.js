import { Data } from '../datas';
import {
  array, coalesce, exists, isArray, isString, zip,
} from '../utils';
import { combos, selectFrom, toPairs } from '../vectors';
import { Log } from '../logs';

function simpler(v) {
  const vv = v.filter(e => e !== true && exists(e));
  if (vv.length === 0) return null;
  if (vv.length === 1) return vv[0];
  return { and: vv };
}


const collate = (expression, props) => {
  /*
     * Expecting props to be an array of N property names
     * Return a list of expression tuples; meant to represent disjunctive normal form
     * such that
     *   output[x][i] contains expression on props[i]
     *   output[x][N] is expressions on everything else
     */
  const lookup = Data.zip(props.map((p, i) => ([p, i])));

  if (isString(expression)) {
    const inProps = array(props.length + 1).map(() => null);
    const i = coalesce(lookup[expression], props.length);
    inProps[i] = expression;
    return [inProps];
  }

  return toPairs(expression)
    .map((param, op) => {
      if (op === 'or') {
        return selectFrom(param).map(e => collate(e, props)).flatten();
      }
      if (op === 'and') {
        return combos(...param.map(e => collate(e, props)))
          .map(v => zip(...v).map(simpler));
      }

      if (isString(param)) {
        const inProps = array(props.length + 1).map(() => null);
        const i = coalesce(lookup[param], props.length);
        inProps[i] = { [op]: param };
        return [inProps];
      }
      if (isArray(param)) {
        const temp = selectFrom;
        const expressions = temp(param)
          .map(e => collate(e, props)) // array of dis-norm-form
          .flatten() // dis-norm-form
          .zip() // length==N onfor each props
          .enumerate()
          .filter(e => coalesce(...e)) // remove props with nothing
          .materialize(); // non-lazy

        if (expressions.count() !== 1) {
          Log.error('can not split expression {{expr|json}}', { expr: { [op]: param } });
        }

        const i = expressions.map((e, i) => i).first();

        const inProps = array(props.length + 1).map(() => null);
        inProps[i] = { [op]: param };
        return [inProps];
      }

      const inProps = array(props.length + 1).map(() => ([]));
      toPairs(param).forEach((rhs, lhs) => {
        const i = coalesce(lookup[lhs], props.length);
        inProps[i].push({ [op]: { [lhs]: rhs } });
      });

      return [inProps.map(simpler)];
    })
    .flatten()
    .toArray();
};

// eslint-disable-next-line import/prefer-default-export
export { collate };
