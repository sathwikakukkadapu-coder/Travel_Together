import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="tt-footer">
    <div className="container">
      <div className="row g-4">

        {/* Brand + tagline */}
        <div className="col-lg-4">
          <p className="footer-brand mb-2">
            <i className="bi bi-airplane-engines-fill text-primary me-2" />
            Travel Together
          </p>
          <p className="small mb-3" style={{ maxWidth: 300 }}>
            Connect with compatible travel companions and make every journey safer,
            cheaper, and more memorable.
          </p>
          <div className="d-flex gap-3">
            {[
              { icon: 'bi-twitter-x',  href: '#' },
              { icon: 'bi-instagram',  href: '#' },
              { icon: 'bi-linkedin',   href: '#' },
              { icon: 'bi-github',     href: '#' },
            ].map(({ icon, href }) => (
              <a key={icon} href={href} className="fs-5" aria-label={icon}>
                <i className={`bi ${icon}`} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="col-6 col-lg-2">
          <h6 className="text-white fw-semibold mb-3">Quick Links</h6>
          <ul className="list-unstyled small d-flex flex-column gap-2">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/register">Get Started</Link></li>
          </ul>
        </div>

        {/* Features */}
        <div className="col-6 col-lg-2">
          <h6 className="text-white fw-semibold mb-3">Features</h6>
          <ul className="list-unstyled small d-flex flex-column gap-2">
            <li><Link to="/find-buddy">Find Buddy</Link></li>
            <li><Link to="/trips">Trip Planner</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/reviews">Reviews</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="col-lg-4">
          <h6 className="text-white fw-semibold mb-3">Contact</h6>
          <ul className="list-unstyled small d-flex flex-column gap-2">
            <li className="d-flex align-items-center gap-2">
              <i className="bi bi-envelope text-primary" />
              <span>hello@traveltogether.in</span>
            </li>
            <li className="d-flex align-items-center gap-2">
              <i className="bi bi-geo-alt text-primary" />
              <span>Pune, Maharashtra, India</span>
            </li>
          </ul>
        </div>

      </div>

      <hr style={{ borderColor: '#2d3139', marginTop: '2rem' }} />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <p className="small mb-0">
          © {new Date().getFullYear()} Travel Together. All rights reserved.
        </p>
        <p className="small mb-0">
          Built with <i className="bi bi-heart-fill text-danger" /> for college mini project
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
