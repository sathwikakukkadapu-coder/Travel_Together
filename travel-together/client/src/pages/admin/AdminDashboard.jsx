import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatDate, getErrorMessage } from '../../utils/helpers';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, newThisMonth: 0 },
    trips: { total: 0, active: 0, completed: 0 },
    reports: { total: 0, pending: 0, resolved: 0 },
    reviews: { total: 0, averageRating: 0 },
    messages: { total: 0 },
  });
  const [recentReports, setRecentReports] = useState([]);
  const [recentUsers, setRecentUsers]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, reportsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/reports', { params: { limit: 5, status: 'pending' } }),
        api.get('/admin/users',   { params: { limit: 5, sort: 'newest' } }),
      ]);

      // API: { success, data: { users, trips, reports, reviews, messages } }
      setStats(statsRes.data?.data || stats);
      // API: { success, count, data: [...reports] }
      setRecentReports(reportsRes.data?.data || []);
      // API: { success, count, data: [...users] }
      setRecentUsers(usersRes.data?.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { label: 'Total Users',      value: stats.users?.total ?? 0,      icon: 'bi-people-fill',              colorClass: 'bg-primary bg-opacity-10 text-primary', link: '/admin/users'    },
    { label: 'Active Trips',     value: stats.trips?.active ?? 0,     icon: 'bi-map-fill',                  colorClass: 'bg-success bg-opacity-10 text-success', link: '/admin'          },
    { label: 'Pending Reports',  value: stats.reports?.pending ?? 0,  icon: 'bi-exclamation-triangle-fill', colorClass: 'bg-danger bg-opacity-10 text-danger',   link: '/admin/reported' },
    { label: 'Total Reviews',    value: stats.reviews?.total ?? 0,    icon: 'bi-star-fill',                  colorClass: 'bg-warning bg-opacity-10 text-warning', link: '/admin/feedback' },
  ];

  const getStatusBadge = (status) =>
    ({ pending: 'bg-warning', reviewed: 'bg-info', resolved: 'bg-success', dismissed: 'bg-secondary' }[status] || 'bg-secondary');

  return (
    <div className="container-fluid">
      <div className="tt-page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Admin Dashboard</h2>
          <p className="text-muted mb-0">Monitor and manage the Travel Together platform</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchDashboardData} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1" />Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          <i className="bi bi-exclamation-triangle-fill me-2" />{error}
          <button type="button" className="btn-close" onClick={() => setError('')} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {statsCards.map((card) => (
          <div key={card.label} className="col-md-6 col-lg-3">
            <Link to={card.link} className="text-decoration-none">
              <div className="card tt-stats-card h-100 border-0 shadow-sm">
                <div className="card-body d-flex align-items-center gap-3 py-3">
                  <div className={`stats-icon rounded-3 ${card.colorClass}`}>
                    <i className={`bi ${card.icon}`} />
                  </div>
                  <div>
                    <div className="fw-bold fs-4 lh-1">{loading ? '—' : card.value}</div>
                    <div className="text-muted small mt-1">{card.label}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Extra stats row */}
      {!loading && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3">
              <div className="text-muted small mb-1">New Users (30 days)</div>
              <div className="fw-bold fs-5">{stats.users?.newThisMonth ?? 0}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3">
              <div className="text-muted small mb-1">Avg Rating</div>
              <div className="fw-bold fs-5">{stats.reviews?.averageRating ?? 0} <i className="bi bi-star-fill text-warning small" /></div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3">
              <div className="text-muted small mb-1">Total Messages</div>
              <div className="fw-bold fs-5">{stats.messages?.total ?? 0}</div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Placeholder chart */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-graph-up text-primary me-2" />User Growth
              </h5>
            </div>
            <div className="card-body text-center py-5 text-muted">
              <i className="bi bi-graph-up fs-1 opacity-25 d-block mb-3" />
              <p className="mb-1">Chart visualization coming soon</p>
              <small>Integrate with a chart library (e.g. Chart.js) for analytics</small>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-person-plus text-success me-2" />Recent Users
              </h5>
              <Link to="/admin/users" className="btn btn-sm btn-outline-success">View All</Link>
            </div>
            <div className="card-body">
              {loading && <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>}
              {!loading && recentUsers.length === 0 && (
                <p className="text-muted text-center small mb-0">No users found</p>
              )}
              {!loading && recentUsers.map((u) => (
                <div key={u._id} className="d-flex align-items-center gap-2 mb-3">
                  <div
                    className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary flex-shrink-0"
                    style={{ width: 36, height: 36, fontSize: '.75rem' }}
                  >
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <p className="mb-0 fw-semibold small text-truncate">{u.name}</p>
                    <p className="mb-0 text-muted" style={{ fontSize: '.7rem' }}>{formatDate(u.createdAt)}</p>
                  </div>
                  <span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'} small`}>
                    {u.isActive ? 'Active' : 'Blocked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3">
          <h5 className="mb-0 fw-semibold">
            <i className="bi bi-flag-fill text-danger me-2" />Pending Reports
          </h5>
          <Link to="/admin/reported" className="btn btn-sm btn-outline-danger">View All</Link>
        </div>
        <div className="card-body">
          {loading && <div className="tt-loader"><div className="spinner-border text-primary" /></div>}
          {!loading && recentReports.length === 0 && (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-check-circle fs-1 opacity-25 d-block mb-2" />
              <p className="mb-0">No pending reports — all clear!</p>
            </div>
          )}
          {!loading && recentReports.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Reported User</th>
                    <th>Reported By</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        <div className="fw-semibold">{report.reportedUser?.name || 'Unknown'}</div>
                        <small className="text-muted">{report.reportedUser?.email || '—'}</small>
                      </td>
                      <td className="small">{report.reportedBy?.name || 'Anonymous'}</td>
                      <td><span className="badge bg-danger bg-opacity-10 text-danger border">{report.reason}</span></td>
                      <td><span className={`badge ${getStatusBadge(report.status)}`}>{report.status}</span></td>
                      <td className="text-muted small">{formatDate(report.createdAt)}</td>
                      <td>
                        <Link to={`/admin/reported?id=${report._id}`} className="btn btn-sm btn-outline-primary">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
