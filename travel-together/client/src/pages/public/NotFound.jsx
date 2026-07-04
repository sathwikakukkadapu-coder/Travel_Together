import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="d-flex flex-column align-items-center justify-content-center text-center"
       style={{ minHeight: '100vh', padding: '2rem' }}>
    <i className="bi bi-compass display-1 text-primary mb-3" />
    <h1 className="fw-bold mb-2">404</h1>
    <h2 className="h4 text-muted mb-4">Page Not Found</h2>
    <p className="text-muted mb-4" style={{ maxWidth: 400 }}>
      Looks like this destination doesn't exist on our map.
      Let's get you back on track.
    </p>
    <Link to="/" className="btn btn-primary px-4">
      <i className="bi bi-house me-2" />Back to Home
    </Link>
  </div>
);

export default NotFound;
