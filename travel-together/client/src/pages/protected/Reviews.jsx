import React, { useState, useEffect, useCallback, useRef } from 'react';
import reviewService from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';

// ─── Sub-components ───────────────────────────────────────────────────────────

const AvatarCircle = ({ name, avatar, size = 44 }) => (
  <div className="flex-shrink-0">
    {avatar
      ? <img src={avatar} alt={name} className="rounded-circle object-fit-cover" width={size} height={size} />
      : <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary"
          style={{ width: size, height: size, fontSize: size * 0.35 }}>
          {getInitials(name)}
        </div>}
  </div>
);

const StarDisplay = ({ rating, size = '1rem' }) => (
  <div className="d-flex gap-1 align-items-center">
    {[1, 2, 3, 4, 5].map((s) => (
      <i key={s} className={`bi ${s <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
        style={{ fontSize: size }} />
    ))}
  </div>
);

const StarPicker = ({ value, onChange }) => (
  <div className="d-flex gap-2">
    {[1, 2, 3, 4, 5].map((s) => (
      <i key={s}
        className={`bi ${s <= value ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
        style={{ fontSize: '1.75rem', cursor: 'pointer', transition: 'transform .1s' }}
        onClick={() => onChange(s)}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      />
    ))}
    <span className="ms-2 text-muted small align-self-center">
      {['','Poor','Fair','Good','Very Good','Excellent'][value]}
    </span>
  </div>
);

const RatingBar = ({ label, value, max, color = 'bg-warning' }) => (
  <div className="d-flex align-items-center gap-2 mb-1">
    <span className="text-muted" style={{ fontSize: '.75rem', width: 12 }}>{label}</span>
    <i className="bi bi-star-fill text-warning" style={{ fontSize: '.65rem' }} />
    <div className="flex-grow-1 bg-light rounded" style={{ height: 8 }}>
      <div className={`${color} rounded`} style={{ height: 8, width: max > 0 ? `${(value / max) * 100}%` : 0, transition: 'width .4s' }} />
    </div>
    <span className="text-muted" style={{ fontSize: '.75rem', width: 18 }}>{value}</span>
  </div>
);

const TAG_OPTIONS = ['friendly','reliable','punctual','fun','responsible','communicative','respectful'];
const TAG_COLORS  = {
  friendly: 'primary', reliable: 'success', punctual: 'info',
  fun: 'warning', responsible: 'secondary', communicative: 'danger', respectful: 'success',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Reviews = () => {
  const { user: currentUser } = useAuth();

  // ── State: received reviews ──────────────────────────────────────────────
  const [received, setReceived]       = useState([]);
  const [recvMeta, setRecvMeta]       = useState({ averageRating: 0, reputationScore: 0, totalRatings: 0, tagFrequency: {} });
  const [loadingRecv, setLoadingRecv] = useState(true);

  // ── State: given reviews ─────────────────────────────────────────────────
  const [given, setGiven]             = useState([]);
  const [loadingGiven, setLoadingGiven] = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState('received');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({ rating: 5, feedback: '', tags: [] });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting]     = useState(null);

  // ── User search (for reviewee) ───────────────────────────────────────────
  const [searchQ, setSearchQ]         = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [selectedReviewee, setSelectedReviewee] = useState(null);
  const searchTimer                   = useRef(null);

  // ── Load data ────────────────────────────────────────────────────────────
  const loadReceived = useCallback(async () => {
    setLoadingRecv(true);
    try {
      const res = await reviewService.getMyReviews({ limit: 50 });
      setReceived(res.data?.data || []);
      setRecvMeta({
        averageRating:  res.data?.averageRating   || 0,
        reputationScore: res.data?.reputationScore || 0,
        totalRatings:   res.data?.totalRatings     || 0,
        tagFrequency:   res.data?.tagFrequency     || {},
      });
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoadingRecv(false); }
  }, []);

  const loadGiven = useCallback(async () => {
    setLoadingGiven(true);
    try {
      const res = await reviewService.getReviewsGiven({ limit: 50 });
      setGiven(res.data?.data || []);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoadingGiven(false); }
  }, []);

  useEffect(() => { loadReceived(); }, [loadReceived]);
  useEffect(() => {
    if (activeTab === 'given' && given.length === 0) loadGiven();
  }, [activeTab, given.length, loadGiven]);

  // ── User search debounce ─────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await reviewService.searchUsers(searchQ);
        setSearchResults(res.data?.data || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [searchQ]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const toggleTag = (tag) =>
    setForm((p) => ({ ...p, tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag] }));

  const validate = () => {
    const e = {};
    if (!selectedReviewee) e.reviewee = 'Please select a user to review';
    if (!form.feedback.trim()) e.feedback = 'Feedback is required';
    if (form.feedback.trim().length < 10) e.feedback = 'Feedback must be at least 10 characters';
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setFormErrors(e); return; }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await reviewService.createReview({
        revieweeId: selectedReviewee._id,
        rating:     form.rating,
        feedback:   form.feedback.trim(),
        tags:       form.tags,
      });
      setSuccess(`Review submitted for ${selectedReviewee.name}!`);
      setForm({ rating: 5, feedback: '', tags: [] });
      setSelectedReviewee(null);
      setSearchQ('');
      setSearchResults([]);
      setFormErrors({});
      loadReceived();
      if (activeTab === 'given') loadGiven();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    setDeleting(id);
    try {
      await reviewService.deleteReview(id);
      setGiven((p) => p.filter((r) => r._id !== id));
      setSuccess('Review deleted.');
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setDeleting(null); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const repColor = (score) => {
    if (score >= 4.5) return 'text-success';
    if (score >= 3.5) return 'text-primary';
    if (score >= 2.5) return 'text-warning';
    return 'text-danger';
  };

  const repLabel = (score) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score > 0)    return 'Below Average';
    return 'No ratings yet';
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="tt-page-header d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h2 className="mb-1">Reviews & Ratings</h2>
          <p className="text-muted mb-0 small">Your travel reputation and community feedback</p>
        </div>
      </div>

      {error   && <div className="alert alert-danger alert-dismissible"><i className="bi bi-exclamation-triangle-fill me-2" />{error}<button className="btn-close" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible"><i className="bi bi-check-circle-fill me-2" />{success}<button className="btn-close" onClick={() => setSuccess('')} /></div>}

      <div className="row g-4">

        {/* ── LEFT: Reviews + stats ──────────────────────────────────────── */}
        <div className="col-lg-8">

          {/* Reputation summary card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-center">
                {/* Big score */}
                <div className="col-auto text-center">
                  <div className={`fw-bold ${repColor(recvMeta.reputationScore)}`} style={{ fontSize: '3.5rem', lineHeight: 1 }}>
                    {recvMeta.reputationScore > 0 ? recvMeta.reputationScore.toFixed(1) : '—'}
                  </div>
                  <StarDisplay rating={Math.round(recvMeta.averageRating)} size=".9rem" />
                  <div className="text-muted small mt-1">{repLabel(recvMeta.reputationScore)}</div>
                  <div className="text-muted" style={{ fontSize: '.75rem' }}>{recvMeta.totalRatings} rating{recvMeta.totalRatings !== 1 ? 's' : ''}</div>
                </div>

                {/* Distribution bars */}
                <div className="col">
                  <h6 className="fw-semibold mb-2 small text-muted text-uppercase">Rating Distribution</h6>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = received.filter((r) => r.rating === star).length;
                    return <RatingBar key={star} label={star} value={count} max={received.length} />;
                  })}
                </div>

                {/* Top tags */}
                <div className="col-md-4">
                  <h6 className="fw-semibold mb-2 small text-muted text-uppercase">Top Tags</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {Object.entries(recvMeta.tagFrequency)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([tag, count]) => (
                        <span key={tag} className={`badge bg-${TAG_COLORS[tag] || 'secondary'} bg-opacity-10 text-${TAG_COLORS[tag] || 'secondary'} border`}
                          style={{ fontSize: '.7rem' }}>
                          {tag} <span className="opacity-75">×{count}</span>
                        </span>
                      ))}
                    {Object.keys(recvMeta.tagFrequency).length === 0 && <span className="text-muted small">No tags yet</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'received' ? 'active fw-semibold' : ''}`}
                onClick={() => setActiveTab('received')}>
                <i className="bi bi-person-check me-1" />
                Reviews About Me
                {received.length > 0 && <span className="badge bg-primary ms-2 rounded-pill">{received.length}</span>}
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'given' ? 'active fw-semibold' : ''}`}
                onClick={() => setActiveTab('given')}>
                <i className="bi bi-pencil me-1" />
                Reviews I Gave
                {given.length > 0 && <span className="badge bg-secondary ms-2 rounded-pill">{given.length}</span>}
              </button>
            </li>
          </ul>

          {/* Reviews list */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">

              {/* Received */}
              {activeTab === 'received' && (
                <>
                  {loadingRecv && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
                  {!loadingRecv && received.length === 0 && (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-star fs-1 opacity-25 d-block mb-3" />
                      No reviews yet — travel with others to earn them!
                    </div>
                  )}
                  {!loadingRecv && received.map((r) => (
                    <ReviewCard key={r._id} review={r} side="received" />
                  ))}
                </>
              )}

              {/* Given */}
              {activeTab === 'given' && (
                <>
                  {loadingGiven && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
                  {!loadingGiven && given.length === 0 && (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-pencil-square fs-1 opacity-25 d-block mb-3" />
                      You haven't reviewed anyone yet.
                    </div>
                  )}
                  {!loadingGiven && given.map((r) => (
                    <ReviewCard key={r._id} review={r} side="given"
                      onDelete={() => handleDelete(r._id)}
                      deleting={deleting === r._id} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Write a review ──────────────────────────────────────── */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-pencil-square text-primary me-2" />
                Write a Review
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} noValidate>

                {/* User search */}
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold">Travel Companion <span className="text-danger">*</span></label>

                  {selectedReviewee ? (
                    <div className="d-flex align-items-center gap-2 p-2 border rounded bg-light">
                      <AvatarCircle name={selectedReviewee.name} avatar={selectedReviewee.avatar} size={36} />
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{selectedReviewee.name}</div>
                        <div className="text-muted" style={{ fontSize: '.7rem' }}>{selectedReviewee.email}</div>
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-secondary p-1"
                        onClick={() => { setSelectedReviewee(null); setSearchQ(''); }}>
                        <i className="bi bi-x" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="input-group">
                        <span className="input-group-text bg-transparent"><i className="bi bi-search" /></span>
                        <input
                          className={`form-control border-start-0 ${formErrors.reviewee ? 'is-invalid' : ''}`}
                          placeholder="Search by name or email..."
                          value={searchQ}
                          onChange={(e) => setSearchQ(e.target.value)}
                          autoComplete="off"
                        />
                        {searching && (
                          <span className="input-group-text bg-transparent">
                            <span className="spinner-border spinner-border-sm" />
                          </span>
                        )}
                      </div>
                      {formErrors.reviewee && <div className="text-danger small mt-1">{formErrors.reviewee}</div>}

                      {searchResults.length > 0 && (
                        <div className="border rounded shadow-sm bg-white position-absolute w-100 z-3"
                          style={{ top: '100%', maxHeight: 200, overflowY: 'auto' }}>
                          {searchResults.map((u) => (
                            <div key={u._id}
                              className="d-flex align-items-center gap-2 p-2 border-bottom user-search-item"
                              style={{ cursor: 'pointer' }}
                              onClick={() => { setSelectedReviewee(u); setSearchQ(''); setSearchResults([]); setFormErrors((p) => ({ ...p, reviewee: null })); }}>
                              <AvatarCircle name={u.name} avatar={u.avatar} size={32} />
                              <div>
                                <div className="small fw-semibold">{u.name}</div>
                                <div className="text-muted" style={{ fontSize: '.7rem' }}>{u.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Star rating */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Rating <span className="text-danger">*</span></label>
                  <StarPicker value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
                </div>

                {/* Feedback */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Feedback <span className="text-danger">*</span>
                    <span className="text-muted fw-normal ms-1 small">({form.feedback.length}/800)</span>
                  </label>
                  <textarea
                    className={`form-control ${formErrors.feedback ? 'is-invalid' : ''}`}
                    rows="4"
                    placeholder="Describe your travel experience with this person..."
                    value={form.feedback}
                    maxLength={800}
                    onChange={(e) => { setForm((p) => ({ ...p, feedback: e.target.value })); setFormErrors((p) => ({ ...p, feedback: null })); }}
                  />
                  {formErrors.feedback && <div className="invalid-feedback">{formErrors.feedback}</div>}
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Tags <span className="text-muted fw-normal">(optional)</span></label>
                  <div className="d-flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => (
                      <button key={tag} type="button"
                        className={`btn btn-sm ${form.tags.includes(tag)
                          ? `btn-${TAG_COLORS[tag] || 'secondary'}`
                          : 'btn-outline-secondary'}`}
                        onClick={() => toggleTag(tag)}>
                        {form.tags.includes(tag) && <i className="bi bi-check2 me-1" />}
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                  {submitting
                    ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                    : <><i className="bi bi-send me-2" />Submit Review</>}
                </button>
              </form>
            </div>
          </div>

          {/* Tips */}
          <div className="card border-0 shadow-sm mt-3 border-start border-4 border-warning">
            <div className="card-body py-3">
              <h6 className="fw-semibold mb-2"><i className="bi bi-lightbulb-fill text-warning me-2" />Review Guidelines</h6>
              <ul className="small mb-0 ps-3 text-muted">
                <li className="mb-1">Be honest and constructive</li>
                <li className="mb-1">Focus on actual travel experiences</li>
                <li className="mb-1">One review per person per trip</li>
                <li>Reviews help build trust in our community</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Review card ──────────────────────────────────────────────────────────────
const ReviewCard = ({ review, side, onDelete, deleting }) => {
  const person = side === 'received' ? review.reviewer : review.reviewee;
  return (
    <div className="d-flex gap-3 p-3 border-bottom">
      <AvatarCircle name={person?.name} avatar={person?.avatar} />
      <div className="flex-grow-1 min-w-0">
        <div className="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-1">
          <div>
            <span className="fw-semibold">{person?.name || 'Unknown'}</span>
            {review.trip && (
              <span className="badge bg-light text-secondary border ms-2" style={{ fontSize: '.7rem' }}>
                <i className="bi bi-map me-1" />{review.trip.title || review.trip.destination?.city}
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">{formatDate(review.createdAt)}</span>
            {side === 'given' && (
              <button className="btn btn-sm btn-outline-danger p-1" style={{ lineHeight: 1 }}
                onClick={onDelete} disabled={deleting} title="Delete review">
                {deleting
                  ? <span className="spinner-border spinner-border-sm" />
                  : <i className="bi bi-trash" />}
              </button>
            )}
          </div>
        </div>

        <StarDisplay rating={review.rating} size=".85rem" />

        <p className="mb-2 mt-2 small" style={{ lineHeight: 1.5 }}>{review.feedback}</p>

        {review.tags?.length > 0 && (
          <div className="d-flex flex-wrap gap-1">
            {review.tags.map((tag) => (
              <span key={tag} className={`badge bg-${TAG_COLORS[tag] || 'secondary'} bg-opacity-10 text-${TAG_COLORS[tag] || 'secondary'} border`}
                style={{ fontSize: '.65rem' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
