import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRequired,
  runValidations,
} from '../../utils/validators';
import { getErrorMessage } from '../../utils/helpers';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (serverError) setServerError('');
  };

  const validate = () => {
    const { errors: errs, isValid } = runValidations({
      name:            () => validateName(formData.name),
      email:           () => validateEmail(formData.email),
      password:        () => validatePassword(formData.password),
      confirmPassword: () => validateConfirmPassword(formData.password, formData.confirmPassword),
      age:             () => {
        if (!formData.age) return 'Age is required';
        const n = Number(formData.age);
        if (!Number.isInteger(n) || n < 18 || n > 100) return 'Age must be between 18 and 100';
        return null;
      },
      gender: () => validateRequired(formData.gender, 'Gender'),
    });
    setErrors(errs);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError('');

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        age: Number(formData.age),
        gender: formData.gender,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6 col-md-8">
          <div className="card border-0 shadow-lg p-4">
            {/* Header */}
            <div className="text-center mb-4">
              <div
                className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 70, height: 70 }}
              >
                <i className="bi bi-person-plus-fill text-success fs-1" />
              </div>
              <h2 className="fw-bold mb-1">Create Account</h2>
              <p className="text-muted mb-0">Join thousands of travel buddies worldwide</p>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2" />
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div className="mb-3">
                <label htmlFor="reg-name" className="form-label fw-semibold">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label htmlFor="reg-email" className="form-label fw-semibold">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  id="reg-email"
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

              {/* Age & Gender row */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label htmlFor="reg-age" className="form-label fw-semibold">
                    Age <span className="text-danger">*</span>
                  </label>
                  <input
                    id="reg-age"
                    type="number"
                    name="age"
                    min="18"
                    max="100"
                    className={`form-control form-control-lg ${errors.age ? 'is-invalid' : ''}`}
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="25"
                  />
                  {errors.age && <div className="invalid-feedback">{errors.age}</div>}
                </div>
                <div className="col-md-6">
                  <label htmlFor="reg-gender" className="form-label fw-semibold">
                    Gender <span className="text-danger">*</span>
                  </label>
                  <select
                    id="reg-gender"
                    name="gender"
                    className={`form-select form-select-lg ${errors.gender ? 'is-invalid' : ''}`}
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer not to say">Prefer not to say</option>
                  </select>
                  {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                </div>
              </div>

              {/* Password */}
              <div className="mb-3">
                <label htmlFor="reg-password" className="form-label fw-semibold">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label htmlFor="reg-confirm" className="form-label fw-semibold">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  name="confirmPassword"
                  className={`form-control form-control-lg ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword}</div>
                )}
              </div>

              {/* Terms notice */}
              <p className="text-muted small mb-4">
                By creating an account you agree to our Terms of Service and Privacy Policy.
              </p>

              <button
                type="submit"
                className="btn btn-success btn-lg w-100 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-check-fill me-2" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-muted small mb-0">
                Already have an account?{' '}
                <Link to="/login" className="fw-semibold text-decoration-none">
                  Sign in
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

export default Register;
