import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { formatDate, getInitials, getErrorMessage, truncate } from '../../utils/helpers';

const AvatarCircle = ({ name, avatar, size = 40 }) => {
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

const ReportedUsers = () => {
  const [searchParams] = useSearchParams();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [page, filterStatus]);

  useEffect(() => {
    const reportId = searchParams.get('id');
    if (reportId && reports.length > 0) {
      const report = reports.find((r) => r._id === reportId);
      if (report) {
        openModal(report);
      }
    }
  }, [searchParams, reports]);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 15,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      };
      const res = await api.get('/admin/reports', { params });
      setReports(res.data?.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    setProcessing(true);
    try {
      await api.put(`/admin/reports/${reportId}`, {
        status: newStatus,
        adminNote: adminNote.trim() || undefined,
      });
      fetchReports();
      setShowModal(false);
      setSelectedReport(null);
      setAdminNote('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setAdminNote(report.adminNote || '');
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning',
      reviewed: 'bg-info',
      resolved: 'bg-success',
      dismissed: 'bg-secondary',
    };
    return badges[status] || 'bg-secondary';
  };

  const getReasonBadge = (reason) => {
    const badges = {
      spam: 'bg-warning',
      harassment: 'bg-danger',
      inappropriate: 'bg-danger',
      fraud: 'bg-danger',
      other: 'bg-secondary',
    };
    return badges[reason] || 'bg-secondary';
  };

  return (
    <div className="container-fluid">
      <div className="tt-page-header">
        <h2>Reported Users</h2>
        <p className="text-muted">Review and manage user reports</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')} />
        </div>
      )}

      {/* Status Filters */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('all');
              setPage(1);
            }}
          >
            All
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('pending');
              setPage(1);
            }}
          >
            Pending
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filterStatus === 'reviewed' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('reviewed');
              setPage(1);
            }}
          >
            Reviewed
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filterStatus === 'resolved' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('resolved');
              setPage(1);
            }}
          >
            Resolved
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filterStatus === 'dismissed' ? 'active' : ''}`}
            onClick={() => {
              setFilterStatus('dismissed');
              setPage(1);
            }}
          >
            Dismissed
          </button>
        </li>
      </ul>

      {/* Reports Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading && (
            <div className="tt-loader">
              <div className="spinner-border text-primary" />
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-check-circle fs-1 opacity-25" />
              <p className="mt-3 mb-0">No reports found</p>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Reported User</th>
                    <th>Reported By</th>
                    <th>Reason</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <AvatarCircle
                            name={report.reportedUser?.name || 'Unknown'}
                            avatar={report.reportedUser?.avatar}
                            size={40}
                          />
                          <div>
                            <div className="fw-semibold">{report.reportedUser?.name || 'Unknown'}</div>
                            <small className="text-muted">{report.reportedUser?.email || '—'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{report.reportedBy?.name || 'Anonymous'}</div>
                        <small className="text-muted">{report.reportedBy?.email || '—'}</small>
                      </td>
                      <td>
                        <span className={`badge ${getReasonBadge(report.reason)}`}>
                          {report.reason}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted small">{truncate(report.description, 60)}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="text-muted small">{formatDate(report.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openModal(report)}
                        >
                          <i className="bi bi-eye me-1" />
                          Details
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

      {/* Detail Modal */}
      {showModal && selectedReport && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Report Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Reported User</label>
                    <div className="d-flex align-items-center gap-2">
                      <AvatarCircle
                        name={selectedReport.reportedUser?.name || 'Unknown'}
                        avatar={selectedReport.reportedUser?.avatar}
                        size={48}
                      />
                      <div>
                        <div className="fw-semibold">{selectedReport.reportedUser?.name || 'Unknown'}</div>
                        <small className="text-muted">{selectedReport.reportedUser?.email || '—'}</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Reported By</label>
                    <div className="d-flex align-items-center gap-2">
                      <AvatarCircle
                        name={selectedReport.reportedBy?.name || 'Anonymous'}
                        avatar={selectedReport.reportedBy?.avatar}
                        size={48}
                      />
                      <div>
                        <div className="fw-semibold">{selectedReport.reportedBy?.name || 'Anonymous'}</div>
                        <small className="text-muted">{selectedReport.reportedBy?.email || '—'}</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Reason</label>
                    <div>
                      <span className={`badge ${getReasonBadge(selectedReport.reason)}`}>
                        {selectedReport.reason}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Status</label>
                    <div>
                      <span className={`badge ${getStatusBadge(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small text-muted">Description</label>
                    <p className="mb-0">{selectedReport.description}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Date Reported</label>
                    <p className="mb-0">{formatDate(selectedReport.createdAt)}</p>
                  </div>
                  {selectedReport.resolvedAt && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small text-muted">Date Resolved</label>
                      <p className="mb-0">{formatDate(selectedReport.resolvedAt)}</p>
                    </div>
                  )}
                  <div className="col-12">
                    <label className="form-label fw-semibold">Admin Note</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add internal notes about this report..."
                    />
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
                {selectedReport.status === 'pending' && (
                  <>
                    <button
                      className="btn btn-info"
                      onClick={() => handleUpdateStatus(selectedReport._id, 'reviewed')}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Processing...
                        </>
                      ) : (
                        'Mark Reviewed'
                      )}
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')}
                      disabled={processing}
                    >
                      Resolve
                    </button>
                    <button
                      className="btn btn-warning"
                      onClick={() => handleUpdateStatus(selectedReport._id, 'dismissed')}
                      disabled={processing}
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {selectedReport.status === 'reviewed' && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')}
                      disabled={processing}
                    >
                      Resolve
                    </button>
                    <button
                      className="btn btn-warning"
                      onClick={() => handleUpdateStatus(selectedReport._id, 'dismissed')}
                      disabled={processing}
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportedUsers;
