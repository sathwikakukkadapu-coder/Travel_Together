import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { validateEmail } from '../../utils/validators';

/**
 * ForgotPassword
 * Collects the user's email and shows a confirmation message.
 * A real reset flow would call POST /api/auth/forgot-password on the backend
 * (not yet implemented server-side — this is the client stub).
 */
const ForgotPassword = () => {
  const [email, setEmail]         = useState('');
  const [error, setError]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    // Simulate API delay — replace with real API call when backend supports it:
    // await api.post('/auth/forgot-password', { email });
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card border-0 shadow-lg p-4">
            <div className="text-center mb-4">
              <div
                className="rounded-circle bg-warning bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 70, height: 70 }}
              >
                <i className="bi bi-lock-fill text-warning fs-1" />
              </div>
              <h2 className="fw-bold mb-2">Forgot Password?</h2>
              <p className="text-muted">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {submitted ? (
              <div className="text-center">
                <div className="alert alert-success d-flex align-items-center">
                  <i className="bi bi-check-circle-fill me-2 fs-5" />
                  <div>
                    <strong>Check your inbox!</strong>
                    <p className="mb-0 small mt-1">
                      If an account exists for <strong>{email}</strong>, a reset link has been sent.
                    </p>
                  </div>
                </div>
                <p className="text-muted small mt-3">
                  Didn't receive it? Check your spam folder or{' '}
                  <button
                    className="btn btn-link btn-sm p-0"
                    onClick={() => setSubmitted(false)}
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className={`form-control form-control-lg ${error ? 'is-invalid' : ''}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                  />
                  {error && <div className="invalid-feedback">{error}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Sending...</>
                    : <><i className="bi bi-send me-2" />Send Reset Link</>}
                </button>
              </form>
            )}
          </div>

          <div className="text-center mt-4">
            <Link to="/login" className="text-muted small text-decoration-none">
              <i className="bi bi-arrow-left me-2" />Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
