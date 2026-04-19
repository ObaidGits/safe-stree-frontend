import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  UserSquare2,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createManagedAdmin,
  fetchManagedAdmins,
  fetchManagedUsers,
  fetchManagementOverview,
  updateManagedAdmin,
  updateManagedAdminStatus,
  updateManagedUser,
  updateManagedUserStatus,
} from '../../../services/Apis';

const defaultAdminForm = {
  officerName: '',
  email: '',
  policeStation: '',
  password: '',
};

const bloodGroupOptions = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const getMedicalConditionsText = (value) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value || '';
};

const formatDate = (dateValue) => {
  if (!dateValue) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));
};

const toAbsoluteAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';

  if (
    avatarPath.startsWith('http://') ||
    avatarPath.startsWith('https://') ||
    avatarPath.startsWith('blob:') ||
    avatarPath.startsWith('data:')
  ) {
    return avatarPath;
  }

  const baseUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
  return `${baseUrl}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
};

const AdminManagement = () => {
  const [entityTab, setEntityTab] = useState('users');
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState({ page: 1, pages: 1, total: 0, limit: 8 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatus, setAdminStatus] = useState('all');
  const [adminPage, setAdminPage] = useState(1);
  const [admins, setAdmins] = useState([]);
  const [adminsMeta, setAdminsMeta] = useState({ page: 1, pages: 1, total: 0, limit: 8 });
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [togglingAdminId, setTogglingAdminId] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [createAdminForm, setCreateAdminForm] = useState(defaultAdminForm);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const currentAvatarPreview = useMemo(
    () => toAbsoluteAvatarUrl(editingUser?.avatar),
    [editingUser?.avatar]
  );

  const selectedAvatarPreview = useMemo(() => {
    if (!editingUser?.avatarFile) return '';
    return URL.createObjectURL(editingUser.avatarFile);
  }, [editingUser?.avatarFile]);

  useEffect(() => {
    return () => {
      if (selectedAvatarPreview) {
        URL.revokeObjectURL(selectedAvatarPreview);
      }
    };
  }, [selectedAvatarPreview]);

  const reloadOverview = useCallback(async () => {
    try {
      const res = await fetchManagementOverview();
      if (res?.status === 200 && res?.data?.data) {
        setOverview(res.data.data);
        return;
      }
      toast.error(res?.data?.message || 'Failed to load management overview');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load management overview');
    }
  }, []);

  const loadUsers = useCallback(
    async ({ page = userPage, search = userSearch, status = userStatus } = {}) => {
      setUsersLoading(true);
      try {
        const res = await fetchManagedUsers({ page, limit: usersMeta.limit, search, status });
        if (res?.status === 200 && res?.data?.data) {
          const { users: userRows = [], pagination } = res.data.data;
          setUsers(userRows);
          setUsersMeta((prev) => ({ ...prev, ...(pagination || {}) }));
          return;
        }
        toast.error(res?.data?.message || 'Failed to load users');
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load users');
      } finally {
        setUsersLoading(false);
      }
    },
    [userPage, userSearch, userStatus, usersMeta.limit]
  );

  const loadAdmins = useCallback(
    async ({ page = adminPage, search = adminSearch, status = adminStatus } = {}) => {
      setAdminsLoading(true);
      try {
        const res = await fetchManagedAdmins({ page, limit: adminsMeta.limit, search, status });
        if (res?.status === 200 && res?.data?.data) {
          const { admins: adminRows = [], pagination } = res.data.data;
          setAdmins(adminRows);
          setAdminsMeta((prev) => ({ ...prev, ...(pagination || {}) }));
          return;
        }
        toast.error(res?.data?.message || 'Failed to load admins');
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load admins');
      } finally {
        setAdminsLoading(false);
      }
    },
    [adminPage, adminSearch, adminStatus, adminsMeta.limit]
  );

  useEffect(() => {
    const init = async () => {
      setOverviewLoading(true);
      await reloadOverview();
      setOverviewLoading(false);
    };
    init();
  }, [reloadOverview]);

  useEffect(() => {
    if (entityTab === 'users') {
      loadUsers();
    }
  }, [entityTab, userPage, userStatus, loadUsers]);

  useEffect(() => {
    if (entityTab === 'admins') {
      loadAdmins();
    }
  }, [entityTab, adminPage, adminStatus, loadAdmins]);

  const summaryCards = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        title: 'Users',
        value: overview.users?.total ?? 0,
        detail: `${overview.users?.active ?? 0} active`,
        Icon: Users,
      },
      {
        title: 'Admins',
        value: overview.admins?.total ?? 0,
        detail: `${overview.admins?.active ?? 0} active`,
        Icon: ShieldCheck,
      },
      {
        title: 'Web Alerts',
        value: overview.alerts?.web?.total ?? 0,
        detail: `${overview.alerts?.web?.active ?? 0} active`,
        Icon: UserSquare2,
      },
      {
        title: 'CCTV Alerts',
        value: overview.alerts?.cctv?.total ?? 0,
        detail: `${overview.alerts?.cctv?.active ?? 0} active`,
        Icon: ShieldCheck,
      },
    ];
  }, [overview]);

  const applyUserSearch = () => {
    setUserPage(1);
    loadUsers({ page: 1, search: userSearch, status: userStatus });
  };

  const applyAdminSearch = () => {
    setAdminPage(1);
    loadAdmins({ page: 1, search: adminSearch, status: adminStatus });
  };

  const refreshCurrentTab = async () => {
    await reloadOverview();
    if (entityTab === 'users') {
      await loadUsers();
    } else {
      await loadAdmins();
    }
  };

  const handleToggleUserStatus = async (user) => {
    setTogglingUserId(user._id);
    try {
      const res = await updateManagedUserStatus(user._id, !user.isActive);
      if (res?.status === 200) {
        toast.success(res?.data?.message || 'User status updated');
        await Promise.all([reloadOverview(), loadUsers()]);
      } else {
        toast.error(res?.data?.message || 'Failed to update user status');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update user status');
    } finally {
      setTogglingUserId('');
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser?._id) return;

    const payload = new FormData();

    payload.append('fullName', editingUser.fullName || '');
    payload.append('username', editingUser.username || '');
    payload.append('email', editingUser.email || '');
    payload.append('contact', editingUser.contact || '');

    if (editingUser.age !== '' && editingUser.age !== null && editingUser.age !== undefined) {
      payload.append('age', String(Number(editingUser.age)));
    }

    payload.append('bloodGroup', editingUser.bloodGroup || '');
    payload.append('medicalInfo', editingUser.medicalInfo || '');
    payload.append('medicalConditions', editingUser.medicalConditionsText || '');
    payload.append('allergies', editingUser.allergies || '');
    payload.append('city', editingUser.city || '');
    payload.append('state', editingUser.state || '');
    payload.append('address', editingUser.address || '');
    payload.append('pincode', editingUser.pincode || '');
    payload.append('emergencyContact1', editingUser.emergencyContact1 || '');
    payload.append('emergencyContact2', editingUser.emergencyContact2 || '');
    payload.append('emergencyEmail', editingUser.emergencyEmail || '');
    payload.append('shareMedicalInfo', String(Boolean(editingUser.shareMedicalInfo)));
    payload.append('shareLocation', String(Boolean(editingUser.shareLocation)));
    payload.append('isActive', String(Boolean(editingUser.isActive)));

    if (editingUser.password?.trim()) {
      payload.append('password', editingUser.password.trim());
    }

    if (editingUser.avatarFile) {
      payload.append('avatar', editingUser.avatarFile);
    }

    setSavingUser(true);
    try {
      const res = await updateManagedUser(editingUser._id, payload);
      if (res?.status === 200) {
        toast.success(res?.data?.message || 'User updated');
        setEditingUser(null);
        await Promise.all([reloadOverview(), loadUsers()]);
      } else {
        toast.error(res?.data?.message || 'Failed to update user');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setCreatingAdmin(true);
    try {
      const res = await createManagedAdmin(createAdminForm);
      if (res?.status === 201) {
        toast.success(res?.data?.message || 'Admin created successfully');
        setCreateAdminForm(defaultAdminForm);
        await Promise.all([reloadOverview(), loadAdmins({ page: 1 })]);
        setAdminPage(1);
      } else {
        toast.error(res?.data?.message || 'Failed to create admin');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleToggleAdminStatus = async (adminRow) => {
    if (adminRow.isCurrent && adminRow.isActive) {
      toast.warning('You cannot deactivate your own account');
      return;
    }

    setTogglingAdminId(adminRow._id);
    try {
      const res = await updateManagedAdminStatus(adminRow._id, !adminRow.isActive);
      if (res?.status === 200) {
        toast.success(res?.data?.message || 'Admin status updated');
        await Promise.all([reloadOverview(), loadAdmins()]);
      } else {
        toast.error(res?.data?.message || 'Failed to update admin status');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update admin status');
    } finally {
      setTogglingAdminId('');
    }
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin?._id) return;

    const payload = {
      officerName: editingAdmin.officerName,
      email: editingAdmin.email,
      policeStation: editingAdmin.policeStation,
    };

    if (editingAdmin.password?.trim()) {
      payload.password = editingAdmin.password.trim();
    }

    setSavingAdmin(true);
    try {
      const res = await updateManagedAdmin(editingAdmin._id, payload);
      if (res?.status === 200) {
        toast.success(res?.data?.message || 'Admin updated');
        setEditingAdmin(null);
        await Promise.all([reloadOverview(), loadAdmins()]);
      } else {
        toast.error(res?.data?.message || 'Failed to update admin');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update admin');
    } finally {
      setSavingAdmin(false);
    }
  };

  return (
    <section className="management-shell" aria-label="User and Admin Management">
      <div className="management-overview-grid">
        {overviewLoading ? (
          <div className="management-loading-card">
            <p>Loading overview...</p>
          </div>
        ) : (
          summaryCards.map((card) => {
            const Icon = card.Icon;
            return (
              <article key={card.title} className="management-stat-card">
                <div className="management-stat-top">
                  <p>{card.title}</p>
                  <span>
                    <Icon size={16} />
                  </span>
                </div>
                <h3>{card.value}</h3>
                <small>{card.detail}</small>
              </article>
            );
          })
        )}
      </div>

      <div className="management-main-card">
        <div className="management-head">
          <div>
            <p className="alert-list-eyebrow">Administration Control</p>
            <h2>User and Admin Management</h2>
          </div>

          <div className="management-actions">
            <div className="management-segmented">
              <button
                type="button"
                className={entityTab === 'users' ? 'active' : ''}
                onClick={() => setEntityTab('users')}
              >
                Users
              </button>
              <button
                type="button"
                className={entityTab === 'admins' ? 'active' : ''}
                onClick={() => setEntityTab('admins')}
              >
                Admins
              </button>
            </div>

            <button type="button" className="management-btn subtle" onClick={refreshCurrentTab}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {entityTab === 'users' ? (
          <div className="management-section">
            <div className="management-filter-row">
              <label className="management-search-wrap">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search user by name, email, phone"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                />
              </label>

              <select value={userStatus} onChange={(event) => setUserStatus(event.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button type="button" className="management-btn" onClick={applyUserSearch}>
                Apply
              </button>
            </div>

            {editingUser ? (
              <div className="management-edit-card">
                <div className="management-edit-head">
                  <h3>Edit User</h3>
                  <button type="button" onClick={() => setEditingUser(null)}>
                    <X size={14} />
                  </button>
                </div>

                <div className="management-form-sections">
                  <section className="management-form-section">
                    <div className="management-form-section-head">
                      <h4>Basic Details</h4>
                      <p>Identity and primary contact</p>
                    </div>
                    <div className="management-form-grid management-form-grid-2">
                      <div className="management-field">
                        <label>Full Name</label>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={editingUser.fullName || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, fullName: event.target.value }))
                          }
                        />
                      </div>
                      <div className="management-field">
                        <label>Username</label>
                        <input
                          type="text"
                          placeholder="Username"
                          value={editingUser.username || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, username: event.target.value }))
                          }
                        />
                      </div>
                      <div className="management-field">
                        <label>Email</label>
                        <input
                          type="email"
                          placeholder="Email"
                          value={editingUser.email || ''}
                          onChange={(event) => setEditingUser((prev) => ({ ...prev, email: event.target.value }))}
                        />
                      </div>
                      <div className="management-field">
                        <label>Contact</label>
                        <input
                          type="text"
                          placeholder="Contact"
                          value={editingUser.contact || ''}
                          onChange={(event) => setEditingUser((prev) => ({ ...prev, contact: event.target.value }))}
                        />
                      </div>
                      <div className="management-field">
                        <label>Age</label>
                        <input
                          type="number"
                          min={13}
                          max={120}
                          placeholder="Age"
                          value={editingUser.age ?? ''}
                          onChange={(event) => setEditingUser((prev) => ({ ...prev, age: event.target.value }))}
                        />
                      </div>
                      <div className="management-field">
                        <label>Blood Group</label>
                        <select
                          value={editingUser.bloodGroup || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, bloodGroup: event.target.value }))
                          }
                        >
                          {bloodGroupOptions.map((group) => (
                            <option key={group || 'none'} value={group}>
                              {group || 'Blood Group'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="management-field management-field-span-2">
                        <label>Reset Password</label>
                        <input
                          type="password"
                          placeholder="Reset Password (optional)"
                          value={editingUser.password || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, password: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <section className="management-form-section">
                    <div className="management-form-section-head">
                      <h4>Profile Picture</h4>
                      <p>Current avatar and new upload preview</p>
                    </div>
                    <div className="management-form-grid management-form-grid-1">
                      <div className="management-avatar-upload">
                        <label htmlFor="managed-user-avatar">Profile Picture</label>
                        <input
                          id="managed-user-avatar"
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setEditingUser((prev) => ({ ...prev, avatarFile: file }));
                          }}
                        />
                        <div className="management-avatar-preview-grid">
                          <div className="management-avatar-card">
                            <p>Current Picture</p>
                            {currentAvatarPreview ? (
                              <img src={currentAvatarPreview} alt="Current profile" />
                            ) : (
                              <div className="management-avatar-empty">No image</div>
                            )}
                          </div>

                          <div className="management-avatar-card">
                            <p>New Selection</p>
                            {selectedAvatarPreview ? (
                              <img src={selectedAvatarPreview} alt="New selected profile" />
                            ) : (
                              <div className="management-avatar-empty">No new image selected</div>
                            )}
                          </div>
                        </div>
                        {editingUser.avatarFile ? (
                          <small>Selected: {editingUser.avatarFile.name}</small>
                        ) : editingUser.avatar ? (
                          <small>Current: {editingUser.avatar}</small>
                        ) : (
                          <small>No profile picture uploaded</small>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="management-form-section">
                    <div className="management-form-section-head">
                      <h4>Emergency and Location</h4>
                      <p>Contacts and address details</p>
                    </div>
                    <div className="management-form-grid management-form-grid-2">
                      <div className="management-field management-field-span-2">
                        <label>Emergency Email</label>
                        <input
                          type="email"
                          placeholder="Emergency Email"
                          value={editingUser.emergencyEmail || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, emergencyEmail: event.target.value }))
                          }
                        />
                      </div>
                      <div className="management-field">
                        <label>Emergency Contact 1</label>
                        <input
                          type="text"
                          placeholder="Emergency Contact 1"
                          value={editingUser.emergencyContact1 || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, emergencyContact1: event.target.value }))
                          }
                        />
                      </div>
                      <div className="management-field">
                        <label>Emergency Contact 2</label>
                        <input
                          type="text"
                          placeholder="Emergency Contact 2"
                          value={editingUser.emergencyContact2 || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, emergencyContact2: event.target.value }))
                          }
                        />
                      </div>
                      <div className="management-field">
                        <label>City</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={editingUser.city || ''}
                          onChange={(event) => setEditingUser((prev) => ({ ...prev, city: event.target.value }))}
                        />
                      </div>
                      <div className="management-field">
                        <label>State</label>
                        <input
                          type="text"
                          placeholder="State"
                          value={editingUser.state || ''}
                          onChange={(event) => setEditingUser((prev) => ({ ...prev, state: event.target.value }))}
                        />
                      </div>
                      <div className="management-field">
                        <label>Pincode</label>
                        <input
                          type="text"
                          placeholder="Pincode"
                          value={editingUser.pincode || ''}
                          onChange={(event) => setEditingUser((prev) => ({ ...prev, pincode: event.target.value }))}
                        />
                      </div>
                      <div className="management-field management-field-span-2">
                        <label>Address</label>
                        <input
                          type="text"
                          placeholder="Address"
                          value={editingUser.address || ''}
                          onChange={(event) => setEditingUser((prev) => ({ ...prev, address: event.target.value }))}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="management-form-section">
                    <div className="management-form-section-head">
                      <h4>Medical Details</h4>
                      <p>Health information used during SOS events</p>
                    </div>
                    <div className="management-form-grid management-form-grid-2">
                      <div className="management-field management-field-span-2">
                        <label>Medical Conditions</label>
                        <input
                          type="text"
                          placeholder="Medical Conditions (comma separated)"
                          value={editingUser.medicalConditionsText || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, medicalConditionsText: event.target.value }))
                          }
                        />
                      </div>
                      <div className="management-field">
                        <label>Medical Info</label>
                        <textarea
                          rows={3}
                          placeholder="Medical Info"
                          value={editingUser.medicalInfo || ''}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, medicalInfo: event.target.value }))
                          }
                        />
                      </div>
                      <div className="management-field">
                        <label>Allergies</label>
                        <textarea
                          rows={3}
                          placeholder="Allergies"
                          value={editingUser.allergies || ''}
                          onChange={(event) => setEditingUser((prev) => ({ ...prev, allergies: event.target.value }))}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="management-form-section">
                    <div className="management-form-section-head">
                      <h4>Privacy and Account</h4>
                      <p>Sharing permissions and account state</p>
                    </div>
                    <div className="management-form-grid management-form-grid-3">
                      <div className="management-field">
                        <label>Share Medical Info</label>
                        <select
                          value={String(editingUser.shareMedicalInfo ?? true)}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, shareMedicalInfo: event.target.value === 'true' }))
                          }
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div className="management-field">
                        <label>Share Location</label>
                        <select
                          value={String(editingUser.shareLocation ?? true)}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, shareLocation: event.target.value === 'true' }))
                          }
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                      <div className="management-field">
                        <label>Account Status</label>
                        <select
                          value={String(editingUser.isActive ?? true)}
                          onChange={(event) =>
                            setEditingUser((prev) => ({ ...prev, isActive: event.target.value === 'true' }))
                          }
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="management-form-actions">
                  <button type="button" className="management-btn subtle" onClick={() => setEditingUser(null)}>
                    Cancel
                  </button>
                  <button type="button" className="management-btn" onClick={handleSaveUser} disabled={savingUser}>
                    <Save size={14} /> {savingUser ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="management-table-wrap">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6}>Loading users...</td>
                    </tr>
                  ) : users.length ? (
                    users.map((userRow) => (
                      <tr key={userRow._id}>
                        <td>
                          <strong>{userRow.fullName}</strong>
                          <span>@{userRow.username}</span>
                          <small>{userRow.email}</small>
                        </td>
                        <td>{userRow.contact || '-'}</td>
                        <td>{[userRow.city, userRow.state].filter(Boolean).join(', ') || '-'}</td>
                        <td>{formatDate(userRow.createdAt)}</td>
                        <td>
                          <span className={`management-status-chip ${userRow.isActive ? 'active' : 'inactive'}`}>
                            {userRow.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="management-row-actions">
                            <button
                              type="button"
                              className="management-btn tiny subtle"
                              onClick={() =>
                                setEditingUser({
                                  ...userRow,
                                  avatar: userRow.avatar || '',
                                  medicalInfo: userRow.medicalInfo || '',
                                  medicalConditionsText: getMedicalConditionsText(userRow.medicalConditions),
                                  allergies: userRow.allergies || '',
                                  emergencyEmail: userRow.emergencyEmail || '',
                                  address: userRow.address || '',
                                  pincode: userRow.pincode || '',
                                  shareMedicalInfo: userRow.shareMedicalInfo ?? true,
                                  shareLocation: userRow.shareLocation ?? true,
                                  isActive: userRow.isActive ?? true,
                                  avatarFile: null,
                                  password: '',
                                })
                              }
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className={`management-btn tiny ${userRow.isActive ? 'danger' : ''}`}
                              onClick={() => handleToggleUserStatus(userRow)}
                              disabled={togglingUserId === userRow._id}
                            >
                              {userRow.isActive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                              {togglingUserId === userRow._id
                                ? 'Updating...'
                                : userRow.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>No users found for selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="management-pagination">
              <p>
                Showing page {usersMeta.page} of {usersMeta.pages} ({usersMeta.total} users)
              </p>
              <div>
                <button
                  type="button"
                  className="management-btn tiny subtle"
                  onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
                  disabled={usersMeta.page <= 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="management-btn tiny subtle"
                  onClick={() => setUserPage((prev) => Math.min(usersMeta.pages || 1, prev + 1))}
                  disabled={usersMeta.page >= usersMeta.pages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="management-section">
            <form className="management-create-card" onSubmit={handleCreateAdmin}>
              <div className="management-edit-head">
                <h3>
                  <UserPlus size={15} /> Create New Admin
                </h3>
              </div>

              <div className="management-form-grid">
                <div className="management-field">
                  <label>Officer Name</label>
                  <input
                    type="text"
                    placeholder="Officer Name"
                    value={createAdminForm.officerName}
                    onChange={(event) =>
                      setCreateAdminForm((prev) => ({ ...prev, officerName: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="management-field">
                  <label>Official Email</label>
                  <input
                    type="email"
                    placeholder="Official Email"
                    value={createAdminForm.email}
                    onChange={(event) => setCreateAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                  />
                </div>
                <div className="management-field">
                  <label>Police Station</label>
                  <input
                    type="text"
                    placeholder="Police Station"
                    value={createAdminForm.policeStation}
                    onChange={(event) =>
                      setCreateAdminForm((prev) => ({ ...prev, policeStation: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="management-field">
                  <label>Temporary Password</label>
                  <input
                    type="password"
                    placeholder="Temporary Password"
                    value={createAdminForm.password}
                    onChange={(event) => setCreateAdminForm((prev) => ({ ...prev, password: event.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="management-form-actions">
                <button type="submit" className="management-btn" disabled={creatingAdmin}>
                  <Save size={14} /> {creatingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>

            <div className="management-filter-row">
              <label className="management-search-wrap">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search admin by name, email, station"
                  value={adminSearch}
                  onChange={(event) => setAdminSearch(event.target.value)}
                />
              </label>

              <select value={adminStatus} onChange={(event) => setAdminStatus(event.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button type="button" className="management-btn" onClick={applyAdminSearch}>
                Apply
              </button>
            </div>

            {editingAdmin ? (
              <div className="management-edit-card">
                <div className="management-edit-head">
                  <h3>Edit Admin</h3>
                  <button type="button" onClick={() => setEditingAdmin(null)}>
                    <X size={14} />
                  </button>
                </div>

                <div className="management-form-grid">
                  <div className="management-field">
                    <label>Officer Name</label>
                    <input
                      type="text"
                      placeholder="Officer Name"
                      value={editingAdmin.officerName || ''}
                      onChange={(event) =>
                        setEditingAdmin((prev) => ({ ...prev, officerName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="management-field">
                    <label>Official Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={editingAdmin.email || ''}
                      onChange={(event) => setEditingAdmin((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                  <div className="management-field">
                    <label>Police Station</label>
                    <input
                      type="text"
                      placeholder="Police Station"
                      value={editingAdmin.policeStation || ''}
                      onChange={(event) =>
                        setEditingAdmin((prev) => ({ ...prev, policeStation: event.target.value }))
                      }
                    />
                  </div>
                  <div className="management-field">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="New Password (optional)"
                      value={editingAdmin.password || ''}
                      onChange={(event) => setEditingAdmin((prev) => ({ ...prev, password: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="management-form-actions">
                  <button type="button" className="management-btn subtle" onClick={() => setEditingAdmin(null)}>
                    Cancel
                  </button>
                  <button type="button" className="management-btn" onClick={handleSaveAdmin} disabled={savingAdmin}>
                    <Save size={14} /> {savingAdmin ? 'Saving...' : 'Save Admin'}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="management-table-wrap">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Station</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminsLoading ? (
                    <tr>
                      <td colSpan={5}>Loading admins...</td>
                    </tr>
                  ) : admins.length ? (
                    admins.map((adminRow) => (
                      <tr key={adminRow._id}>
                        <td>
                          <strong>{adminRow.officerName}</strong>
                          <small>{adminRow.email}</small>
                          {adminRow.isCurrent ? <span className="management-inline-tag">Current Account</span> : null}
                        </td>
                        <td>{adminRow.policeStation}</td>
                        <td>{formatDate(adminRow.createdAt)}</td>
                        <td>
                          <span className={`management-status-chip ${adminRow.isActive ? 'active' : 'inactive'}`}>
                            {adminRow.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="management-row-actions">
                            <button
                              type="button"
                              className="management-btn tiny subtle"
                              onClick={() => setEditingAdmin({ ...adminRow, password: '' })}
                            >
                              <Pencil size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className={`management-btn tiny ${adminRow.isActive ? 'danger' : ''}`}
                              onClick={() => handleToggleAdminStatus(adminRow)}
                              disabled={togglingAdminId === adminRow._id || (adminRow.isCurrent && adminRow.isActive)}
                            >
                              {adminRow.isActive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                              {togglingAdminId === adminRow._id
                                ? 'Updating...'
                                : adminRow.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>No admins found for selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="management-pagination">
              <p>
                Showing page {adminsMeta.page} of {adminsMeta.pages} ({adminsMeta.total} admins)
              </p>
              <div>
                <button
                  type="button"
                  className="management-btn tiny subtle"
                  onClick={() => setAdminPage((prev) => Math.max(1, prev - 1))}
                  disabled={adminsMeta.page <= 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="management-btn tiny subtle"
                  onClick={() => setAdminPage((prev) => Math.min(adminsMeta.pages || 1, prev + 1))}
                  disabled={adminsMeta.page >= adminsMeta.pages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminManagement;
