import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate, getInitials, getErrorMessage, truncate } from '../../utils/helpers';

const AvatarCircle = ({ name, avatar, size = 36 }) => {
  if (avatar) {
    return <img src={avatar} alt={name} className="rounded-circle" width={size} height={size} />;
  }
  return (
    <div
      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {getInitials(name)}
    </div>
  );
};

const StarRating = ({ rating }) => (
  <div className="d-flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <i
        key={star}
        className={`bi ${star <= rating ? 'bi-star-fill' : 'bi-star'} text-warning`}
        style={{ fontSize: '.9rem' }}
      />
    ))}
  </div>
);

const FeedbackManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [filterVisible, setFilterVisible] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [page, filterRating, filterVisible]);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 15,
        rating: filterRating !== 'all' ? filterRating : undefined,
        isVisible: filterVisible === 'visible' ? true : filterVisible === 'hidden' ? false : undefined,
      };
      const res = await api.get('/admin/reviews', { params });
      setReviews(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (reviewId, currentVisibility) => {
    setProcessing(true);
    try {
      await api.put(`/admin/reviews/${reviewId}`, { isVisible: !currentVisibility });
      fetchReviews();
      setShowModal(false);
      setSelectedReview(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  return (
    <div className="container-fluid">
      <div className="tt-page-header">
        <h2>Feedback Management</h2>
        <p className="text-muted">Manage user reviews and ratings</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} />
        </div>
      )}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold small">Filter by Rating</label>
              <select
                className="form-select"
                value={filterRating}
                onChange={(e) => {
                  setFilterRating(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold small">Filter by Visibility</label>
              <select
                className="form-select"
                value={filterVisible}
                onChange={(e) => {
                  setFilterVisible(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Reviews</option>
                <option value="visible">Visible Only</option>
                <option value="hidden">Hidden Only</option>
              </select>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setFilterRating('all');
                  setFilterVisible('all');
                  setPage(1);
                  fetchReviews();
                }}
              >
                <i className="bi bi-arrow-clockwise me-2" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading && (
            <div className="tt-loader">
              <div className="spinner-border text-primary" />
            </div>
          )}

          {!loading && reviews.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-star fs-1 opacity-25" />
              <p className="mt-3 mb-0">No reviews found</p>
            </div>
          )}

          {!loading && reviews.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Reviewer</th>
                    <th>Reviewee</th>
                    <th>Rating</th>
                    <th>Feedback</th>
                    <th>Tags</th>
                    <th>Date</th>
                    <th>Visible</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <AvatarCircle
                            name={review.reviewer?.name || 'Anonymous'}
                            avatar={review.reviewer?.avatar}
                            size={36}
                          />
                          <div>
                            <div className="fw-semibold small">{review.reviewer?.name || 'Anonymous'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <AvatarCircle
                            name={review.reviewee?.name || 'Unknown'}
                            avatar={review.reviewee?.avatar}
                            size={36}
                          />
                          <div>
                            <div className="fw-semibold small">{review.reviewee?.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <StarRating rating={review.rating} />
                      </td>
                      <td>
                        <span className="text-muted small">{truncate(review.feedback, 50)}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {review.tags && review.tags.length > 0 ? (
                            review.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="badge bg-success-subtle text-success border small">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                          {review.tags && review.tags.length > 2 && (
                            <span className="badge bg-light text-muted border small">
                              +{review.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-muted small">{formatDate(review.createdAt)}</td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={review.isVisible}
                            onChange={() => handleToggleVisibility(review._id, review.isVisible)}
                            disabled={processing}
                            style={{ cursor: 'pointer' }}
                          />
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openModal(review)}
                        >
                          <i className="bi bi-eye me-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 1}>
                <i className="bi bi-chevron-left" />
              </button>
            </li>
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= page - 1 && pageNum <= page + 1)
              ) {
                return (
                  <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(pageNum)}>
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
              <button
                className="page-link"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <i className="bi bi-chevron-right" />
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Review Detail Modal */}
      {showModal && selectedReview && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Reviewer</label>
                    <div className="d-flex align-items-center gap-2">
                      <AvatarCircle
                        name={selectedReview.reviewer?.name || 'Anonymous'}
                        avatar={selectedReview.reviewer?.avatar}
                        size={48}
                      />
                      <div>
                        <div className="fw-semibold">{selectedReview.reviewer?.name || 'Anonymous'}</div>
                        <small className="text-muted">{selectedReview.reviewer?.email || '—'}</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Reviewee</label>
                    <div className="d-flex align-items-center gap-2">
                      <AvatarCircle
                        name={selectedReview.reviewee?.name || 'Unknown'}
                        avatar={selectedReview.reviewee?.avatar}
                        size={48}
                      />
                      <div>
                        <div className="fw-semibold">{selectedReview.reviewee?.name || 'Unknown'}</div>
                        <small className="text-muted">{selectedReview.reviewee?.email || '—'}</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Rating</label>
                    <div className="d-flex align-items-center gap-2">
                      <StarRating rating={selectedReview.rating} />
                      <span className="fw-bold">{selectedReview.rating}/5</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Date</label>
                    <p className="mb-0">{formatDate(selectedReview.createdAt)}</p>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-muted">Feedback</label>
                    <p className="mb-0">{selectedReview.feedback}</p>
                  </div>
                  {selectedReview.tags && selectedReview.tags.length > 0 && (
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">Tags</label>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedReview.tags.map((tag, i) => (
                          <span key={i} className="badge bg-success-subtle text-success border">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedReview.tripId && (
                    <div className="col-12">
                      <label className="form-label fw-semibold small text-muted">Related Trip</label>
                      <p className="mb-0">
                        <i className="bi bi-map me-2" />
                        {selectedReview.tripId.title || 'Trip details unavailable'}
                      </p>
                    </div>
                  )}
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-muted">Visibility</label>
                    <div>
                      <span
                        className={`badge ${
                          selectedReview.isVisible ? 'bg-success' : 'bg-secondary'
                        }`}
                      >
                        {selectedReview.isVisible ? 'Visible to Users' : 'Hidden from Users'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={processing}
                >
                  Close
                </button>
                <button
                  className={`btn ${selectedReview.isVisible ? 'btn-warning' : 'btn-success'}`}
                  onClick={() =>
                    handleToggleVisibility(selectedReview._id, selectedReview.isVisible)
                  }
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : selectedReview.isVisible ? (
                    <>
                      <i className="bi bi-eye-slash me-2" />
                      Hide Review
                    </>
                  ) : (
                    <>
                      <i className="bi bi-eye me-2" />
                      Show Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
