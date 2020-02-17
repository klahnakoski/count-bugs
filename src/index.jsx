/* global document */
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import './index.css';
import Routes from './routes';

require('typeface-roboto');

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div>
          <p style={{ textAlign: 'center', fontSize: '1.5em' }}>
            <span>
            There has been a critical error:
              <a
                href="https://github.com/klahnakoski/bug-count/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
              Report issue
              </a>
            </span>
          </p>
          <p>
            {error}
          </p>
          <p>{info}</p>

        </div>
      );
    }

    return this.props.children;
  }
}
const root = document.getElementById('root');
const load = () => render(
  <AppContainer>
    <GlobalErrorBoundary>
      <Routes />
    </GlobalErrorBoundary>
  </AppContainer>,
  root,
);

// This is needed for Hot Module Replacement
if (module.hot) {
  module.hot.accept('./routes', load);
}

load();
