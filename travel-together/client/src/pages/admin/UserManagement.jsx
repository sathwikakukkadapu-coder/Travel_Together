import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { formatDate, getInitials, getErrorMessage } from '../../utils/helpers';

const Avatar = ({ name, avatar, size = 40 }) => (
  avatar
    ? <img src={avatar} alt={name} className="rounded-circle object-fit-cover flex-shrink-0" width={size} height={size} />
    : <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary flex-shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.35 }}>{getInitials(name)}</div>
);

const UserManagement = () => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [searchQ, setSearchQ]       = useState('');
  const [statusF, setStatusF]       = useState('all');
  const [roleF, setRoleF]           = useState('all');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [modal, setModal]           = useState(null); // { type: 'confirm'|'detail', user, action? }
  const [processing, setProcessing] = useState(false);
  const [detail, setDetail]         = useState(null); // { user, profile }

  const searchTimer = useRef(null);

  const fetchUsers = useCallback(async (pg = page, q = searchQ) => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/users', {
        params: {
          page: pg, limit: 15,
          search: q || undefined,
          status: statusF !== 'all' ? statusF : undefined,
          role:   roleF   !== 'all' ? roleF   : undefined,
        },
      });
      setUsers(res.data?.data       || []);
      setTotal(res.data?.total      || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [page, searchQ, statusF, roleF]);

  useEffect(() => { fetchUsers(); }, [page, statusF, roleF]); // eslint-disable-line

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, searchQ);
    }, 400);
  }, [searchQ]); // eslint-disable-line

  const openDetail = async (user) => {
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      setDetail(res.data?.data || { user, profile: null });
      setModal({ type: 'detail', user });
    } catch (e) { setError(getErrorMessage(e)); }
  };

  const handleAction = async () => {
    if (!modal?.user) return;
    setProcessing(true);
    try {
      if (modal.action === 'toggle') {
        const res = await api.put(`/admin/users/${modal.user._id}/toggle-status`);
        const msg = res.data?.message || 'Status updated';
        setSuccess(msg);
      } else if (modal.action === 'delete') {
        await api.delete(`/admin/users/${modal.user._id}`);
        setSuccess(`${modal.user.name} deleted.`);
      }
      setModal(null);
      setDetail(null);
      fetchUsers();
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setProcessing(false); }
  };

  const Pagination = () => totalPages <= 1 ? null : (
    <nav className="mt-4">
      <ul className="pagination justify-content-center mb-0">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => setPage(page - 1)}><i className="bi bi-chevron-left" /></button>
        </li>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
          .reduce((acc, n, idx, arr) => {
            if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
            acc.push(n); return acc;
          }, [])
          .map((n, i) =>
            n === '...'
              ? <li key={`e${i}`} className="page-item disabled"><span className="page-link">…</span></li>
              : <li key={n} className={`page-item ${page === n ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(n)}>{n}</button>
                </li>
          )}
        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => setPage(page + 1)}><i className="bi bi-chevron-right" /></button>
        </li>
      </ul>
    </nav>
  );

  return (
    <div className="container-fluid">
      <div className="tt-page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h2 className="mb-1">User Management</h2>
          <p className="text-muted mb-0 small">{total} total users</p>
        </div>
      </div>

      {error   && <div className="alert alert-danger alert-dismissible"><i className="bi bi-exclamation-triangle-fill me-2" />{error}<button className="btn-close" onClick={() => setError('')} /></div>}
      {success && <div className="alert alert-success alert-dismissible"><i className="bi bi-check-circle-fill me-2" />{success}<button className="btn-close" onClick={() => setSuccess('')} /></div>}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-transparent"><i className="bi bi-search" /></span>
                <input className="form-control border-start-0" placeholder="Search name or email..."
                  value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                {searchQ && <button className="btn btn-outline-secondary" onClick={() => setSearchQ('')}><i className="bi bi-x" /></button>}
              </div>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Blocked</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={roleF} onChange={(e) => { setRoleF(e.target.value); setPage(1); }}>
                <option value="all">All Roles</option>
                <option value="traveler">Traveler</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearchQ(''); setStatusF('all'); setRoleF('all'); setPage(1); }}>
                <i className="bi bi-arrow-clockwise me-1" />Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
          {!loading && users.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people fs-1 opacity-25 d-block mb-3" />No users found
            </div>
          )}
          {!loading && users.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Reports</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={u.name} avatar={u.avatar} />
                          <div>
                            <div className="fw-semibold small">{u.name}</div>
                            {u.lastLogin && <div className="text-muted" style={{ fontSize: '.68rem' }}>Last login {formatDate(u.lastLogin)}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="text-muted small">{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {u.isActive ? 'Active' : 'Blocked'}
                        </span>
                        {u.isReported && <span className="badge bg-warning text-dark ms-1">Reported</span>}
                      </td>
                      <td className="text-muted small">{formatDate(u.createdAt)}</td>
                      <td>
                        {u.isReported
                          ? <span className="badge bg-warning text-dark">Flagged</span>
                          : <span className="text-muted small">—</span>}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" title="View details" onClick={() => openDetail(u)}>
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            className={`btn ${u.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            title={u.isActive ? 'Block user' : 'Unblock user'}
                            onClick={() => setModal({ type: 'confirm', user: u, action: 'toggle' })}
                            disabled={u.role === 'admin'}
                          >
                            <i className={`bi ${u.isActive ? 'bi-lock' : 'bi-unlock'}`} />
                          </button>
                          <button
                            className="btn btn-outline-danger" title="Delete user"
                            onClick={() => setModal({ type: 'confirm', user: u, action: 'delete' })}
                            disabled={u.role === 'admin'}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Pagination />

      {/* Confirm modal */}
      {modal?.type === 'confirm' && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modal.action === 'toggle' ? (modal.user.isActive ? 'Block User' : 'Unblock User') : 'Delete User'}
                </h5>
                <button className="btn-close" onClick={() => setModal(null)} />
              </div>
              <div className="modal-body">
                {modal.action === 'delete' && (
                  <div className="alert alert-danger py-2 small">
                    <i className="bi bi-exclamation-triangle-fill me-2" />This action cannot be undone.
                  </div>
                )}
                <div className="d-flex align-items-center gap-3 mb-3">
                  <Avatar name={modal.user.name} avatar={modal.user.avatar} size={48} />
                  <div>
                    <div className="fw-semibold">{modal.user.name}</div>
                    <div className="text-muted small">{modal.user.email}</div>
                  </div>
                </div>
                <p className="mb-0">
                  Are you sure you want to{' '}
                  {modal.action === 'toggle'
                    ? (modal.user.isActive ? 'block' : 'unblock')
                    : 'permanently delete'}{' '}
                  this user?
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={processing}>Cancel</button>
                <button
                  className={`btn ${modal.action === 'delete' ? 'btn-danger' : modal.user.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={handleAction} disabled={processing}
                >
                  {processing
                    ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</>
                    : modal.action === 'delete' ? 'Delete'
                    : modal.user.isActive ? 'Block' : 'Unblock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {modal?.type === 'detail' && detail && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details</h5>
                <button className="btn-close" onClick={() => { setModal(null); setDetail(null); }} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-4 text-center">
                    <Avatar name={detail.user?.name} avatar={detail.user?.avatar} size={80} />
                    <div className="fw-bold mt-2">{detail.user?.name}</div>
                    <div className="text-muted small">{detail.user?.email}</div>
                    <span className={`badge mt-1 ${detail.user?.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {detail.user?.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </div>
                  <div className="col-md-8">
                    <div className="row g-2 small">
                      {[
                        ['Role',     detail.user?.role],
                        ['Joined',   formatDate(detail.user?.createdAt)],
                        ['Last Login', detail.user?.lastLogin ? formatDate(detail.user?.lastLogin) : 'Never'],
                        ['Location', detail.profile ? `${detail.profile.location?.city || '—'}, ${detail.profile.location?.country || ''}` : '—'],
                        ['Budget',   detail.profile ? `${detail.profile.budgetRange?.currency || 'INR'} ${detail.profile.budgetRange?.min ?? 0}–${detail.profile.budgetRange?.max ?? 0}` : '—'],
                        ['Reputation', detail.profile ? `${detail.profile.reputationScore ?? 0} / 5 (${detail.profile.totalRatings ?? 0} ratings)` : '—'],
                        ['Interests', detail.profile?.travelInterests?.join(', ') || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="col-6">
                          <div className="text-muted">{k}</div>
                          <div className="fw-semibold">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button className="btn btn-secondary" onClick={() => { setModal(null); setDetail(null); }}>Close</button>
                <button
                  className={`btn ${detail.user?.isActive ? 'btn-warning' : 'btn-success'}`}
                  disabled={detail.user?.role === 'admin'}
                  onClick={() => { setDetail(null); setModal({ type: 'confirm', user: detail.user, action: 'toggle' }); }}
                >
                  {detail.user?.isActive ? 'Block User' : 'Unblock User'}
                </button>
                <button
                  className="btn btn-danger" disabled={detail.user?.role === 'admin'}
                  onClick={() => { setDetail(null); setModal({ type: 'confirm', user: detail.user, action: 'delete' }); }}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
