import React, { useState } from 'react';
import './login.css';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Landmark, Mail, ShieldCheck } from 'lucide-react';
import { adminLogin } from '../../../services/Apis';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';

const PoliceLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const config = {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      };
      const res = await adminLogin(formData, config);

      if (res?.status === 200 && res?.data?.data) {
        const { admin, accessToken } = res.data.data;
        login(admin, accessToken, 'admin');

        toast.success(res.data.message || 'Login successful.');
        navigate('/admin/home');
      } else {
        toast.error(res?.data?.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ws-admin-auth-page">
      <div className="ws-admin-auth-glow ws-admin-auth-glow-top" aria-hidden="true"></div>
      <div className="ws-admin-auth-glow ws-admin-auth-glow-bottom" aria-hidden="true"></div>

      <div className="ws-admin-auth-shell">
        <aside className="ws-admin-auth-hero">
          <p className="ws-admin-auth-eyebrow">Responder Console</p>
          <h1>Admin access for high-priority emergency coordination.</h1>
          <p>
            Monitor live SOS events, coordinate field response, and route support teams with minimal delay.
          </p>

          <ul className="ws-admin-auth-list">
            <li>
              <ShieldCheck size={16} /> Verified responder access only
            </li>
            <li>
              <Landmark size={16} /> Station-linked incident management
            </li>
            <li>
              <Mail size={16} /> Secure session with audit-ready actions
            </li>
          </ul>
        </aside>

        <section className="ws-admin-auth-card" aria-label="Admin Login Form">
          <div className="ws-admin-auth-head">
            <h2>Police Officer Login</h2>
            <p>Enter your authorized credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="ws-admin-auth-form">
            <label htmlFor="email">Email Address</label>
            <div className={`ws-admin-input-wrap ${errors.email ? 'has-error' : ''}`.trim()}>
              <Mail size={16} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="officer@department.gov"
                autoComplete="email"
              />
            </div>
            {errors.email ? <p className="ws-admin-form-error">{errors.email}</p> : null}

            <label htmlFor="password">Password</label>
            <div className={`ws-admin-input-wrap ${errors.password ? 'has-error' : ''}`.trim()}>
              <ShieldCheck size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="ws-admin-toggle-pass"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password ? <p className="ws-admin-form-error">{errors.password}</p> : null}

            <div className="ws-admin-auth-meta">
              <span>Authorized users only</span>
              <a href="mailto:support@safestree.app">Need access help?</a>
            </div>

            <button type="submit" className="ws-admin-login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Enter Admin Panel'} <ArrowRight size={16} />
            </button>

            <p className="ws-admin-signup-link">
              New responder? <Link to="/admin/signup">Register here</Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default PoliceLogin;
