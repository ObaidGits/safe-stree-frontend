import React, { useState } from 'react';
import './login.css';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPinned,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { userLogin } from '../../../services/Apis';
import { useAuth } from '../../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    if (errors.credential && (name === 'username' || name === 'email')) {
      setErrors((prev) => ({
        ...prev,
        credential: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim() && !formData.email.trim()) {
      newErrors.credential = 'Enter either username or email to continue.';
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

      const loginData = { password: formData.password };
      if (formData.username.trim()) {
        loginData.username = formData.username.trim();
      }
      if (formData.email.trim()) {
        loginData.email = formData.email.trim();
      }

      const res = await userLogin(loginData, config);

      if (res?.status === 200 && res?.data?.data) {
        const { user, accessToken } = res.data.data;
        login(user, accessToken, 'user');
        toast.success(res.data.message || 'Login successful.');
        setFormData({
          username: '',
          email: '',
          password: '',
        });
        navigate('/');
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
    <main className="ws-login-page">
      <div className="ws-login-glow ws-login-glow-top" aria-hidden="true"></div>
      <div className="ws-login-glow ws-login-glow-bottom" aria-hidden="true"></div>

      <header className="ws-login-topbar ws-login-shell-width">
        <Link to="/" className="ws-login-brand">
          <span className="ws-login-brand-dot" aria-hidden="true"></span>
          SafeStree
        </Link>

        <nav className="ws-login-top-actions" aria-label="Login Navigation">
          <Link to="/" className="ws-login-top-link">
            <ArrowLeft size={15} /> Back to Home
          </Link>
          <Link to="/admin/login" className="ws-login-top-link muted">
            Responder Login
          </Link>
        </nav>
      </header>

      <section className="ws-login-shell ws-login-shell-width">
        <aside className="ws-login-story">
          <p className="ws-login-eyebrow">Personal Safety Access</p>
          <h1>Stay one step ahead before a risky moment escalates.</h1>
          <p>
            Your emergency profile, trusted contacts, and SOS controls stay synced the moment you sign in.
          </p>

          <div className="ws-login-stat-grid">
            <article>
              <strong>Live</strong>
              <span>Incident visibility</span>
            </article>
            <article>
              <strong>1-Tap</strong>
              <span>SOS activation</span>
            </article>
            <article>
              <strong>Ready</strong>
              <span>Emergency contacts</span>
            </article>
          </div>

          <ul className="ws-login-highlights">
            <li>
              <ShieldAlert size={16} /> Rapid SOS readiness in high-risk situations
            </li>
            <li>
              <MapPinned size={16} /> Better location context for faster support
            </li>
            <li>
              <BellRing size={16} /> Alert-linked response workflow across devices
            </li>
          </ul>
        </aside>

        <section className="ws-login-card" aria-label="User Login Form">
          <div className="ws-login-card-head">
            <h2>Welcome Back</h2>
            <p>Log in to continue with your SafeStree account.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="ws-login-form">
            {errors.credential ? <p className="ws-login-error">{errors.credential}</p> : null}

            <label className="ws-login-label" htmlFor="username">
              Username
            </label>
            <div className={`ws-login-input-wrap ${errors.credential ? 'has-error' : ''}`.trim()}>
              <UserRound size={16} />
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.credential ? 'input-error' : ''}
                placeholder="e.g. ananya_24"
                autoComplete="username"
              />
            </div>

            <div className="ws-login-divider">
              <span>or use email</span>
            </div>

            <label className="ws-login-label" htmlFor="email">
              Email
            </label>
            <div className={`ws-login-input-wrap ${errors.credential ? 'has-error' : ''}`.trim()}>
              <Mail size={16} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.credential ? 'input-error' : ''}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <label className="ws-login-label" htmlFor="password">
              Password
            </label>
            <div className={`ws-login-input-wrap ${errors.password ? 'has-error' : ''}`.trim()}>
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'input-error' : ''}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="ws-login-toggle-pass"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password ? <p className="ws-login-error inline">{errors.password}</p> : null}

            <button type="submit" className="ws-login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In Securely'} <ArrowRight size={16} />
            </button>

            <p className="ws-login-support">
              Need access help? <a href="mailto:support@safestree.app">Contact support</a>
            </p>

            <p className="ws-login-switch">
              New to SafeStree? <Link to="/signup">Create account</Link>
            </p>
          </form>
        </section>
      </section>
    </main>
  );
};

export default Login;
