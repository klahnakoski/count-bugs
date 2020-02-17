/* eslint-disable react/no-array-index-key */
import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';
import Section from './utils/Section';
import BugzillaGraph from './bugzilla/BugzillaGraph';
import { TimeDomain } from './vendor/jx/domains';
import { LinkIcon } from './utils/icons';
import { showBugsUrl } from './bugzilla/query';
import GithubGraph from './github/GithubGraph';

class Android extends Component {
  render() {
    const timeDomain = new TimeDomain({ past: '3month', interval: 'day' });

    return (
      <Grid container spacing={1}>
        <Grid item xs={12} key="github">
          <Section title="Bug Counts">
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <GithubGraph
                  title={(
                    <span>
                      Firefox Preview P1 Performance Bugs
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://github.com/mozilla-mobile/fenix/issues?q=is%3Aopen+is%3Aissue+label%3Aeng%3Aperformance+label%3AP1"
                        title="Firefox Preview P1 performance bugs"
                      >
                        <LinkIcon />
                      </a>
                    </span>
                  )}
                  timeDomain={timeDomain}
                />
              </Grid>
              <Grid item xs={6}>
                <BugzillaGraph
                  title={(
                    <span>
                      Firefox Preview Bugs
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={showBugsUrl({
                          filter: {
                            and: [
                              {
                                or: [
                                  { eq: { product: 'Geckoview' } },
                                  {
                                    prefix: {
                                      'status_whiteboard.tokenized':
                                                        'geckoview:',
                                    },
                                  },
                                ],
                              },
                              {
                                or: [
                                  { eq: { priority: ['P1', '--'] } },
                                  { missing: 'priority' },
                                ],
                              },
                              {
                                or: [
                                  { eq: { resolution: '---' } },
                                  { missing: 'resolution' },
                                ],
                              },
                            ],
                          },
                        })}
                        title="All Geckoview P1 and Triage bugs"
                      >
                        <LinkIcon />
                      </a>
                    </span>
                                    )}
                  timeDomain={timeDomain}
                  queries={[
                    {
                      label: 'GV P1 Bugs',
                      filter: {
                        and: [
                          {
                            or: [
                              { eq: { product: 'Geckoview' } },
                              {
                                prefix: {
                                  'status_whiteboard.tokenized': 'geckoview:',
                                },
                              },
                            ],
                          },
                          {
                            or: [
                              { eq: { priority: ['P1', '--'] } },
                              { missing: 'priority' },
                            ],
                          },
                          {
                            or: [
                              { eq: { resolution: ['---', 'FIXED'] } },
                              { missing: 'resolution' },
                            ],
                          },
                        ],
                      },
                    },
                    {
                      label: 'GV P2 Bugs',
                      filter: {
                        and: [
                          {
                            or: [
                              { eq: { product: 'Geckoview' } },
                              {
                                prefix: {
                                  'status_whiteboard.tokenized': 'geckoview:',
                                },
                              },
                            ],
                          },
                          { eq: { priority: 'P2' } },
                          {
                            or: [
                              { eq: { resolution: ['---', 'FIXED'] } },
                              { missing: 'resolution' },
                            ],
                          },
                        ],
                      },
                    },
                    {
                      label: 'GV P3 Bugs',
                      filter: {
                        and: [
                          {
                            or: [
                              { eq: { product: 'Geckoview' } },
                              {
                                prefix: {
                                  'status_whiteboard.tokenized': 'geckoview:',
                                },
                              },
                            ],
                          },
                          { eq: { priority: 'P3' } },
                          {
                            or: [
                              { eq: { resolution: ['---', 'FIXED'] } },
                              { missing: 'resolution' },
                            ],
                          },
                        ],
                      },
                    },
                  ]}
                />
              </Grid>
            </Grid>
          </Section>
        </Grid>

      </Grid>
    );
  }
}

export default Android;
