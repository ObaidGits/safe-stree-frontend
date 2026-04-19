import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import { updateUserProfile } from '../../../services/Apis';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: authUser, isUser, isLoading: authLoading, checkAuth } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    contact: '',
    age: '',
    bloodGroup: '',
    medicalInfo: '',
    medicalConditions: [],
    allergies: '',
    emergencyContact1: '',
    emergencyContact2: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    shareMedicalInfo: true,
    shareLocation: true,
    avatar: null,
    previewAvatar: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isUser || !authUser) {
        toast.error("Please login to edit profile");
        navigate('/login');
        return;
      }
      // Initialize form with auth user data
      setFormData({
        fullName: authUser.fullName || '',
        username: authUser.username || '',
        email: authUser.email || '',
        contact: authUser.contact || '',
        age: authUser.age || '',
        bloodGroup: authUser.bloodGroup || '',
        medicalInfo: authUser.medicalInfo || '',
        medicalConditions: authUser.medicalConditions || [],
        allergies: authUser.allergies || '',
        emergencyContact1: authUser.emergencyContact1 || '',
        emergencyContact2: authUser.emergencyContact2 || '',
        address: authUser.address || '',
        city: authUser.city || '',
        state: authUser.state || '',
        pincode: authUser.pincode || '',
        shareMedicalInfo: authUser.shareMedicalInfo ?? true,
        shareLocation: authUser.shareLocation ?? true,
        avatar: null,
        previewAvatar: authUser.avatar || ''
      });
    }
  }, [authLoading, isUser, authUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMedicalToggle = (condition) => {
    setFormData(prev => ({
      ...prev,
      medicalConditions: prev.medicalConditions.includes(condition)
        ? prev.medicalConditions.filter(c => c !== condition)
        : [...prev.medicalConditions, condition]
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: file,
          previewAvatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('username', formData.username);
      submitData.append('contact', formData.contact);
      submitData.append('age', formData.age);
      submitData.append('bloodGroup', formData.bloodGroup);
      submitData.append('medicalInfo', formData.medicalInfo);
      submitData.append('medicalConditions', JSON.stringify(formData.medicalConditions));
      submitData.append('allergies', formData.allergies);
      submitData.append('emergencyContact1', formData.emergencyContact1);
      submitData.append('emergencyContact2', formData.emergencyContact2);
      submitData.append('address', formData.address);
      submitData.append('city', formData.city);
      submitData.append('state', formData.state);
      submitData.append('pincode', formData.pincode);
      submitData.append('shareMedicalInfo', formData.shareMedicalInfo);
      submitData.append('shareLocation', formData.shareLocation);
      if (formData.avatar) submitData.append('avatar', formData.avatar);
      
      await updateUserProfile(submitData);
      
      // Refresh user data in context
      if (checkAuth) {
        await checkAuth();
      }
      
      toast.success("Profile updated successfully!");
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const medicalConditions = [
    'Diabetic',
    'Hypertension',
    'Asthma',
    'Epilepsy',
    'Heart Condition',
    'Thyroid',
    'Arthritis',
    'No Known Conditions'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="edit-profile-container">
      <div className="safety-header">
        <h1><i className="fa fa-shield-alt"></i> Update Your Safety Profile</h1>
        <p>Keep your emergency information accurate for faster assistance</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-profile-form">
        {/* Avatar Upload */}
        <div className="avatar-upload-section">
          <div className="avatar-preview-container">
            <div className="avatar-preview">
              {formData.previewAvatar ? (
                formData.previewAvatar.startsWith('data:') ? (
                  <img src={formData.previewAvatar} alt="Preview" />
                ) : (
                  <img src={`${import.meta.env.VITE_WS_URL}${formData.previewAvatar}?t=${Date.now()}`} alt="Preview" />
                )
              ) : (
                <span>{formData.fullName?.charAt(0).toUpperCase()}</span>
              )}
              <div className="avatar-overlay">
                <i className="fa fa-camera"></i>
              </div>
            </div>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarChange}
              className="avatar-upload-input"
            />
            <label htmlFor="avatar-upload" className="avatar-upload-label">
              Change Photo
            </label>
          </div>
        </div>

        {/* Personal Information */}
        <div className="form-section personal-info-section">
          <h2><i className="fa fa-user"></i> Personal Information</h2>
          <div className="form-grid">
            <div className="form-group floating-label">
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <label htmlFor="fullName">Full Name</label>
            </div>

            <div className="form-group floating-label">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="username-input"
              />
              <label htmlFor="username">Username</label>
              <span className="input-prefix">@</span>
            </div>

            <div className="form-group floating-label">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
              />
              <label htmlFor="email">Email</label>
              <span className="lock-icon"><i className="fa fa-lock"></i></span>
            </div>

            <div className="form-group floating-label">
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
              />
              <label htmlFor="contact">Phone Number</label>
            </div>

            <div className="form-group floating-label">
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
              />
              <label htmlFor="age">Age</label>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="form-section address-section">
          <h2><i className="fa fa-map-marker-alt"></i> Address</h2>
          <div className="form-grid">
            <div className="form-group floating-label full-width">
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
              <label htmlFor="address">Street Address</label>
            </div>

            <div className="form-group floating-label">
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              <label htmlFor="city">City</label>
            </div>

            <div className="form-group floating-label">
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
              <label htmlFor="state">State</label>
            </div>

            <div className="form-group floating-label">
              <input
                type="text"
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                pattern="[0-9]*"
                maxLength="6"
              />
              <label htmlFor="pincode">Pincode</label>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="form-section medical-info-section">
          <h2><i className="fa fa-heartbeat"></i> Medical Information</h2>
          
          <div className="form-group">
            <label>Blood Group</label>
            <div className="blood-group-selector">
              {bloodGroups.map(group => (
                <button
                  key={group}
                  type="button"
                  className={`blood-group-option ${formData.bloodGroup === group ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, bloodGroup: group }))}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Medical Conditions</label>
            <div className="medical-conditions-grid">
              {medicalConditions.map(condition => (
                <div
                  key={condition}
                  className={`medical-condition-tag ${formData.medicalConditions.includes(condition) ? 'active' : ''}`}
                  onClick={() => handleMedicalToggle(condition)}
                >
                  {condition}
                  {formData.medicalConditions.includes(condition) && (
                    <i className="fa fa-check"></i>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group floating-label">
            <input
              type="text"
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder=" "
            />
            <label htmlFor="allergies">Allergies</label>
          </div>

          <div className="form-group floating-label">
            <textarea
              id="medicalInfo"
              name="medicalInfo"
              value={formData.medicalInfo}
              onChange={handleChange}
              rows="3"
              placeholder=" "
            />
            <label htmlFor="medicalInfo">Additional Medical Notes</label>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="form-section emergency-section">
          <h2><i className="fa fa-phone-alt"></i> Emergency Contacts</h2>
          <div className="form-grid">
            <div className="form-group floating-label">
              <input
                type="tel"
                id="emergencyContact1"
                name="emergencyContact1"
                value={formData.emergencyContact1}
                onChange={handleChange}
              />
              <label htmlFor="emergencyContact1">Emergency Contact 1</label>
            </div>

            <div className="form-group floating-label">
              <input
                type="tel"
                id="emergencyContact2"
                name="emergencyContact2"
                value={formData.emergencyContact2}
                onChange={handleChange}
              />
              <label htmlFor="emergencyContact2">Emergency Contact 2</label>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="form-section privacy-section">
          <h2><i className="fa fa-lock"></i> Privacy Settings</h2>
          <div className="toggle-container">
            <div className="toggle-item">
              <span>Share Medical Info in SOS</span>
              <label className="switch">
                <input
                  type="checkbox"
                  name="shareMedicalInfo"
                  checked={formData.shareMedicalInfo}
                  onChange={handleChange}
                />
                <span className="slider round"></span>
              </label>
            </div>
            <div className="toggle-item">
              <span>Enable Live Location Sharing</span>
              <label className="switch">
                <input
                  type="checkbox"
                  name="shareLocation"
                  checked={formData.shareLocation}
                  onChange={handleChange}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/profile')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className="fa fa-save"></i> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;