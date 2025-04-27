import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles.css';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://d2270c687232a5daa02c0919846bd2e5@o4509219061039104.ingest.us.sentry.io/4509219062153216",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  release: process.env.SENTRY_RELEASE
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);