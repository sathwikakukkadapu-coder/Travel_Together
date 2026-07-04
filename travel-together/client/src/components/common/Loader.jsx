import React from 'react';

/**
 * Loader
 * @param {boolean} fullPage — centres the spinner in the full viewport
 * @param {string}  size     — 'sm' | 'md' (default)
 * @param {string}  text     — optional label below the spinner
 */
const Loader = ({ fullPage = false, size = 'md', text = '' }) => {
  const spinnerClass = `spinner-border text-primary ${size === 'sm' ? 'spinner-border-sm' : ''}`;

  if (fullPage) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: '100vh' }}
      >
        <div className={spinnerClass} role="status" aria-label="Loading">
          <span className="visually-hidden">Loading…</span>
        </div>
        {text && <p className="mt-3 text-muted small">{text}</p>}
      </div>
    );
  }

  return (
    <div className="tt-loader">
      <div className="d-flex flex-column align-items-center gap-2">
        <div className={spinnerClass} role="status" aria-label="Loading">
          <span className="visually-hidden">Loading…</span>
        </div>
        {text && <span className="text-muted small">{text}</span>}
      </div>
    </div>
  );
};

export default Loader;
