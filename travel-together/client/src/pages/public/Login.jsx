import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validateRequired } from '../../utils/validators';
import { getErrorMessage } from '../../utils/helpers';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    newErrors.email    = validateEmail(formData.email);
    newErrors.password = validateRequired(formData.password, 'Password');
    Object.keys(newErrors).forEach((k) => !newErrors[k] && delete newErrors[k]);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      await login({ email: formData.email, password: formData.password });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card border-0 shadow-lg p-4">
            <div className="text-center mb-4">
              <div
                className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 70, height: 70 }}
              >
                <i className="bi bi-person-circle text-primary fs-1" />
              </div>
              <h2 className="fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted">Login to continue your journey</p>
            </div>

            {serverError && (
              <div className="alert alert-danger d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Password</label>
                <input
                  type="password"
                  name="password"
                  className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    name="remember"
                    className="form-check-input"
                    id="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                  />
                  <label className="form-check-label small" htmlFor="remember">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="small text-decoration-none">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2" />
                    Login
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-muted small mb-0">
                Don't have an account?{' '}
                <Link to="/register" className="fw-semibold text-decoration-none">
                  Sign up free
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-4">
            <Link to="/" className="text-muted small text-decoration-none">
              <i className="bi bi-arrow-left me-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
