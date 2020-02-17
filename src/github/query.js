/* eslint-disable camelcase */

import { fetchJson, URL } from '../vendor/requests';
import { Template } from '../vendor/Template';
import { GMTDate as Date, ISO_8601 } from '../vendor/dates';
import { selectFrom } from '../vendor/vectors';
import { coalesce } from '../vendor/utils';
import { collate } from '../vendor/jx/utils';

// EXAMPLE https://github.com/mozilla-mobile/fenix/labels/eng%3Aperformance
const GITHUB_ISSUES = new Template('https://api.github.com/repos/{{owner}}/{{repo}}/issues');

const BURNDOWN = {
  owner: 'mozilla-mobile',
  repo: 'fenix',
  labels: 'eng:performance,P1',
  filter: 'all',
};


async function getIssues({ timeDomain }) {
  const { labels, filter } = BURNDOWN;
  const since = Date.newInstance(timeDomain.min).format(ISO_8601);

  const url = URL({
    path: GITHUB_ISSUES.expand(BURNDOWN),
    query: { labels, filter, since },
  });
  const response = await fetchJson(url);

  const eod = Date.eod();

  const data = selectFrom(timeDomain.partitions)
    .map(p => ({
      date: p.min,
      count: selectFrom(response)
        .filter(({ created_at, closed_at }) => {
          const end = coalesce(Date.newInstance(closed_at), eod);
          const start = Date.newInstance(created_at);

          return !(end < p.min || p.max < start);
        })
        .count(),
    }))
    .toArray();

  // Log.note('{{response}}', { response });

  return {
    axis: { x: { domain: timeDomain } },
    series: [
      {
        label: 'Performance',
        select: { value: 'count' },
      },
      { select: { value: 'date', axis: 'x' } },
    ],
    data,
  };
}

const GITHUB_PROJECT_COLUMNS = new Template('https://api.github.com/repos/{{owner}}/{{repo}}/projects/{{project}}/columns');
const GITHUB_PROJECT_CARDS = new Template('https://api.github.com/repos/{{owner}}/{{repo}}/projects/columns/{{column}}/cards');

async function getProjectCards(filter) {
  const collated = collate(filter, ['owner', 'repo', 'project']);

  const cards = await Promise.all(collated.map(async ([owner, repo, project, filter]) => {
    // get all columns from owner, repo, project
    const get_columns_url = URL({
      path: GITHUB_PROJECT_COLUMNS.expand({ owner, repo, project }),
      query: filter,
    });
    const columns = await fetchJson(get_columns_url);
    return columns.map(async column => {
      const { id } = await column;
      const get_cards_url = GITHUB_PROJECT_CARDS.expand({
        owner, repo, project, column: id,
      });
      return fetchJson(get_cards_url);
    });
  }));

  return cards;
}

export { getIssues, getProjectCards };
