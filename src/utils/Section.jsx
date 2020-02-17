import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { DetailsIcon } from './icons';

const LEFT_MARGIN = '1rem';
const styles = {
  content: {
    padding: `0 0 0 ${LEFT_MARGIN}`,
    // width: '100%'
  },
  header: {
    backgroundColor: 'black',
    // width: '100%'
  },
  title: {
    color: 'white',
    // padding: `0 ${-LEFT_MARGIN} 0 ${LEFT_MARGIN}`,
    padding: '.4rem 0 .4rem',
    // width: '100%'
  },
  subtitle: {
    color: '#d1d2d3',
    fontSize: '0.75rem',
    fontWeight: '300',
    paddingLeft: '.9em',
    // width: '100%'
  },
};
const Section = ({
  classes, children, subtitle, title, more,
}) => (
  <div style={{ width: '100%' }}>
    <div className={classes.header}>
      <h2 className={classes.title}>
        <span>
          {title}
          {subtitle && <span className={classes.subtitle}>{subtitle}</span>}
          {more && (
            <span>
              <a href={more} title="show details">
                <DetailsIcon />
              </a>
            </span>
          )}
        </span>
      </h2>
    </div>
    <div className={classes.content}>{children}</div>
  </div>
);

Section.propTypes = {
  classes: PropTypes.shape({}).isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  subtitle: PropTypes.string,
  title: PropTypes.string.isRequired,
};

export default withStyles(styles)(Section);
