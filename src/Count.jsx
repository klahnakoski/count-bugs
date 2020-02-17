/* eslint-disable react/no-array-index-key */
import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';
import Section from './utils/Section';
import BugzillaGraph from './bugzilla/BugzillaGraph';
import { TimeDomain } from './vendor/jx/domains';

class Android extends Component {
  render() {
    const timeDomain = new TimeDomain({ past: '3month', interval: 'day' });

    return (
      <Grid container spacing={1}>
        <Grid item xs={12} key="github">
          <Section title="Bug Counts">
            <Grid container spacing={1}>
              {/* <Grid item xs={6}> */}
              {/*  <GithubGraph */}
              {/*    title={( */}
              {/*      <span> */}
              {/*        Firefox Preview P1 Performance Bugs */}
              {/*        <a */}
              {/*          target="_blank" */}
              {/*          rel="noopener noreferrer" */}
              {/*          href="https://github.com/mozilla-mobile/fenix/issues?q=is%3Aopen+is%3Aissue+label%3Aeng%3Aperformance+label%3AP1" */}
              {/*          title="Firefox Preview P1 performance bugs" */}
              {/*        > */}
              {/*          <LinkIcon /> */}
              {/*        </a> */}
              {/*      </span> */}
              {/*    )} */}
              {/*    timeDomain={timeDomain} */}
              {/*  /> */}
              {/* </Grid> */}
              <Grid item xs={6}>
                <BugzillaGraph
                  title={(
                    <span>
                      Bugs
                    </span>
                  )}
                  timeDomain={timeDomain}
                  queries={[
                    {
                      label: 'Bugs',
                      filter: { eq: { root: 1603255 } },
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
