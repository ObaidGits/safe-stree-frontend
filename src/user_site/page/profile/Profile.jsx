import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CircleUserRound,
  ClipboardCheck,
  Droplets,
  Mail,
  MapPinned,
  Pencil,
  Phone,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import { toast } from 'react-toastify';
import './Profile.css';
import { useAuth } from '../../../context/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isUser, isLoading } = useAuth();
  const [settings, setSettings] = useState({
    shareMedicalInfo: true,
    shareLocation: true,
  });

  useEffect(() => {
    if (!isLoading && (!isUser || !user)) {
      toast.error('Please login to view profile');
      navigate('/login');
    }
  }, [isLoading, isUser, user, navigate]);

  useEffect(() => {
    if (user) {
      setSettings({
        shareMedicalInfo: user.shareMedicalInfo ?? true,
        shareLocation: user.shareLocation ?? true,
      });
    }
  }, [user]);

  const userName = user?.fullName || user?.name || 'Safety User';
  const userInitial = userName.charAt(0).toUpperCase();
  const avatarUrl = user?.avatar ? `${import.meta.env.VITE_WS_URL}${user.avatar}?t=${Date.now()}` : null;

  const addressLine = useMemo(() => {
    const parts = [user?.address, user?.city, user?.state, user?.pincode].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Not provided';
  }, [user?.address, user?.city, user?.state, user?.pincode]);

  const personalFields = [
    { icon: UserRound, label: 'Username', value: user?.username ? `@${user.username}` : 'not_set', accent: true },
    { icon: CircleUserRound, label: 'Full Name', value: userName },
    { icon: Mail, label: 'Email', value: user?.email || 'Not provided' },
    { icon: Phone, label: 'Phone', value: user?.contact || 'Not provided' },
    { icon: UserRound, label: 'Age', value: user?.age || 'Not provided' },
    {
      icon: Droplets,
      label: 'Blood Group',
      value: user?.bloodGroup || 'Not set',
      badge: true,
    },
  ];

  const emergencyContacts = [
    { label: 'Contact 1', value: user?.emergencyContact1 },
    { label: 'Contact 2', value: user?.emergencyContact2 },
  ];

  const filledProfileFields = [
    user?.username,
    user?.fullName || user?.name,
    user?.email,
    user?.contact,
    user?.age,
    user?.bloodGroup,
    user?.address,
    user?.city,
    user?.state,
    user?.pincode,
    user?.emergencyContact1 || user?.emergencyContact2,
  ].filter(Boolean).length;

  const completionScore = Math.round((filledProfileFields / 11) * 100);
  const emergencyContactCount = [user?.emergencyContact1, user?.emergencyContact2].filter(Boolean).length;
  const hasMedicalContext =
    (Array.isArray(user?.medicalConditions) && user.medicalConditions.length > 0) ||
    Boolean(user?.medicalInfo) ||
    Boolean(user?.allergies);

  return (
    <main className="ws-profile-page">
      <div className="ws-profile-bg ws-profile-bg-top" aria-hidden="true"></div>
      <div className="ws-profile-bg ws-profile-bg-bottom" aria-hidden="true"></div>

      <header className="ws-profile-shell ws-profile-topbar">
        <Link to="/" className="ws-profile-brand">
          <span className="ws-profile-brand-dot" aria-hidden="true"></span>
          SafeStree
        </Link>

        <nav className="ws-profile-top-links" aria-label="Profile Navigation">
          <Link to="/" className="ws-profile-top-link">
            <ArrowLeft size={15} /> Home
          </Link>
          <Link to="/safe-route" className="ws-profile-top-link">
            <MapPinned size={15} /> Safe Route
          </Link>
        </nav>
      </header>

      <section className="ws-profile-shell ws-profile-hero">
        <div className="ws-profile-hero-card">
          <div className="ws-profile-avatar-wrap">
            <div className="ws-profile-avatar">
              {avatarUrl ? <img src={avatarUrl} alt="Profile" /> : <span>{userInitial}</span>}
            </div>

            <div>
              <p className="ws-profile-eyebrow">SafeStree Profile</p>
              <h1>{userName}</h1>
              <p className="ws-profile-subtitle">
                Keep this profile accurate for faster emergency response and better incident handling.
              </p>
              <div className="ws-profile-meta-chips">
                <span>{user?.username ? `@${user.username}` : '@not_set'}</span>
                <span>{user?.city || 'City not set'}</span>
                <span>{user?.bloodGroup || 'Blood group not set'}</span>
              </div>
            </div>
          </div>

          <div className="ws-profile-hero-actions">
            <div className="ws-profile-readiness-chip">
              <span>Readiness Score</span>
              <strong>{completionScore}%</strong>
            </div>
            <button type="button" onClick={() => navigate('/edit-profile')} className="ws-profile-primary-btn">
              <Pencil size={15} /> Edit Profile
            </button>
            <Link to="/safe-route" className="ws-profile-secondary-btn">
              <MapPinned size={15} /> Plan Safe Route
            </Link>
          </div>
        </div>
      </section>

      <section className="ws-profile-shell ws-profile-readiness-grid">
        <article className="ws-profile-status-card">
          <p>Profile Completion</p>
          <h3>{completionScore}%</h3>
          <span>{completionScore >= 80 ? 'Strong readiness level' : 'Update missing fields for faster support'}</span>
        </article>
        <article className="ws-profile-status-card">
          <p>Emergency Contacts</p>
          <h3>{emergencyContactCount}/2</h3>
          <span>
            {emergencyContactCount > 0 ? 'At least one contact is reachable' : 'Add a trusted emergency contact'}
          </span>
        </article>
        <article className="ws-profile-status-card">
          <p>Medical Context</p>
          <h3>{hasMedicalContext ? 'Available' : 'Not Added'}</h3>
          <span>{hasMedicalContext ? 'Response teams get better context' : 'Add medical notes for emergencies'}</span>
        </article>
      </section>

      <section className="ws-profile-shell ws-profile-grid">
        <article className="ws-profile-card ws-span-2">
          <div className="ws-profile-card-head">
            <h2>Personal Information</h2>
            <p>Core details used across emergency workflows.</p>
          </div>

          <div className="ws-profile-info-grid">
            {personalFields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="ws-profile-info-item">
                  <span className="ws-profile-info-label">
                    <Icon size={14} /> {field.label}
                  </span>
                  <span
                    className={`ws-profile-info-value ${field.accent ? 'is-accent' : ''} ${field.badge ? 'is-badge' : ''}`.trim()}
                  >
                    {field.value}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="ws-profile-card">
          <div className="ws-profile-card-head">
            <h2>Emergency Settings</h2>
            <p>Current sharing controls for SOS flow.</p>
          </div>

          <div className="ws-profile-toggle-list">
            <div className="ws-profile-toggle-item">
              <span>Share medical information</span>
              <span className={`ws-toggle-chip ${settings.shareMedicalInfo ? 'active' : ''}`}>
                {settings.shareMedicalInfo ? (
                  <>
                    <CheckCircle2 size={13} /> Enabled
                  </>
                ) : (
                  'Disabled'
                )}
              </span>
            </div>
            <div className="ws-profile-toggle-item">
              <span>Enable live location sharing</span>
              <span className={`ws-toggle-chip ${settings.shareLocation ? 'active' : ''}`}>
                {settings.shareLocation ? (
                  <>
                    <CheckCircle2 size={13} /> Enabled
                  </>
                ) : (
                  'Disabled'
                )}
              </span>
            </div>
          </div>

          <p className="ws-profile-note">
            These are read-only here. Update from <strong>Edit Profile</strong>.
          </p>
        </article>

        <article className="ws-profile-card ws-span-2">
          <div className="ws-profile-card-head">
            <h2>Address</h2>
            <p>Location context that helps responders navigate faster.</p>
          </div>

          <div className="ws-profile-info-grid two-col">
            <div className="ws-profile-info-item ws-full-width">
              <span className="ws-profile-info-label">
                <MapPinned size={14} /> Complete Address
              </span>
              <span className="ws-profile-info-value">{addressLine}</span>
            </div>
            <div className="ws-profile-info-item">
              <span className="ws-profile-info-label">City</span>
              <span className="ws-profile-info-value">{user?.city || 'Not provided'}</span>
            </div>
            <div className="ws-profile-info-item">
              <span className="ws-profile-info-label">State</span>
              <span className="ws-profile-info-value">{user?.state || 'Not provided'}</span>
            </div>
            <div className="ws-profile-info-item">
              <span className="ws-profile-info-label">Pincode</span>
              <span className="ws-profile-info-value">{user?.pincode || 'Not provided'}</span>
            </div>
          </div>
        </article>

        <article className="ws-profile-card">
          <div className="ws-profile-card-head">
            <h2>Medical Information</h2>
            <p>Critical health notes for emergency teams.</p>
          </div>

          <div className="ws-profile-tag-row">
            {user?.medicalConditions?.length > 0 ? (
              user.medicalConditions.map((condition) => (
                <span key={condition} className="ws-profile-tag warning">
                  {condition}
                </span>
              ))
            ) : (
              <span className="ws-profile-tag safe">No conditions listed</span>
            )}
            <span className={`ws-profile-tag ${user?.allergies ? 'warning' : 'safe'}`}>
              {user?.allergies || 'No known allergies'}
            </span>
          </div>

          {user?.medicalInfo ? (
            <p className="ws-profile-note-box">
              <strong>Additional Notes:</strong> {user.medicalInfo}
            </p>
          ) : null}
        </article>

        <article className="ws-profile-card">
          <div className="ws-profile-card-head">
            <h2>Emergency Contacts</h2>
            <p>Quick dial numbers for immediate escalation.</p>
          </div>

          <div className="ws-profile-contact-list">
            {emergencyContacts.map((contact) => (
              <div key={contact.label} className="ws-profile-contact-item">
                <span>{contact.label}</span>
                {contact.value ? (
                  <a href={`tel:${contact.value}`}>{contact.value}</a>
                ) : (
                  <em>Not set</em>
                )}
              </div>
            ))}
          </div>

          <div className="ws-profile-tip">
            <ShieldAlert size={15} /> Keep at least one contact always reachable during travel.
          </div>
        </article>

        <article className="ws-profile-card ws-span-3">
          <div className="ws-profile-card-head">
            <h2>Safety Checklist</h2>
            <p>Use this quick review before commute, late travel, or isolated routes.</p>
          </div>
          <ul className="ws-profile-checklist">
            <li>
              <ClipboardCheck size={15} /> Location permission is enabled before starting travel.
            </li>
            <li>
              <ClipboardCheck size={15} /> Phone battery and mobile data are sufficient.
            </li>
            <li>
              <ClipboardCheck size={15} /> Emergency contacts are informed during high-risk timing.
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
};

export default Profile;
