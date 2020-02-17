const CONFIG = [
  {
    name: 'github projects',
    filter: {
      or: [
        {
          eq: {
            user: 'mozilla',
            repo: 'bugbug',
            project: 8, // test selection model
          },
        },
        {
          eq: {
            user: 'mozilla',
            repo: 'productivity-tools-projects',
            project: 29, // test selection
          },
        },
        {
          eq: {
            user: 'mozilla',
            repo: 'treeherder',
            project: 2, // push health
          },
        },
      ],
    },
  },
  {
    name: 'bugzilla smart scheduling',
    filter: { eq: { 'status_whiteboard.tokenized': ['smart-sched', 'smart-sched-reserved'] } },
  },

  {
    name: 'Smart Scheduling in CI and on Try',
    filter: { eq: { root: 1603255 } }, // https://bugzilla.mozilla.org/showdependencytree.cgi?id=1603255&hide_resolved=0
  },
  {
    name: 'github labels',
    filter: {
      or: [
        {
          eq: {
            user: 'mozilla',
            repo: 'ci-recipes',
            label: 'smart-sched',
          },
        },
        {
          eq: {
            user: 'mozilla',
            repo: 'mozci',
            label: 'smart-sched',
          },
        },
        {
          eq: {
            user: 'mozilla',
            repo: 'adr',
            label: 'smart-sched',
          },
        },
        {
          eq: {
            user: 'mozilla',
            repo: 'activedata',
            label: 'smart-sched',
          },
        },
      ],
    },

  },
];

// eslint-disable-next-line import/prefer-default-export
export { CONFIG };
