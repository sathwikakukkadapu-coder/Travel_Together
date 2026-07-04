import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import tripService from '../../services/tripService';
import { formatDate, getInitials, getErrorMessage, truncate } from '../../utils/helpers';
import { validateRequired, runValidations } from '../../utils/validators';

const AvatarCircle = ({ name = '', avatar = '', size = 32 }) => {
  if (avatar) return <img src={avatar} alt={name} className="rounded-circle object-fit-cover" width={size} height={size} />;
  return (
    <div
      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {getInitials(name)}
    </div>
  );
};

const INTEREST_OPTIONS = [
  'adventure', 'beach', 'culture', 'food', 'history',
  'nature', 'nightlife', 'photography', 'shopping', 'spiritual', 'sports', 'wildlife',
];

const emptyForm = {
  title: '', description: '', destination: '', country: '',
  startDate: '', endDate: '', minBudget: '', maxBudget: '',
  interests: [], maxMembers: '', isPublic: true,
};

const TripPlanner = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'create' ? 'create' : 'mytrips';

  const [activeTab, setActiveTab]     = useState(defaultTab);
  const [tripsTab, setTripsTab]       = useState('upcoming');
  const [trips, setTrips]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [successMsg, setSuccessMsg]   = useState('');

  const [formData, setFormData]       = useState(emptyForm);
  const [formErrors, setFormErrors]   = useState({});
  const [submitting, setSubmitting]   = useState(false);

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [deleting, setDeleting]         = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tripService.getMyTrips();
      // API returns { success, count, data: [ ...trips ] }
      setTrips(res.data?.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // ── Filter by status tab ──────────────────────────────────────────────
  const filterTrips = () => {
    const now = new Date();
    if (tripsTab === 'upcoming')  return trips.filter((t) => new Date(t.startDate) > now);
    if (tripsTab === 'ongoing')   return trips.filter((t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now);
    return trips.filter((t) => new Date(t.endDate) < now);
  };

  // ── Form handlers ─────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleInterestToggle = (interest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const validateForm = () =>
    runValidations({
      title:      () => validateRequired(formData.title, 'Title'),
      destination:() => validateRequired(formData.destination, 'Destination city'),
      startDate:  () => validateRequired(formData.startDate, 'Start Date'),
      endDate:    () => {
        if (!formData.endDate) return 'End Date is required';
        if (new Date(formData.endDate) < new Date(formData.startDate)) return 'End Date must be after Start Date';
        return null;
      },
      minBudget:  () => {
        if (formData.minBudget === '' || formData.minBudget === undefined) return 'Min Budget is required';
        if (Number(formData.minBudget) < 0) return 'Min Budget must be positive';
        return null;
      },
      maxBudget:  () => {
        if (formData.maxBudget === '' || formData.maxBudget === undefined) return 'Max Budget is required';
        if (Number(formData.maxBudget) < Number(formData.minBudget)) return 'Max Budget must be ≥ Min Budget';
        return null;
      },
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errors, isValid } = validateForm();
    if (!isValid) { setFormErrors(errors); return; }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title:       formData.title.trim(),
        description: formData.description.trim(),
        destination: { city: formData.destination.trim(), country: formData.country.trim() },
        startDate:   formData.startDate,
        endDate:     formData.endDate,
        budget:      { min: Number(formData.minBudget), max: Number(formData.maxBudget), currency: 'INR' },
        interests:   formData.interests,
        maxMembers:  formData.maxMembers ? Number(formData.maxMembers) : 5,
        isPublic:    formData.isPublic,
      };
      await tripService.createTrip(payload);
      setFormData(emptyForm);
      setFormErrors({});
      setSuccessMsg('Trip created successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setActiveTab('mytrips');
      fetchTrips();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete trip ───────────────────────────────────────────────────────
  const handleDelete = async (tripId) => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await tripService.deleteTrip(tripId);
      setShowModal(false);
      setSelectedTrip(null);
      setSuccessMsg('Trip deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchTrips();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const getTripStatusBadge = (trip) => {
    const now = new Date(), start = new Date(trip.startDate), end = new Date(trip.endDate);
    if (start > now) return <span className="badge bg-primary">Upcoming</span>;
    if (end < now)   return <span className="badge bg-secondary">Completed</span>;
    return <span className="badge bg-success">Ongoing</span>;
  };

  const filtered = filterTrips();

  return (
    <div className="container-fluid">
      <div className="tt-page-header">
        <h2><i className="bi bi-map-fill text-success me-2" />Trip Planner</h2>
        <p className="text-muted">Plan and manage your travel adventures</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          <i className="bi bi-exclamation-triangle-fill me-2" />{error}
          <button type="button" className="btn-close" onClick={() => setError('')} />
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success alert-dismissible">
          <i className="bi bi-check-circle-fill me-2" />{successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg('')} />
        </div>
      )}

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'mytrips' ? 'active' : ''}`} onClick={() => setActiveTab('mytrips')}>
            <i className="bi bi-map me-2" />My Trips
            {trips.length > 0 && <span className="badge bg-primary ms-2">{trips.length}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
            <i className="bi bi-plus-circle me-2" />Create Trip
          </button>
        </li>
      </ul>

      {/* ── My Trips ── */}
      {activeTab === 'mytrips' && (
        <div>
          <ul className="nav nav-pills mb-3 gap-1">
            {['upcoming', 'ongoing', 'completed'].map((tab) => (
              <li key={tab} className="nav-item">
                <button
                  className={`nav-link text-capitalize ${tripsTab === tab ? 'active' : ''}`}
                  onClick={() => setTripsTab(tab)}
                >
                  {tab}
                </button>
              </li>
            ))}
          </ul>

          {loading && <div className="tt-loader"><div className="spinner-border text-primary" /></div>}

          {!loading && filtered.length === 0 && (
            <div className="card border-0 shadow-sm text-center py-5">
              <i className="bi bi-map fs-1 text-muted opacity-25 d-block mb-3" />
              <p className="text-muted mb-3">No {tripsTab} trips found.</p>
              {tripsTab === 'upcoming' && (
                <button className="btn btn-primary mx-auto" onClick={() => setActiveTab('create')}>
                  <i className="bi bi-plus-circle me-2" />Create a Trip
                </button>
              )}
            </div>
          )}

          <div className="row g-4">
            {filtered.map((trip) => (
              <div key={trip._id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 hover-lift">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold mb-0 text-truncate me-2">{trip.title}</h5>
                      {getTripStatusBadge(trip)}
                    </div>
                    <p className="text-muted small mb-2">
                      <i className="bi bi-geo-alt me-1" />
                      {trip.destination?.city || '—'}
                      {trip.destination?.country ? `, ${trip.destination.country}` : ''}
                    </p>
                    <p className="text-muted small mb-2">
                      <i className="bi bi-calendar3 me-1" />
                      {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </p>
                    <p className="text-muted small mb-3">
                      <i className="bi bi-wallet2 me-1" />
                      {trip.budget?.currency || 'INR'} {trip.budget?.min?.toLocaleString()} – {trip.budget?.max?.toLocaleString()}
                    </p>
                    {trip.description && <p className="small mb-3 text-muted">{truncate(trip.description, 100)}</p>}
                    <div className="d-flex align-items-center justify-content-between mt-auto">
                      <span className="text-muted small">
                        <i className="bi bi-people me-1" />
                        {(trip.members?.filter((m) => m.status === 'accepted').length ?? 0) + 1} / {trip.maxMembers ?? '∞'}
                      </span>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => { setSelectedTrip(trip); setShowModal(true); }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Trip ── */}
      {activeTab === 'create' && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-0 pt-3">
            <h5 className="mb-0 fw-semibold"><i className="bi bi-plus-circle text-success me-2" />New Trip</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Trip Title <span className="text-danger">*</span></label>
                  <input
                    type="text" name="title"
                    className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
                    value={formData.title} onChange={handleFormChange}
                    placeholder="e.g. Weekend Getaway to Goa"
                  />
                  {formErrors.title && <div className="invalid-feedback">{formErrors.title}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">City <span className="text-danger">*</span></label>
                  <input
                    type="text" name="destination"
                    className={`form-control ${formErrors.destination ? 'is-invalid' : ''}`}
                    value={formData.destination} onChange={handleFormChange}
                    placeholder="Goa"
                  />
                  {formErrors.destination && <div className="invalid-feedback">{formErrors.destination}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">Country</label>
                  <input
                    type="text" name="country"
                    className="form-control"
                    value={formData.country} onChange={handleFormChange}
                    placeholder="India"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea
                    name="description" rows="3"
                    className="form-control"
                    value={formData.description} onChange={handleFormChange}
                    placeholder="Describe your trip plans..."
                    maxLength={1000}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Start Date <span className="text-danger">*</span></label>
                  <input
                    type="date" name="startDate"
                    className={`form-control ${formErrors.startDate ? 'is-invalid' : ''}`}
                    value={formData.startDate} onChange={handleFormChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {formErrors.startDate && <div className="invalid-feedback">{formErrors.startDate}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">End Date <span className="text-danger">*</span></label>
                  <input
                    type="date" name="endDate"
                    className={`form-control ${formErrors.endDate ? 'is-invalid' : ''}`}
                    value={formData.endDate} onChange={handleFormChange}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                  {formErrors.endDate && <div className="invalid-feedback">{formErrors.endDate}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Min Budget (INR) <span className="text-danger">*</span></label>
                  <input
                    type="number" name="minBudget" min="0"
                    className={`form-control ${formErrors.minBudget ? 'is-invalid' : ''}`}
                    value={formData.minBudget} onChange={handleFormChange}
                    placeholder="10000"
                  />
                  {formErrors.minBudget && <div className="invalid-feedback">{formErrors.minBudget}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Max Budget (INR) <span className="text-danger">*</span></label>
                  <input
                    type="number" name="maxBudget" min="0"
                    className={`form-control ${formErrors.maxBudget ? 'is-invalid' : ''}`}
                    value={formData.maxBudget} onChange={handleFormChange}
                    placeholder="50000"
                  />
                  {formErrors.maxBudget && <div className="invalid-feedback">{formErrors.maxBudget}</div>}
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Max Members</label>
                  <input
                    type="number" name="maxMembers" min="2" max="20"
                    className="form-control"
                    value={formData.maxMembers} onChange={handleFormChange}
                    placeholder="5"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold d-block mb-2">Interests</label>
                  <div className="d-flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => (
                      <button
                        key={interest} type="button"
                        className={`btn btn-sm text-capitalize ${formData.interests.includes(interest) ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => handleInterestToggle(interest)}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox" className="form-check-input"
                      id="isPublic" name="isPublic"
                      checked={formData.isPublic} onChange={handleFormChange}
                    />
                    <label className="form-check-label" htmlFor="isPublic">
                      Make this trip public (visible to other users for joining)
                    </label>
                  </div>
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                    {submitting
                      ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</>
                      : <><i className="bi bi-plus-circle me-2" />Create Trip</>}
                  </button>
                  <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => setFormData(emptyForm)}>
                    <i className="bi bi-arrow-clockwise me-1" />Reset
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Trip Detail Modal ── */}
      {showModal && selectedTrip && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{selectedTrip.title}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <p className="fw-semibold small text-muted mb-1">Destination</p>
                    <p className="mb-0">
                      <i className="bi bi-geo-alt me-1 text-success" />
                      {selectedTrip.destination?.city || '—'}
                      {selectedTrip.destination?.country ? `, ${selectedTrip.destination.country}` : ''}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="fw-semibold small text-muted mb-1">Dates</p>
                    <p className="mb-0">
                      <i className="bi bi-calendar3 me-1" />
                      {formatDate(selectedTrip.startDate)} – {formatDate(selectedTrip.endDate)}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="fw-semibold small text-muted mb-1">Budget</p>
                    <p className="mb-0">
                      <i className="bi bi-wallet2 me-1" />
                      {selectedTrip.budget?.currency || 'INR'}{' '}
                      {selectedTrip.budget?.min?.toLocaleString()} – {selectedTrip.budget?.max?.toLocaleString()}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="fw-semibold small text-muted mb-1">Members</p>
                    <p className="mb-0">
                      <i className="bi bi-people me-1" />
                      {(selectedTrip.members?.filter((m) => m.status === 'accepted').length ?? 0) + 1}
                      {' / '}{selectedTrip.maxMembers ?? '∞'} members
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="fw-semibold small text-muted mb-1">Visibility</p>
                    <p className="mb-0">
                      <span className={`badge ${selectedTrip.isPublic ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedTrip.isPublic ? 'Public' : 'Private'}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="fw-semibold small text-muted mb-1">Status</p>
                    <p className="mb-0">{getTripStatusBadge(selectedTrip)}</p>
                  </div>
                  {selectedTrip.description && (
                    <div className="col-12">
                      <p className="fw-semibold small text-muted mb-1">Description</p>
                      <p className="mb-0">{selectedTrip.description}</p>
                    </div>
                  )}
                  {selectedTrip.interests?.length > 0 && (
                    <div className="col-12">
                      <p className="fw-semibold small text-muted mb-1">Interests</p>
                      <div className="d-flex flex-wrap gap-1">
                        {selectedTrip.interests.map((i) => (
                          <span key={i} className="badge bg-light text-dark border text-capitalize">{i}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Members — only show accepted, no raw status string */}
                  <div className="col-12">
                    <p className="fw-semibold small text-muted mb-2">
                      Members ({(selectedTrip.members?.filter((m) => m.status === 'accepted').length ?? 0) + 1} / {selectedTrip.maxMembers ?? '∞'})
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {/* Creator */}
                      {selectedTrip.createdBy && (
                        <div className="d-flex align-items-center gap-2 border rounded px-2 py-1 bg-success bg-opacity-10">
                          <AvatarCircle
                            name={selectedTrip.createdBy?.name || 'Creator'}
                            avatar={selectedTrip.createdBy?.avatar}
                            size={24}
                          />
                          <span className="small">{selectedTrip.createdBy?.name || 'Creator'}</span>
                          <span className="badge bg-success" style={{ fontSize: '.6rem' }}>Owner</span>
                        </div>
                      )}
                      {/* Only show accepted members — no pending/rejected */}
                      {selectedTrip.members
                        ?.filter((m) => m.status === 'accepted')
                        .map((member, idx) => (
                          <div
                            key={member.user?._id || idx}
                            className="d-flex align-items-center gap-2 border rounded px-2 py-1"
                          >
                            <AvatarCircle
                              name={member.user?.name || 'Member'}
                              avatar={member.user?.avatar}
                              size={24}
                            />
                            <span className="small">{member.user?.name || 'Member'}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedTrip._id)}
                  disabled={deleting}
                >
                  {deleting
                    ? <><span className="spinner-border spinner-border-sm me-2" />Deleting...</>
                    : <><i className="bi bi-trash me-2" />Delete Trip</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
