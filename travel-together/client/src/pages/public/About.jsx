import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  const team = [
    { name: 'Arjun Sharma', role: 'Full Stack Developer', avatar: 'AS', bio: 'MERN Stack Expert' },
    { name: 'Priya Patel', role: 'UI/UX Designer', avatar: 'PP', bio: 'Design & User Experience' },
    { name: 'Rahul Kumar', role: 'Backend Developer', avatar: 'RK', bio: 'API & Database Specialist' },
    { name: 'Anjali Mehta', role: 'Frontend Developer', avatar: 'AM', bio: 'React & Bootstrap Expert' },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '500+', label: 'Trips Planned' },
    { value: '95%', label: 'Match Success' },
    { value: '4.8', label: 'Average Rating' },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <div className="container py-4">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-3">About Travel Together</h1>
              <p className="lead mb-0">
                Connecting solo travelers to create safer, cheaper, and more
                memorable journeys around the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600"
                alt="Travel"
                className="img-fluid rounded shadow"
                style={{ maxHeight: 400, width: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="col-lg-6">
              <h2 className="fw-bold mb-3">Our Story</h2>
              <p className="text-muted mb-3">
                Travel Together was born from a simple observation: many people dream of
                traveling but hesitate due to safety concerns, high costs, or the loneliness
                of solo travel.
              </p>
              <p className="text-muted mb-3">
                We built this platform to solve these problems by connecting compatible
                travelers who share similar interests, budgets, and destinations. Our
                smart matching algorithm ensures you find the right companion for every
                journey.
              </p>
              <p className="text-muted mb-4">
                This is our college mini project built using the MERN stack (MongoDB,
                Express.js, React.js, Node.js) with Bootstrap 5 for a modern, responsive
                design.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                <div className="px-3 py-2 bg-light rounded">
                  <i className="bi bi-check-circle-fill text-success me-2" />
                  <strong>React JS</strong>
                </div>
                <div className="px-3 py-2 bg-light rounded">
                  <i className="bi bi-check-circle-fill text-success me-2" />
                  <strong>Node.js</strong>
                </div>
                <div className="px-3 py-2 bg-light rounded">
                  <i className="bi bi-check-circle-fill text-success me-2" />
                  <strong>MongoDB</strong>
                </div>
                <div className="px-3 py-2 bg-light rounded">
                  <i className="bi bi-check-circle-fill text-success me-2" />
                  <strong>Bootstrap 5</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4 text-center">
            {stats.map((s, i) => (
              <div key={i} className="col-6 col-lg-3">
                <div className="card border-0 shadow-sm p-4">
                  <h2 className="display-4 fw-bold text-primary mb-2">{s.value}</h2>
                  <p className="text-muted mb-0">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 p-4">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                  style={{ width: 70, height: 70 }}
                >
                  <i className="bi bi-bullseye text-primary fs-2" />
                </div>
                <h3 className="fw-bold mb-3">Our Mission</h3>
                <p className="text-muted mb-0">
                  To empower travelers by creating a safe, reliable platform where they
                  can find compatible travel companions, share costs, and create
                  unforgettable experiences together. We believe travel should be
                  accessible to everyone, regardless of budget or circumstances.
                </p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 p-4">
                <div
                  className="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                  style={{ width: 70, height: 70 }}
                >
                  <i className="bi bi-eye text-secondary fs-2" />
                </div>
                <h3 className="fw-bold mb-3">Our Vision</h3>
                <p className="text-muted mb-0">
                  To become the go-to platform for solo travelers worldwide, fostering
                  a global community built on trust, shared experiences, and cultural
                  exchange. We envision a world where no one travels alone unless they
                  choose to.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Meet Our Team</h2>
            <p className="text-muted">The minds behind Travel Together</p>
          </div>
          <div className="row g-4 justify-content-center">
            {team.map((t, i) => (
              <div key={i} className="col-sm-6 col-lg-3">
                <div className="card border-0 shadow-sm text-center p-4 h-100">
                  <div
                    className="rounded-circle bg-primary text-white mx-auto mb-3 d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: 80, height: 80, fontSize: '1.5rem' }}
                  >
                    {t.avatar}
                  </div>
                  <h5 className="fw-bold mb-1">{t.name}</h5>
                  <p className="text-primary small mb-2">{t.role}</p>
                  <p className="text-muted small mb-0">{t.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 bg-primary text-white">
        <div className="container text-center">
          <h2 className="fw-bold mb-3">Join Our Community</h2>
          <p className="lead mb-4">
            Be part of the Travel Together family and start your journey today.
          </p>
          <Link to="/register" className="btn btn-light btn-lg px-5">
            Get Started Free
          </Link>
        </div>
      </section>
    </>
  );
};

export default About;
