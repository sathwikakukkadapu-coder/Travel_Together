import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import matchService from '../../services/matchService';
import tripService from '../../services/tripService';
import { getInitials, classifyScore, formatBudget, formatDate, getErrorMessage } from '../../utils/helpers';

/* ── Reusable sub-components ─────────────────────────────── */
const Avatar = ({ name, avatar, size = 72 }) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-circle object-fit-cover border border-2 border-white shadow-sm"
        width={size}
        height={size}
      />
    );
  }
  return (
    <div
      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center
                 justify-content-center fw-bold text-primary border border-2 border-white shadow-sm"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {getInitials(name)}
    </div>
  );
};

/* Animated SVG score ring */
const ScoreRing = ({ score, size = 80 }) => {
  const { label, color } = classifyScore(score);
  const r     = (size - 10) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;

  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#e9ecef" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <div className="position-absolute text-center">
        <div className="fw-bold lh-1" style={{ fontSize: size * 0.22, color }}>{score}%</div>
        <div style={{ fontSize: size * 0.13, color, opacity: .8 }}>{label}</div>
      </div>
    </div>
  );
};

/* Breakdown bar row */
const BreakdownBar = ({ label, score, weight }) => {
  const { color } = classifyScore(score);
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between small mb-1">
        <span className="fw-semibold">{label}</span>
        <span className="text-muted">{score}% <small>({weight})</small></span>
      </div>
      <div className="progress" style={{ height: 7 }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{ width: `${score}%`, backgroundColor: color, transition: 'width .5s ease' }}
          aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}
        />
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────── */
const FindBuddy = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    destination: '', startDate: '', endDate: '',
    minBudget: '', maxBudget: '', interests: [],
    travelStyle: '', gender: '', minScore: 40,
  });

  const [filterOptions, setFilterOptions] = useState({
    interests: [], travelStyles: [], genders: [],
  });

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // ── Trip search state ─────────────────────────────────
  const [trips, setTrips]               = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError]     = useState('');
  const [tripsSearched, setTripsSearched] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await matchService.getFilterOptions();
        setFilterOptions(res.data.data || {});
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interest) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSearch = useCallback(
    async (newPage = 1) => {
      setLoading(true);
      setError('');
      // Reset trip results for a fresh search
      setTrips([]);
      setTripsError('');
      setTripsSearched(false);
      try {
        const params = {
          page: newPage, limit: 12,
          ...filters,
          interests: filters.interests.join(','),
        };
        const res = await matchService.getMatches(params);
        setMatches(res.data.data || []);
        setPage(res.data.page || 1);
        setTotalPages(res.data.totalPages || 1);
        setTotalMatches(res.data.total || 0);
        setSearched(true);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }

      // ── Also search trips by destination ──────────────
      if (filters.destination?.trim()) {
        setTripsLoading(true);
        try {
          const tripParams = { destination: filters.destination.trim(), limit: 20 };
          if (filters.startDate) tripParams.startDate = filters.startDate;
          if (filters.endDate)   tripParams.endDate   = filters.endDate;
          const tripRes = await tripService.getTrips(tripParams);
          setTrips(tripRes.data?.data || []);
        } catch (err) {
          setTripsError(getErrorMessage(err));
        } finally {
          setTripsLoading(false);
          setTripsSearched(true);
        }
      }
    },
    [filters]
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      handleSearch(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewBreakdown = (match) => {
    setSelectedMatch(match);
    setShowBreakdown(true);
  };

  return (
    <div className="container-fluid">
      <div className="tt-page-header">
        <h2><i className="bi bi-people-fill me-2 text-primary" />Find Travel Buddy</h2>
        <p className="text-muted">Discover compatible travel companions using our smart matching algorithm</p>
      </div>

      {/* Filters Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h6 className="fw-bold mb-3"><i className="bi bi-funnel me-2" />Search Filters</h6>
          <div className="row g-3">
            <div className="col-md-6 col-lg-3">
              <label className="form-label small fw-semibold">Destination</label>
              <input type="text" className="form-control" name="destination"
                placeholder="e.g. Goa, Manali" value={filters.destination}
                onChange={handleFilterChange} />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label small fw-semibold">Start Date</label>
              <input type="date" className="form-control" name="startDate"
                value={filters.startDate} onChange={handleFilterChange} />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label small fw-semibold">End Date</label>
              <input type="date" className="form-control" name="endDate"
                value={filters.endDate} onChange={handleFilterChange} />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label small fw-semibold">Travel Style</label>
              <select className="form-select" name="travelStyle"
                value={filters.travelStyle} onChange={handleFilterChange}>
                <option value="">Any Style</option>
                {filterOptions.travelStyles?.map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label small fw-semibold">Min Budget (₹)</label>
              <input type="number" className="form-control" name="minBudget"
                placeholder="10000" value={filters.minBudget} onChange={handleFilterChange} />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label small fw-semibold">Max Budget (₹)</label>
              <input type="number" className="form-control" name="maxBudget"
                placeholder="50000" value={filters.maxBudget} onChange={handleFilterChange} />
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label small fw-semibold">Gender Preference</label>
              <select className="form-select" name="gender"
                value={filters.gender} onChange={handleFilterChange}>
                <option value="">Any Gender</option>
                {filterOptions.genders?.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-3">
              <label className="form-label small fw-semibold">Min Match Score</label>
              <input type="range" className="form-range mt-2" name="minScore"
                min="0" max="100" step="5" value={filters.minScore}
                onChange={handleFilterChange} />
              <div className="text-center small fw-semibold text-primary">{filters.minScore}%</div>
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold d-block mb-2">Interests</label>
              <div className="d-flex flex-wrap gap-2">
                {filterOptions.interests?.map((interest) => (
                  <button key={interest} type="button"
                    className={`btn btn-sm ${filters.interests.includes(interest)
                      ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleInterestToggle(interest)}>
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-12">
              <button className="btn btn-primary px-4" onClick={() => handleSearch(1)}
                disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Searching...</>
                ) : (
                  <><i className="bi bi-search me-2" />Search Buddies</>
                )}
              </button>
              <button className="btn btn-outline-secondary ms-2"
                onClick={() => {
                  setFilters({ destination: '', startDate: '', endDate: '',
                    minBudget: '', maxBudget: '', interests: [],
                    travelStyle: '', gender: '', minScore: 40, });
                  setSearched(false); setMatches([]);
                  setTrips([]); setTripsSearched(false); setTripsError('');
                }}>
                <i className="bi bi-arrow-clockwise me-2" />Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2" />{error}
        </div>
      )}

      {loading && (
        <div className="tt-loader">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* ── Trip Results Section ─────────────────────────── */}
      {filters.destination?.trim() && (tripsLoading || tripsSearched) && (
        <div className="mb-4">
          <h5 className="fw-semibold mb-3">
            <i className="bi bi-map-fill text-success me-2" />
            Trips to{' '}
            <span className="text-success text-capitalize">{filters.destination.trim()}</span>
          </h5>

          {tripsLoading && (
            <div className="tt-loader">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading trips...</span>
              </div>
            </div>
          )}

          {tripsError && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-2" />{tripsError}
            </div>
          )}

          {!tripsLoading && tripsSearched && trips.length === 0 && (
            <div className="card border-0 shadow-sm text-center py-5">
              <i className="bi bi-map fs-1 text-muted opacity-25 d-block mb-3" />
              <p className="text-muted mb-3">
                Sorry, no trips found for this destination. Be the first traveler and create a trip.
              </p>
              <div>
                <Link to="/trips?tab=create" className="btn btn-success">
                  <i className="bi bi-plus-circle me-2" />Create Trip
                </Link>
              </div>
            </div>
          )}

          {!tripsLoading && trips.length > 0 && (
            <>
              <p className="text-muted small mb-3">
                Found <strong>{trips.length}</strong> trip{trips.length !== 1 ? 's' : ''} —
                join one or connect with the trip creator to travel together.
              </p>
              <div className="row g-3 mb-2">
                {trips.map((trip) => {
                  const now      = new Date();
                  const start    = new Date(trip.startDate);
                  const end      = new Date(trip.endDate);
                  const isOngoing  = start <= now && end >= now;
                  const isUpcoming = start > now;
                  const statusBadge = isOngoing
                    ? <span className="badge bg-success">Ongoing</span>
                    : isUpcoming
                    ? <span className="badge bg-primary">Upcoming</span>
                    : <span className="badge bg-secondary">Completed</span>;

                  const acceptedMembers = trip.members?.filter((m) => m.status === 'accepted').length ?? 0;
                  const slots = (trip.maxMembers ?? 5) - acceptedMembers - 1; // -1 for creator

                  return (
                    <div key={trip._id} className="col-md-6 col-lg-4">
                      <div className="card border-0 shadow-sm h-100 hover-lift">
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="fw-bold mb-0 text-truncate me-2">{trip.title}</h6>
                            {statusBadge}
                          </div>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-geo-alt me-1" />
                            {trip.destination?.city ?? ''}
                            {trip.destination?.country ? `, ${trip.destination.country}` : ''}
                          </p>
                          <p className="text-muted small mb-1">
                            <i className="bi bi-calendar3 me-1" />
                            {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                          </p>
                          {trip.budget?.max > 0 && (
                            <p className="text-muted small mb-2">
                              <i className="bi bi-wallet2 me-1" />
                              {trip.budget.currency || 'INR'}{' '}
                              {trip.budget.min?.toLocaleString()} – {trip.budget.max?.toLocaleString()}
                            </p>
                          )}
                          {trip.createdBy && (
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <div
                                className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center
                                           justify-content-center fw-bold text-primary flex-shrink-0"
                                style={{ width: 24, height: 24, fontSize: 8 }}
                              >
                                {getInitials(trip.createdBy.name ?? '')}
                              </div>
                              <span className="small text-muted">{trip.createdBy.name}</span>
                            </div>
                          )}
                          <div className="d-flex align-items-center justify-content-between mt-auto">
                            <span className="small text-muted">
                              <i className="bi bi-people me-1" />
                              {acceptedMembers + 1}/{trip.maxMembers ?? '∞'}
                              {slots > 0 && (
                                <span className="text-success ms-1">({slots} slot{slots !== 1 ? 's' : ''} open)</span>
                              )}
                            </span>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => trip.createdBy?._id && navigate(`/chat/${trip.createdBy._id}`)}
                            >
                              <i className="bi bi-chat-dots me-1" />Connect
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Buddy Match Results Section ──────────────────── */}
      {!loading && searched && matches.length === 0 && (
        <div className="card border-0 shadow-sm text-center py-5">
          <i className="bi bi-search fs-1 text-muted opacity-25" />
          <p className="text-muted mt-3 mb-0">No matches found. Try adjusting your filters.</p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <>
          <h5 className="fw-semibold mb-3">
            <i className="bi bi-people-fill text-primary me-2" />Compatible Travel Buddies
          </h5>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">
              <i className="bi bi-check-circle-fill text-success me-2" />
              Found {totalMatches} compatible match{totalMatches !== 1 ? 'es' : ''}
            </h5>
            <span className="text-muted small">Page {page} of {totalPages}</span>
          </div>

          <div className="row g-4 mb-4">
            {matches.map((match) => {
              const score = match.matchScore ?? 0;
              const { label, cls } = classifyScore(score);
              return (
                <div key={match.user._id} className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm h-100 hover-lift">
                    <div className="card-body text-center p-4">
                      <Avatar name={match.user.name} avatar={match.user.avatar} size={80} />
                      <h6 className="fw-bold mt-3 mb-1">{match.user.name}</h6>
                      <p className="text-muted small mb-3">
                        {match.profile.location?.city && `${match.profile.location.city}, `}
                        {match.profile.location?.country || 'Location not set'}
                      </p>

                      <ScoreRing score={score} size={100} />

                      <div className="mt-3 mb-3">
                        <span className={`badge bg-${cls === 'excellent' ? 'success' : cls === 'good' ? 'primary' : cls === 'moderate' ? 'warning' : 'secondary'} px-3 py-2`}>
                          {label} Match
                        </span>
                      </div>

                      {match.profile.travelInterests && match.profile.travelInterests.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 justify-content-center mb-3">
                          {match.profile.travelInterests.slice(0, 3).map((interest, i) => (
                            <span key={i} className="badge bg-light text-dark border small">
                              {interest}
                            </span>
                          ))}
                          {match.profile.travelInterests.length > 3 && (
                            <span className="badge bg-light text-muted border small">
                              +{match.profile.travelInterests.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {match.profile.budgetRange && (
                        <p className="text-muted small mb-3">
                          <i className="bi bi-wallet2 me-1" />
                          {formatBudget(match.profile.budgetRange)}
                        </p>
                      )}

                      <div className="d-grid gap-2">
                        <button className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/chat/${match.user._id}`)}>
                          <i className="bi bi-chat-dots me-1" />Connect
                        </button>
                        <button className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleViewBreakdown(match)}>
                          <i className="bi bi-bar-chart me-1" />View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav>
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}>
                    <i className="bi bi-chevron-left" />
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === 1 || pageNum === totalPages ||
                     (pageNum >= page - 1 && pageNum <= page + 1)) {
                    return (
                      <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pageNum)}>
                          {pageNum}
                        </button>
                      </li>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <li key={pageNum} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  return null;
                })}
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Breakdown Modal */}
      {showBreakdown && selectedMatch && (
        <div className="modal show d-block" tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-bar-chart-fill text-primary me-2" />
                  Compatibility Breakdown
                </h5>
                <button type="button" className="btn-close"
                  onClick={() => setShowBreakdown(false)} />
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4 text-center mb-3">
                    <Avatar name={selectedMatch.user.name}
                      avatar={selectedMatch.user.avatar} size={100} />
                    <h6 className="fw-bold mt-3">{selectedMatch.user.name}</h6>
                    <p className="text-muted small mb-0">
                      {selectedMatch.profile.location?.city || 'Unknown Location'}
                    </p>
                  </div>
                  <div className="col-md-8">
                    <div className="mb-3 text-center">
                      <ScoreRing score={selectedMatch.matchScore} size={120} />
                      <p className="text-muted small mt-2">Overall Compatibility Score</p>
                    </div>
                  </div>
                </div>

                <hr />

                <h6 className="fw-bold mb-3">Score Breakdown</h6>
                {selectedMatch.breakdown && (
                  <>
                    <BreakdownBar label="Destination Compatibility"
                      score={selectedMatch.breakdown.destination.score}
                      weight={selectedMatch.breakdown.destination.weight} />
                    <BreakdownBar label="Budget Compatibility"
                      score={selectedMatch.breakdown.budget.score}
                      weight={selectedMatch.breakdown.budget.weight} />
                    <BreakdownBar label="Interest Similarity"
                      score={selectedMatch.breakdown.interests.score}
                      weight={selectedMatch.breakdown.interests.weight} />
                    <BreakdownBar label="Travel Date Overlap"
                      score={selectedMatch.breakdown.travelDates.score}
                      weight={selectedMatch.breakdown.travelDates.weight} />
                    <div className="mt-2 p-2 bg-light rounded">
                      <small className="fw-semibold">Style Bonus:</small>
                      <span className="ms-2 text-success">
                        +{selectedMatch.breakdown.styleBonus.score} points
                      </span>
                      <small className="text-muted ms-2">
                        ({selectedMatch.breakdown.styleBonus.weight})
                      </small>
                    </div>
                  </>
                )}

                <hr />

                <h6 className="fw-bold mb-2">Profile Details</h6>
                <div className="row g-2 small">
                  <div className="col-md-6">
                    <strong>Age:</strong> {selectedMatch.profile.age || 'Not set'}
                  </div>
                  <div className="col-md-6">
                    <strong>Gender:</strong> {selectedMatch.profile.gender || 'Not set'}
                  </div>
                  <div className="col-md-6">
                    <strong>Travel Style:</strong> {selectedMatch.profile.travelStyle || 'Not set'}
                  </div>
                  <div className="col-md-6">
                    <strong>Reputation:</strong> {selectedMatch.profile.reputationScore || 0}/5 ⭐
                  </div>
                  {selectedMatch.profile.languages && selectedMatch.profile.languages.length > 0 && (
                    <div className="col-12">
                      <strong>Languages:</strong> {selectedMatch.profile.languages.join(', ')}
                    </div>
                  )}
                  {selectedMatch.profile.bio && (
                    <div className="col-12">
                      <strong>Bio:</strong> <p className="mt-1">{selectedMatch.profile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary"
                  onClick={() => setShowBreakdown(false)}>Close</button>
                <button className="btn btn-primary"
                  onClick={() => {
                    setShowBreakdown(false);
                    navigate(`/chat/${selectedMatch.user._id}`);
                  }}>
                  <i className="bi bi-chat-dots me-2" />Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindBuddy;
