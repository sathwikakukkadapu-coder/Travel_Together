import React, { useState } from 'react';
import { validateRequired } from '../../utils/validators';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    newErrors.name    = validateRequired(formData.name, 'Name');
    newErrors.email   = validateRequired(formData.email, 'Email') || 
                        (!/^\S+@\S+\.\S+$/.test(formData.email) ? 'Enter a valid email' : null);
    newErrors.subject = validateRequired(formData.subject, 'Subject');
    newErrors.message = validateRequired(formData.message, 'Message');

    Object.keys(newErrors).forEach((k) => !newErrors[k] && delete newErrors[k]);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-8">
              <h1 className="fw-bold mb-3">Get in Touch</h1>
              <p className="text-muted lead">
                Have questions? We'd love to hear from you. Send us a message and
                we'll respond as soon as possible.
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Contact Form */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm p-4">
                <h4 className="fw-bold mb-4">Send Us a Message</h4>

                {submitted && (
                  <div className="alert alert-success d-flex align-items-center mb-4">
                    <i className="bi bi-check-circle-fill me-2 fs-5" />
                    <div>
                      <strong>Thank you!</strong> Your message has been sent successfully.
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Subject <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="subject"
                        className={`form-control ${errors.subject ? 'is-invalid' : ''}`}
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What's this about?"
                      />
                      {errors.subject && <div className="invalid-feedback">{errors.subject}</div>}
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Message <span className="text-danger">*</span>
                      </label>
                      <textarea
                        name="message"
                        rows="5"
                        className={`form-control ${errors.message ? 'is-invalid' : ''}`}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more..."
                      />
                      {errors.message && <div className="invalid-feedback">{errors.message}</div>}
                    </div>
                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2" />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Contact Info */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm p-4 mb-4">
                <h5 className="fw-bold mb-4">Contact Information</h5>
                <div className="d-flex gap-3 mb-3">
                  <div
                    className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 50, height: 50 }}
                  >
                    <i className="bi bi-envelope-fill text-primary fs-5" />
                  </div>
                  <div>
                    <p className="fw-semibold mb-1">Email</p>
                    <p className="text-muted mb-0 small">hello@traveltogether.in</p>
                  </div>
                </div>
                <div className="d-flex gap-3 mb-3">
                  <div
                    className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 50, height: 50 }}
                  >
                    <i className="bi bi-geo-alt-fill text-primary fs-5" />
                  </div>
                  <div>
                    <p className="fw-semibold mb-1">Location</p>
                    <p className="text-muted mb-0 small">
                      Pune, Maharashtra, India
                    </p>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div
                    className="rounded bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 50, height: 50 }}
                  >
                    <i className="bi bi-clock-fill text-primary fs-5" />
                  </div>
                  <div>
                    <p className="fw-semibold mb-1">Support Hours</p>
                    <p className="text-muted mb-0 small">Mon - Fri: 9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm p-4">
                <h5 className="fw-bold mb-3">Follow Us</h5>
                <div className="d-flex gap-3">
                  {[
                    { icon: 'bi-twitter-x', label: 'Twitter' },
                    { icon: 'bi-instagram', label: 'Instagram' },
                    { icon: 'bi-linkedin', label: 'LinkedIn' },
                    { icon: 'bi-github', label: 'GitHub' },
                  ].map((social, i) => (
                    <a
                      key={i}
                      href="#"
                      className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: 48, height: 48 }}
                      aria-label={social.label}
                    >
                      <i className={`bi ${social.icon} fs-5`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
