import React, { useState } from 'react';
import './SignUp.css';
import { Link,useNavigate } from 'react-router-dom';
import { adminSignUp } from '../../../services/Apis';
import { toast } from 'react-toastify';

const SignUp = () => {
  const navigate=useNavigate();
  // List of major police stations in West Bengal
  const westBengalPoliceStations = [
    "Kolkata Police Headquarters",
    "Lalbazar Police Station",
    "Hastings Police Station",
    "Taltala Police Station",
    "Jorasanko Police Station",
    "Burrabazar Police Station",
    "Posta Police Station",
    "Jorabagan Police Station",
    "Shyampukur Police Station",
    "Bartala Police Station",
    "Amherst Street Police Station",
    "Hare Street Police Station",
    "Bowbazar Police Station",
    "Muchipara Police Station",
    "Tollygunge Police Station",
    "Bhowanipore Police Station",
    "Alipore Police Station",
    "Park Street Police Station",
    "South Suburban Police Station",
    "Karaya Police Station",
    "Entally Police Station",
    "Beniapukur Police Station",
    "Narkeldanga Police Station",
    "Ultadanga Police Station",
    "Belgachia Police Station",
    "Shyambazar Police Station",
    "Cossipore Police Station",
    "Chitpur Police Station",
    "Sinthi Police Station",
    "Burtolla Police Station",
    "Joramandir Police Station",
    "Baranagar Police Station",
    "Dum Dum Police Station",
    "Bidhannagar Police Station",
    "Rajabagan Police Station",
    "Howrah Police Station",
    "Siliguri Police Station",
    "Darjeeling Police Station",
    "Asansol Police Station",
    "Durgapur Police Station",
    "Bardhaman Police Station",
    "Malda Police Station",
    "Krishnanagar Police Station",
    "Barasat Police Station",
    "Barrackpore Police Station",
    "Kalyani Police Station",
    "Haldia Police Station",
    "Medinipur Police Station",
    "Purulia Police Station",
    "Bankura Police Station"
  ];

  const [formData, setFormData] = useState({
    officerName: '',
    email: '',
    policeStation: '',
    password: '',
    confirmPassword: '',
    officersInStation: []
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handlePoliceStationChange = (e) => {
    const selectedStation = e.target.value;
    setFormData({
      ...formData,
      policeStation: selectedStation,
      // Mock data - in real app you would fetch this from your backend
      officersInStation: getMockOfficersForStation(selectedStation)
    });
  };

  // Mock function to generate officers for selected station
  const getMockOfficersForStation = (station) => {
    const prefixes = ["Inspector", "Sub-Inspector", "Constable"];
    const names = ["Amit Kumar", "Rajesh Sharma", "Priya Singh", "Sourav Das", "Ananya Chatterjee"];

    return Array(3).fill().map((_, i) => ({
      id: i,
      name: `${prefixes[i % prefixes.length]} ${names[i % names.length]}`,
      badgeNumber: `WB${Math.floor(1000 + Math.random() * 9000)}`
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.officerName.trim()) {
      newErrors.officerName = 'Officer name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.policeStation) {
      newErrors.policeStation = 'Police station is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number & special character';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const config = {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      };
      const res = await adminSignUp(formData, config);
      
      if (res?.status === 201) {
        toast.success(res.data?.message || "Signup successful! Redirecting to login...");
        navigate('/admin/login');
      } else {
        toast.error(res?.data?.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Admin signup error:", error);
      toast.error(error.response?.data?.message || "Signup failed. Please try again.");
    }
    
    // Reset form after submission
    setFormData({
      officerName: '',
      email: '',
      policeStation: '',
      password: '',
      confirmPassword: '',
      officersInStation: []
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <h2>Officer Sign Up</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="officerName">Officer Name</label>
            <input
              type="text"
              id="officerName"
              name="officerName"
              value={formData.officerName}
              onChange={handleChange}
              className={errors.officerName ? 'error' : ''}
            />
            {errors.officerName && <span className="error-message">{errors.officerName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="policeStation">Police Station</label>
            <select
              id="policeStation"
              name="policeStation"
              value={formData.policeStation}
              onChange={handlePoliceStationChange}
              className={errors.policeStation ? 'error' : ''}
            >
              <option value="">Select Police Station</option>
              {westBengalPoliceStations.map((station, index) => (
                <option key={index} value={station}>{station}</option>
              ))}
            </select>
            {errors.policeStation && <span className="error-message">{errors.policeStation}</span>}
          </div>

          {formData.policeStation && (
            <div className="form-group">
              <label>Officers in {formData.policeStation}</label>
              <div className="officers-list">
                {formData.officersInStation.length > 0 ? (
                  formData.officersInStation.map(officer => (
                    <div key={officer.id} className="officer-item">
                      <span>{officer.name}</span>
                      <span className="badge-number">{officer.badgeNumber}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-officers">No officers data available</p>
                )}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="login-button">
            Register
          </button>
          <div className="login-link">
            Have an account? <Link to="/admin/login">Login here</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;