import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import profileService from '../../services/profileService';
import api from '../../services/api';
import { getInitials, formatDate, getErrorMessage } from '../../utils/helpers';
import { validateName, validateRequired } from '../../utils/validators';

/* ── Constants — must match backend enums exactly ────── */
const INTERESTS_LIST = [
  'adventure', 'beach', 'culture', 'food', 'history',
  'nature', 'nightlife', 'photography', 'shopping', 'spiritual', 'sports', 'wildlife',
];

// Must match Profile model travelStyle enum
const TRAVEL_STYLES = ['budget', 'mid-range', 'luxury', 'backpacker'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
// Must match Profile model gender enum (spaces, not hyphens)
const GENDERS = ['male', 'female', 'non-binary', 'prefer not to say'];
const TABS = ['Personal Info', 'Travel Interests', 'Budget & Style', 'Travel History'];

/* ── Sub-components ──────────────────────────────────── */
const StarRating = ({ value = 0, max = 5 }) => (
  <span className="text-warning">
    {Array.from({ length: max }, (_, i) => (
      <i key={i} className={`bi ${i < Math.round(value) ? 'bi-star-fill' : 'bi-star'} me-1`} />
    ))}
    <span className="text-muted small ms-1">({value?.toFixed?.(1) ?? '0.0'})</span>
  </span>
);

const AvatarCircle = ({ name, avatar, size = 100 }) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-circle object-fit-cover border border-3 border-white shadow"
        width={size}
        height={size}
      />
    );
  }
  return (
    <div
      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary border border-3 border-white shadow"
      style={{ width: size, height: size, fontSize: size * 0.3 }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
};

/* ── Profile Page ────────────────────────────────────── */
const Profile = () => {
  const { user, profile: ctxProfile, updateProfile, updateUser, updateAvatar } = useAuth();

  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const avatarRef = useRef(null);

  /* Form state */
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    bio: '',
    locationCity: '',
    locationCountry: '',
    interests: [],
    budgetMin: '',
    budgetMax: '',
    currency: 'INR',
    travelStyle: '',
  });

  /* New travel history entry */
  const [historyForm, setHistoryForm] = useState({ destination: '', year: '', notes: '' });
  const [addingHistory, setAddingHistory] = useState(false);

  /* ── Load profile ── */
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [profRes, compRes] = await Promise.all([
        profileService.getMyProfile(),
        profileService.getCompletion(),
      ]);
      // API: GET /profile/me → { success, data: <profile doc with populated user> }
      const p = profRes.data?.data ?? profRes.data ?? {};
      setProfile(p);
      // API: GET /profile/me/completion → { success, data: { percent, completed, total, missing } }
      setCompletion(compRes.data?.data?.percent ?? 0);
      populateForm(p, user);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const populateForm = (p, u) => {
    setForm({
      name:            u?.name ?? '',
      age:             p?.age ?? '',
      gender:          p?.gender ?? '',
      phone:           p?.phone ?? '',
      bio:             p?.bio ?? '',
      locationCity:    p?.location?.city ?? '',
      locationCountry: p?.location?.country ?? '',
      // Correct field names matching the Profile model
      interests:       p?.travelInterests ?? [],
      budgetMin:       p?.budgetRange?.min ?? '',
      budgetMax:       p?.budgetRange?.max ?? '',
      currency:        p?.budgetRange?.currency ?? 'INR',
      travelStyle:     p?.travelStyle ?? '',
    });
  };

  /* ── Form handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: null }));
  };

  const toggleInterest = (interest) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  /* ── Validation ── */
  const validate = () => {
    const errs = {};
    const nameErr = validateName(form.name);
    if (nameErr) errs.name = nameErr;
    if (form.age && (Number(form.age) < 18 || Number(form.age) > 100)) {
      errs.age = 'Age must be between 18 and 100';
    }
    if (form.budgetMin && form.budgetMax && Number(form.budgetMin) > Number(form.budgetMax)) {
      errs.budgetMax = 'Max budget must be ≥ min budget';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        // Profile fields — correct field names matching backend
        age:             form.age ? Number(form.age) : undefined,
        gender:          form.gender || undefined,
        phone:           form.phone || undefined,
        bio:             form.bio || undefined,
        location: {
          city:    form.locationCity || undefined,
          country: form.locationCountry || undefined,
        },
        travelInterests: form.interests,
        budgetRange: {
          min:      form.budgetMin !== '' ? Number(form.budgetMin) : 0,
          max:      form.budgetMax !== '' ? Number(form.budgetMax) : 0,
          currency: form.currency,
        },
        travelStyle: form.travelStyle || undefined,
      };
      const res = await profileService.updateMyProfile(payload);
      // API: { success, data: <updated profile> }
      const updated = res.data?.data ?? res.data ?? {};
      setProfile(updated);
      updateProfile(updated);

      // Also update user.name in AuthContext if name changed
      if (form.name && form.name !== user?.name) {
        try {
          await api.put('/auth/me', { name: form.name });
        } catch {
          // name update is best-effort; profile save already succeeded
        }
        updateUser({ name: form.name });
      }

      // Refresh completion percentage immediately
      try {
        const compRes = await profileService.getCompletion();
        setCompletion(compRes.data?.data?.percent ?? 0);
      } catch {
        // non-critical
      }

      setEditMode(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Avatar: backend accepts { avatar: URL } not a file upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB'); return; }
    setIsUploadingAvatar(true);
    setError('');
    try {
      // Convert to base64 data URL since backend expects a URL string
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await profileService.updateAvatar({ avatar: reader.result });
          // API: { success, data: { avatar } }
          const newUrl = res.data?.data?.avatar ?? res.data?.avatar ?? reader.result;
          updateAvatar(newUrl);
          setSuccessMsg('Avatar updated!');
          setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.onerror = () => { setError('Failed to read file'); setIsUploadingAvatar(false); };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(getErrorMessage(err));
      setIsUploadingAvatar(false);
    }
  };

  /* ── Travel History — uses `visitedOn` date field, not `year` ── */
  const handleAddHistory = async () => {
    if (!historyForm.destination.trim()) return;
    setAddingHistory(true);
    try {
      const payload = {
        destination: historyForm.destination.trim(),
        description: historyForm.notes || undefined,
      };
      // Convert year to an ISO date if provided
      if (historyForm.year) {
        payload.visitedOn = `${historyForm.year}-01-01`;
      }
      const res = await profileService.addTravelHistory(payload);
      // API: { success, data: [ ...travelHistory entries ] }
      const updatedHistory = res.data?.data ?? [];
      setProfile((prev) => ({ ...prev, travelHistory: updatedHistory }));
      setHistoryForm({ destination: '', year: '', notes: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingHistory(false);
    }
  };

  const handleDeleteHistory = async (index) => {
    try {
      const res = await profileService.deleteTravelHistory(index);
      // API: { success, data: [ ...remaining travelHistory ] }
      const updatedHistory = res.data?.data ?? [];
      setProfile((prev) => ({ ...prev, travelHistory: updatedHistory }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  /* ── Render guards ── */
  if (isLoading) {
    return (
      <div className="tt-loader">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Page header */}
      <div className="tt-page-header">
        <h2>My Profile</h2>
        <p className="text-muted">Manage your personal information and travel preferences</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          {error}
          <button className="btn-close ms-auto" onClick={() => setError('')} aria-label="Close" />
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success d-flex align-items-center" role="alert">
          <i className="bi bi-check-circle-fill me-2" />
          {successMsg}
        </div>
      )}

      <div className="row g-4">
        {/* ── Left column ── */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm text-center p-4">
            {/* Avatar */}
            <div className="position-relative d-inline-block mx-auto mb-3">
              <AvatarCircle name={user?.name ?? ''} avatar={user?.avatar ?? ''} size={100} />
              <button
                className="btn btn-sm btn-primary rounded-circle position-absolute"
                style={{ bottom: 0, right: 0, width: 32, height: 32, padding: 0 }}
                onClick={() => avatarRef.current?.click()}
                title="Change photo"
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <i className="bi bi-camera-fill" style={{ fontSize: '0.75rem' }} />
                )}
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={handleAvatarChange}
                aria-label="Upload avatar"
              />
            </div>

            <h4 className="fw-bold mb-0">{user?.name ?? '—'}</h4>
            <p className="text-muted small mb-2">{user?.email ?? ''}</p>

            <div className="mb-3">
              <StarRating value={profile?.reputationScore ?? 0} />
            </div>

            {profile?.location?.city && (
              <div className="text-muted small mb-2">
                <i className="bi bi-geo-alt me-1" />
                {profile.location.city}
                {profile.location.country ? `, ${profile.location.country}` : ''}
              </div>
            )}

            <div className="text-muted small mb-3">
              <i className="bi bi-calendar3 me-1" />
              Member since {formatDate(user?.createdAt ?? profile?.createdAt)}
            </div>

            {/* Completion bar */}
            <div className="mb-3">
              <div className="d-flex justify-content-between small mb-1">
                <span className="fw-semibold">Profile Completion</span>
                <span className="text-muted">{completion}%</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className={`progress-bar ${completion >= 80 ? 'bg-success' : completion >= 50 ? 'bg-warning' : 'bg-danger'}`}
                  role="progressbar"
                  style={{ width: `${completion}%` }}
                  aria-valuenow={completion}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

            {editMode ? (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary flex-grow-1"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="spinner-border spinner-border-sm me-1" />
                  ) : (
                    <i className="bi bi-check-lg me-1" />
                  )}
                  Save
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => { setEditMode(false); populateForm(profile, user); setFieldErrors({}); }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => setEditMode(true)}
              >
                <i className="bi bi-pencil-fill me-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            {/* Tabs */}
            <div className="card-header bg-transparent border-bottom px-4 pt-3 pb-0">
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                {TABS.map((tab, i) => (
                  <li key={tab} className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === i ? 'active' : ''}`}
                      onClick={() => setActiveTab(i)}
                      role="tab"
                      aria-selected={activeTab === i}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-body p-4">
              {/* ── Tab 0: Personal Info ── */}
              {activeTab === 0 && (
                <div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Full Name</label>
                      {editMode ? (
                        <>
                          <input
                            type="text"
                            name="name"
                            className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                            value={form.name}
                            onChange={handleChange}
                          />
                          {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
                        </>
                      ) : (
                        <p className="text-muted mb-0">{user?.name || '—'}</p>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Email</label>
                      <p className="text-muted mb-0">{user?.email || '—'}</p>
                      <small className="text-muted">Email cannot be changed here</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Age</label>
                      {editMode ? (
                        <>
                          <input
                            type="number"
                            name="age"
                            min={18}
                            max={100}
                            className={`form-control ${fieldErrors.age ? 'is-invalid' : ''}`}
                            value={form.age}
                            onChange={handleChange}
                          />
                          {fieldErrors.age && <div className="invalid-feedback">{fieldErrors.age}</div>}
                        </>
                      ) : (
                        <p className="text-muted mb-0">{profile?.age || '—'}</p>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Gender</label>
                      {editMode ? (
                        <select
                          name="gender"
                          className="form-select"
                          value={form.gender}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          {GENDERS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-muted mb-0 text-capitalize">{profile?.gender || '—'}</p>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Phone</label>
                      {editMode ? (
                        <input
                          type="tel"
                          name="phone"
                          className="form-control"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+91 9876543210"
                        />
                      ) : (
                        <p className="text-muted mb-0">{profile?.phone || '—'}</p>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">City</label>
                      {editMode ? (
                        <input
                          type="text"
                          name="locationCity"
                          className="form-control"
                          value={form.locationCity}
                          onChange={handleChange}
                          placeholder="Mumbai"
                        />
                      ) : (
                        <p className="text-muted mb-0">{profile?.location?.city || '—'}</p>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Country</label>
                      {editMode ? (
                        <input
                          type="text"
                          name="locationCountry"
                          className="form-control"
                          value={form.locationCountry}
                          onChange={handleChange}
                          placeholder="India"
                        />
                      ) : (
                        <p className="text-muted mb-0">{profile?.location?.country || '—'}</p>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Bio</label>
                      {editMode ? (
                        <textarea
                          name="bio"
                          className="form-control"
                          rows={3}
                          value={form.bio}
                          onChange={handleChange}
                          placeholder="Tell fellow travellers about yourself…"
                          maxLength={500}
                        />
                      ) : (
                        <p className="text-muted mb-0">{profile?.bio || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 1: Travel Interests ── */}
              {activeTab === 1 && (
                <div>
                  <p className="text-muted small mb-3">Select all the travel types you enjoy.</p>
                  <div className="row g-2">
                    {INTERESTS_LIST.map((interest) => {
                      const selected = form.interests.includes(interest);
                      return (
                        <div key={interest} className="col-6 col-sm-4 col-md-3">
                          <div
                            className={`card border p-2 text-center cursor-pointer ${
                              selected ? 'border-primary bg-primary bg-opacity-10' : ''
                            }`}
                            style={{ cursor: editMode ? 'pointer' : 'default' }}
                            onClick={() => editMode && toggleInterest(interest)}
                            role={editMode ? 'checkbox' : undefined}
                            aria-checked={selected}
                            tabIndex={editMode ? 0 : -1}
                            onKeyDown={(e) => e.key === 'Enter' && editMode && toggleInterest(interest)}
                          >
                            {selected && editMode && (
                              <i className="bi bi-check-circle-fill text-primary small d-block mb-1" />
                            )}
                            <span className="text-capitalize small fw-semibold">{interest}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!editMode && (
                    <p className="text-muted small mt-3">
                      <i className="bi bi-info-circle me-1" />
                      Click "Edit Profile" to change your interests.
                    </p>
                  )}
                </div>
              )}

              {/* ── Tab 2: Budget & Style ── */}
              {activeTab === 2 && (
                <div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">Currency</label>
                      {editMode ? (
                        <select
                          name="currency"
                          className="form-select"
                          value={form.currency}
                          onChange={handleChange}
                        >
                          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <p className="text-muted mb-0">{profile?.budgetRange?.currency || 'INR'}</p>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">Min Budget</label>
                      {editMode ? (
                        <input
                          type="number"
                          name="budgetMin"
                          className="form-control"
                          value={form.budgetMin}
                          onChange={handleChange}
                          min={0}
                          placeholder="0"
                        />
                      ) : (
                        <p className="text-muted mb-0">{profile?.budgetRange?.min ?? '—'}</p>
                      )}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">Max Budget</label>
                      {editMode ? (
                        <>
                          <input
                            type="number"
                            name="budgetMax"
                            className={`form-control ${fieldErrors.budgetMax ? 'is-invalid' : ''}`}
                            value={form.budgetMax}
                            onChange={handleChange}
                            min={0}
                            placeholder="50000"
                          />
                          {fieldErrors.budgetMax && <div className="invalid-feedback">{fieldErrors.budgetMax}</div>}
                        </>
                      ) : (
                        <p className="text-muted mb-0">{profile?.budgetRange?.max ?? '—'}</p>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold small">Travel Style</label>
                      {editMode ? (
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {TRAVEL_STYLES.map((style) => (
                            <div key={style} className="form-check form-check-inline">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="travelStyle"
                                id={`style-${style}`}
                                value={style}
                                checked={form.travelStyle === style}
                                onChange={handleChange}
                              />
                              <label
                                className="form-check-label text-capitalize"
                                htmlFor={`style-${style}`}
                              >
                                {style}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted mb-0 text-capitalize">{profile?.travelStyle || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 3: Travel History ── */}
              {activeTab === 3 && (
                <div>
                  {/* Add new entry */}
                  <div className="card border bg-light mb-4 p-3">
                    <h6 className="fw-semibold mb-3">Add New Entry</h6>
                    <div className="row g-2">
                      <div className="col-md-5">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Destination (e.g. Bali, Indonesia)"
                          value={historyForm.destination}
                          onChange={(e) => setHistoryForm((p) => ({ ...p, destination: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-3">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Year"
                          min={1950}
                          max={new Date().getFullYear()}
                          value={historyForm.year}
                          onChange={(e) => setHistoryForm((p) => ({ ...p, year: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Notes (optional)"
                          value={historyForm.notes}
                          onChange={(e) => setHistoryForm((p) => ({ ...p, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      onClick={handleAddHistory}
                      disabled={addingHistory || !historyForm.destination.trim()}
                    >
                      {addingHistory ? (
                        <span className="spinner-border spinner-border-sm me-1" />
                      ) : (
                        <i className="bi bi-plus-circle me-1" />
                      )}
                      Add
                    </button>
                  </div>

                  {/* History list */}
                  {(!profile?.travelHistory || profile.travelHistory.length === 0) ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-compass fs-1 d-block mb-2 opacity-25" />
                      <p>No travel history yet. Start adding your adventures!</p>
                    </div>
                  ) : (
                    <div className="list-group">
                      {profile.travelHistory.map((entry, idx) => (
                        <div
                          key={idx}
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold">{entry.destination}</div>
                            <div className="text-muted small">
                              {entry.year && <span className="me-2">Year: {entry.year}</span>}
                              {entry.notes && <span>{entry.notes}</span>}
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteHistory(idx)}
                            aria-label="Delete entry"
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
