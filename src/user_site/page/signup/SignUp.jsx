import React, { useState } from 'react';
import './signUp.css';
import { Link, useNavigate } from 'react-router-dom';
import { userSignUp } from '../../../services/Apis';
import { toast } from 'react-toastify';

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    avatar: null,
    contact: '',
    age: '',
    password: '',
    confirmPassword: ''
  });

  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file && file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        avatar: 'File size should be less than 2MB'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      avatar: file
    }));

    setErrors(prev => ({
      ...prev,
      avatar: null
    }));

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3 || formData.username.length > 30) {
      newErrors.username = 'Username must be 3-30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      newErrors.fullName = 'Full name must be 2-100 characters';
    }

    // Contact validation (10-15 digits)
    if (!formData.contact.trim()) {
      newErrors.contact = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.contact.replace(/\s/g, ''))) {
      newErrors.contact = 'Invalid phone number (10-15 digits)';
    }

    // Age validation
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        newErrors.age = 'Age must be between 13 and 120';
      }
    }

    // Password validation - must match backend requirements
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Avatar validation
    if (!formData.avatar) {
      newErrors.avatar = 'Profile photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('email', formData.email);
      data.append('fullName', formData.fullName);
      data.append('avatar', formData.avatar);
      data.append('contact', formData.contact);
      data.append('age', formData.age);
      data.append('password', formData.password);

      // DO NOT manually set multipart headers - browser sets correct boundary
      const config = { withCredentials: true };
      const res = await userSignUp(data, config);

      if (res?.status === 201) {
        toast.success(res?.data?.message || 'User registered successfully');

        setFormData({
          username: '',
          email: '',
          fullName: '',
          avatar: null,
          contact: '',
          age: '',
          password: '',
          confirmPassword: ''
        });
        setPreview(null);

        setTimeout(() => navigate('/login'), 1200);
      } else {
        toast.error(
          res?.data?.message ||
          'Registration failed. Please try again.'
        );
      }

    } catch (error) {
      console.error(error);

      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong';

      toast.error(msg);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-content">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
              required
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">E-Mail Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? 'error' : ''}
              required
            />
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          {/* Avatar */}
          <div className="form-group">
            <label htmlFor="avatar">Profile Photo</label>
            <div className="file-input-container">
              <label htmlFor="avatar" className="file-label">Choose File</label>
              <span className="file-name">
                {formData.avatar ? formData.avatar.name : 'No file chosen'}
              </span>
              <input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
            {errors.avatar && <span className="error-message">{errors.avatar}</span>}
            {preview && (
              <div className="avatar-preview">
                <img src={preview} alt="Avatar preview" />
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="form-group">
            <label htmlFor="contact">Your Phone Number</label>
            <input
              type="tel"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className={errors.contact ? 'error' : ''}
              required
            />
            {errors.contact && <span className="error-message">{errors.contact}</span>}
          </div>

          {/* Age */}
          <div className="form-group">
            <label htmlFor="age">Enter Your Age</label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className={errors.age ? 'error' : ''}
              min="13"
              max="120"
              required
            />
            {errors.age && <span className="error-message">{errors.age}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Create Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              required
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="signup-button">Sign Up</button>

          <div className="login-link">
            Have an account? <Link to="/login">Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
