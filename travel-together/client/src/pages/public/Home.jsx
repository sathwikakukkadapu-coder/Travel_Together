import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: 'bi-people-fill',
      title: 'Smart Matching',
      desc: 'Our algorithm finds compatible travel buddies based on interests, budget, and destinations.',
    },
    {
      icon: 'bi-shield-check-fill',
      title: 'Safe & Verified',
      desc: 'Review system and verified profiles ensure trustworthy connections.',
    },
    {
      icon: 'bi-wallet2',
      title: 'Budget Friendly',
      desc: 'Share costs, find budget-compatible companions, and travel more for less.',
    },
    {
      icon: 'bi-chat-dots-fill',
      title: 'Easy Communication',
      desc: 'Built-in chat system to plan trips and coordinate with your travel buddies.',
    },
  ];

  const destinations = [
    { name: 'Goa', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400', trips: 45 },
    { name: 'Manali', img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400', trips: 38 },
    { name: 'Ladakh', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', trips: 52 },
    { name: 'Kerala', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400', trips: 29 },
  ];

  const steps = [
    { icon: 'bi-person-plus-fill', title: 'Create Profile', desc: 'Sign up and complete your travel preferences' },
    { icon: 'bi-search', title: 'Find Matches', desc: 'Search for compatible travel companions' },
    { icon: 'bi-calendar-check', title: 'Plan Trip', desc: 'Connect and plan your adventure together' },
    { icon: 'bi-airplane-engines-fill', title: 'Travel Together', desc: 'Enjoy a safe and memorable journey' },
  ];

  const testimonials = [
    {
      name: 'Priya Mehta',
      location: 'Mumbai',
      avatar: 'PM',
      text: 'Found an amazing travel buddy for my Ladakh trip. The matching algorithm is spot on!',
      rating: 5,
    },
    {
      name: 'Rahul Verma',
      location: 'Delhi',
      avatar: 'RV',
      text: 'Saved so much on my Goa trip by sharing costs. Great platform for solo travelers!',
      rating: 5,
    },
    {
      name: 'Anjali Singh',
      location: 'Bangalore',
      avatar: 'AS',
      text: 'Made lifelong friends through this platform. Highly recommend for female solo travelers.',
      rating: 5,
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="tt-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-3">
                Find Your Perfect<br />Travel Companion
              </h1>
              <p className="lead mb-4" style={{ fontSize: '1.1rem' }}>
                Connect with like-minded travelers, share experiences, and make every
                journey safer, cheaper, and more memorable.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                {isAuthenticated ? (
                  <>
                    <Link to="/find-buddy" className="btn btn-light btn-lg px-4">
                      <i className="bi bi-search me-2" />Find Travel Buddy
                    </Link>
                    <Link to="/dashboard" className="btn btn-outline-light btn-lg px-4">
                      Go to Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-light btn-lg px-4">
                      <i className="bi bi-person-plus me-2" />Get Started Free
                    </Link>
                    <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                      Login
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-4 d-flex gap-4 text-white small">
                <div><i className="bi bi-check-circle-fill me-2" />Free to Join</div>
                <div><i className="bi bi-check-circle-fill me-2" />Verified Profiles</div>
                <div><i className="bi bi-check-circle-fill me-2" />Secure Platform</div>
              </div>
            </div>
            <div className="col-lg-6">
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600"
                alt="Travelers"
                className="img-fluid rounded shadow-lg"
                style={{ maxHeight: 400, width: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Why Choose Travel Together?</h2>
            <p className="text-muted" style={{ maxWidth: 600, margin: '0 auto' }}>
              Join thousands of travelers who've found their perfect travel companions
              through our smart matching platform.
            </p>
          </div>
          <div className="row g-4">
            {features.map((f, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="card border-0 h-100 text-center p-4 shadow-sm">
                  <div
                    className="rounded-circle bg-primary bg-opacity-10 mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{ width: 70, height: 70 }}
                  >
                    <i className={`bi ${f.icon} text-primary fs-2`} />
                  </div>
                  <h5 className="fw-bold mb-2">{f.title}</h5>
                  <p className="text-muted small mb-0">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">Popular Destinations</h2>
            <p className="text-muted">Explore the most sought-after travel spots</p>
          </div>
          <div className="row g-4">
            {destinations.map((d, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="card border-0 overflow-hidden shadow-sm h-100">
                  <div className="position-relative" style={{ height: 200 }}>
                    <img
                      src={d.img}
                      alt={d.name}
                      className="w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{
                        background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,.6))',
                      }}
                    />
                    <div className="position-absolute bottom-0 start-0 p-3 text-white">
                      <h5 className="fw-bold mb-1">{d.name}</h5>
                      <small>{d.trips} upcoming trips</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">How It Works</h2>
            <p className="text-muted">Get started in 4 simple steps</p>
          </div>
          <div className="row g-4">
            {steps.map((s, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="text-center">
                  <div
                    className="rounded-circle bg-primary text-white mx-auto mb-3 d-flex align-items-center justify-content-center fw-bold position-relative"
                    style={{ width: 80, height: 80, fontSize: '2rem' }}
                  >
                    <i className={`bi ${s.icon}`} />
                    <span
                      className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-secondary"
                      style={{ fontSize: '.75rem' }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h5 className="fw-bold mb-2">{s.title}</h5>
                  <p className="text-muted small">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-3">What Our Travelers Say</h2>
            <p className="text-muted">Real experiences from real travelers</p>
          </div>
          <div className="row g-4">
            {testimonials.map((t, i) => (
              <div key={i} className="col-lg-4">
                <div className="card border-0 shadow-sm h-100 p-4">
                  <div className="mb-3">
                    {[...Array(t.rating)].map((_, j) => (
                      <i key={j} className="bi bi-star-fill text-warning" />
                    ))}
                  </div>
                  <p className="mb-4 text-muted">"{t.text}"</p>
                  <div className="d-flex align-items-center gap-3 mt-auto">
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                      style={{ width: 48, height: 48 }}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p className="fw-semibold mb-0">{t.name}</p>
                      <small className="text-muted">{t.location}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-primary text-white">
        <div className="container text-center">
          <h2 className="fw-bold mb-3">Ready to Start Your Adventure?</h2>
          <p className="lead mb-4" style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
            Join thousands of travelers finding their perfect companions every day.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-light btn-lg px-5">
              Sign Up Now — It's Free
            </Link>
          )}
        </div>
      </section>
    </>
  );
};

export default Home;
