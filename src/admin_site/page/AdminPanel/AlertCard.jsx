import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AlertAudio from './AlertAudio';
import { useSocket } from '../../../context/SocketContext';
import { useNavigate } from "react-router-dom";
import { Clock3, LocateFixed, Mail, PhoneCall, Siren, Video } from 'lucide-react';

const AlertCard = ({ alert, officers, onDispatch, onResolve, onLocateOnMap }) => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const handleRequestLive = () => {
    if (!socket) {
      console.error("[AlertCard] No socket available for live request");
      return;
    }
    const targetUserId = alert.user._id;
    console.log("[AlertCard] 📹 Requesting live video from user:", targetUserId);
    console.log("[AlertCard] Socket connected:", socket.connected);
    socket.emit("request_live_video", { targetUserId });
    navigate(`/admin/live/${targetUserId}`);
  };

  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [liveAddress, setLiveAddress] = useState(alert.liveAddress || 'Fetching location...');
  const [playAlarm, setPlayAlarm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const timeSinceAlert = () => {
    const seconds = Math.floor((new Date() - new Date(alert.alertTime)) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
    
    if (!apiKey) {
      console.error('VITE_OPENCAGE_API_KEY not found in environment');
      return 'Address unavailable (API key missing)';
    }
    
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;
    try {
      const response = await axios.get(url);
      
      // Check for API errors
      if (response.data.status && response.data.status.code !== 200) {
        const code = response.data.status.code;
        if (code === 401) return 'Address unavailable (Token expired)';
        if (code === 402) return 'Address unavailable (Quota exceeded)';
        if (code === 403) return 'Address unavailable (Access denied)';
        return `Address unavailable (Error ${code})`;
      }
      
      const result = response.data.results[0];
      let formatted = result?.formatted || 'Address not found';

      if (formatted.toLowerCase().startsWith('unnamed road,')) {
        const parts = formatted.split(',').slice(1).map(p => p.trim());
        formatted = parts.join(', ');
      }

      return formatted;
    } catch (error) {
      console.error('OpenCage error:', error.response?.data?.status?.message || error.message);
      return 'Address unavailable';
    }
  };

  useEffect(() => {
    // Use address from database, fallback to API only if empty
    const fetchAddress = async () => {
      // If we have a valid address from database, use it
      if (alert.liveAddress && !alert.liveAddress.startsWith('Address unavailable')) {
        setLiveAddress(alert.liveAddress);
        return;
      }
      
      // Fallback: fetch from API if database address is empty or has error
      console.log('📍 Fetching address from API (not in database)');
      const { lat, lng } = alert.location;
      const fetchedAddress = await getAddressFromCoordinates(lat, lng);
      setLiveAddress(fetchedAddress);
    };
    fetchAddress();
  }, [alert.location.lat, alert.location.lng, alert.liveAddress]);

  const isCCTVAlert = alert.source === 'CCTV';
  const accuracyTone = (alert.location?.accuracy || 'medium').toLowerCase();
  
  // Get user's home address from profile
  const getUserHomeAddress = () => {
    const parts = [];
    if (alert.user.address) parts.push(alert.user.address);
    if (alert.user.city) parts.push(alert.user.city);
    if (alert.user.state) parts.push(alert.user.state);
    if (alert.user.pincode) parts.push(alert.user.pincode);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const homeAddress = getUserHomeAddress();

  return (
    <>
      <div className={`alert-card tone-${accuracyTone}`}>
        <div
          className="alert-header"
          role="button"
          tabIndex={0}
          onClick={() => setShowDetails(!showDetails)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setShowDetails((prev) => !prev);
            }
          }}
        >
          {isCCTVAlert ? (
            <img
              src={`${import.meta.env.VITE_WS_URL}/cctv_sos/${alert.user.photo || 'cctv-icon.png'}?t=${Date.now()}`}
              alt="CCTV Icon"
              className="profile-photo"
            />
          ) : (
            <img src={`${import.meta.env.VITE_WS_URL}${alert.user.photo || 'cctv-icon.png'}?t=${Date.now()}`} alt="User" className="profile-photo" />
          )}

          <div className="user-info">
            <div className="alert-title-row">
              <h3>{isCCTVAlert ? 'CCTV Alert' : `Web Alert: ${alert.user.name}`}</h3>
              <span className={`alert-source-chip ${isCCTVAlert ? 'cctv' : 'web'}`}>
                {isCCTVAlert ? 'Camera Trigger' : 'User Trigger'}
              </span>
            </div>

            <div className="alert-sub-row">
              <p>
                <Clock3 size={14} />
                {timeSinceAlert()}
                <span className="dot-separator">|</span>
                <strong>Live Location:</strong>
                {liveAddress}
              </p>

              <button
                className="video-btn locate-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLocateOnMap();
                }}
              >
                <LocateFixed size={15} />
                <span className="locate-text">Locate on Map</span>
              </button>
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="alert-details">
            {!isCCTVAlert && (
              <div className="user-details">
                {alert.user.bloodGroup && (
                  <p>
                    <strong>Blood Group:</strong> <span className="blood-group-tag">{alert.user.bloodGroup}</span>
                  </p>
                )}
                {alert.user.medicalInfo && (
                  <p><strong>Medical Info:</strong> {alert.user.medicalInfo}</p>
                )}
                {alert.user.medicalConditions && alert.user.medicalConditions.length > 0 && (
                  <p><strong>Medical Conditions:</strong> {alert.user.medicalConditions.join(', ')}</p>
                )}
                {alert.user.allergies && (
                  <p><strong>Allergies:</strong> {alert.user.allergies}</p>
                )}

                <div className="quick-actions-row">
                  <p><strong>Quick Actions:</strong></p>
                  <ul className="quick-actions-list">
                    {alert.user.contact && (
                      <li>
                        <a href={`tel:${alert.user.contact}`} className="quick-action-link">
                          <button type="button" className="call-btn">
                            <PhoneCall size={13} /> Call User
                          </button>
                        </a>
                      </li>
                    )}
                    {alert.user.email && (
                      <li>
                        <a href={`mailto:${alert.user.email}`} className="quick-action-link">
                          <button type="button" className="call-btn">
                            <Mail size={13} /> Email User
                          </button>
                        </a>
                      </li>
                    )}
                    {alert.user.emergencyContact1 && (
                      <li>
                        <a href={`tel:${alert.user.emergencyContact1}`} className="quick-action-link">
                          <button type="button" className="call-btn">
                            <PhoneCall size={13} /> Emergency 1
                          </button>
                        </a>
                      </li>
                    )}
                    {alert.user.emergencyContact2 && (
                      <li>
                        <a href={`tel:${alert.user.emergencyContact2}`} className="quick-action-link">
                          <button type="button" className="call-btn">
                            <PhoneCall size={13} /> Emergency 2
                          </button>
                        </a>
                      </li>
                    )}
                  </ul>
                </div>

                {homeAddress && (
                  <p className="home-address-line"><strong>Home Address:</strong> {homeAddress}</p>
                )}

                <button
                  type="button"
                  className="view-profile-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileModal(true);
                  }}
                >
                  View Full Profile
                </button>
              </div>
            )}

            {isCCTVAlert && (
              <div className="user-details">
                <p><strong>Camera Number:</strong> 6</p>
                <p><strong>Camera Location:</strong> {liveAddress}</p>
              </div>
            )}

            {isCCTVAlert && alert.user.photo && (
              <div className="cctv-image-preview">
                <p><strong>Captured Image:</strong></p>
                <img
                  src={`${import.meta.env.VITE_WS_URL}/cctv_sos/${alert.user.photo || 'cctv-icon.png'}?t=${Date.now()}`}
                  alt="CCTV Snapshot"
                  className="cctv-image"
                />
              </div>
            )}

            <div className="location-details">
              <p>
                <strong>Location Accuracy:</strong>
                <span className={`accuracy-badge tone-${accuracyTone}`}>{alert.location.accuracy}</span>
              </p>
            </div>

            <div className="action-buttons">
              <button
                className="panic-btn"
                onClick={() => {
                  setPlayAlarm(true);
                  setTimeout(() => setPlayAlarm(false), 1000);
                }}
              >
                <Siren size={15} /> Trigger Panic Alarm
              </button>

              {!isCCTVAlert && (
                <button type='button' className="video-btn" onClick={handleRequestLive}>
                  <Video size={15} /> Request Live Video
                </button>
              )}

              <div className="dispatch-controls">
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                >
                  <option value="">Select Officer</option>
                  {officers.filter(o => o.status === 'available').map(officer => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name}
                    </option>
                  ))}
                </select>

                {selectedOfficer && (
                  <button
                    className="dispatch-btn"
                    onClick={() => onDispatch(alert.id, parseInt(selectedOfficer, 10))}
                  >
                    Dispatch Team
                  </button>
                )}
              </div>

              <button className="resolve-btn" onClick={() => onResolve()}>
                Mark as Resolved
              </button>
            </div>
          </div>
        )}

        <AlertAudio play={playAlarm} />
      </div>

      {/* Profile Modal */}
      {showProfileModal && !isCCTVAlert && (
        <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="profile-modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            
            <div className="profile-modal-header">
              <img 
                src={`${import.meta.env.VITE_WS_URL}${alert.user.photo || '/default-avatar.png'}?t=${Date.now()}`} 
                alt="Profile" 
                className="profile-modal-avatar"
              />
              <h2>{alert.user.name || 'Unknown User'}</h2>
            </div>

            <div className="profile-modal-body">
              <div className="profile-modal-section">
                <h3>Contact</h3>
                {alert.user.email && <p><strong>Email</strong> <span>{alert.user.email}</span></p>}
                {alert.user.contact && <p><strong>Phone</strong> <a href={`tel:${alert.user.contact}`}>{alert.user.contact}</a></p>}
                {alert.user.age && <p><strong>Age</strong> <span>{alert.user.age} years</span></p>}
              </div>

              {(alert.user.bloodGroup || alert.user.medicalInfo || alert.user.allergies || (alert.user.medicalConditions && alert.user.medicalConditions.length > 0)) && (
                <div className="profile-modal-section">
                  <h3>Medical</h3>
                  {alert.user.bloodGroup && <p><strong>Blood</strong> <span className="blood-group-tag">{alert.user.bloodGroup}</span></p>}
                  {alert.user.medicalConditions && alert.user.medicalConditions.length > 0 && (
                    <p><strong>Conditions</strong> <span>{alert.user.medicalConditions.join(', ')}</span></p>
                  )}
                  {alert.user.allergies && <p><strong>Allergies</strong> <span>{alert.user.allergies}</span></p>}
                  {alert.user.medicalInfo && <p><strong>Notes</strong> <span>{alert.user.medicalInfo}</span></p>}
                </div>
              )}

              {(alert.user.emergencyContact1 || alert.user.emergencyContact2) && (
                <div className="profile-modal-section">
                  <h3>Emergency Contacts</h3>
                  {alert.user.emergencyContact1 && (
                    <p><strong>Primary</strong> <a href={`tel:${alert.user.emergencyContact1}`}>{alert.user.emergencyContact1}</a></p>
                  )}
                  {alert.user.emergencyContact2 && (
                    <p><strong>Secondary</strong> <a href={`tel:${alert.user.emergencyContact2}`}>{alert.user.emergencyContact2}</a></p>
                  )}
                </div>
              )}

              {homeAddress && (
                <div className="profile-modal-section">
                  <h3>Home Address</h3>
                  <p><span>{homeAddress}</span></p>
                </div>
              )}

              <div className="profile-modal-section">
                <h3>Alert Location</h3>
                <p><span>{liveAddress}</span></p>
                <p className="coords-text">
                  {alert.location.lat.toFixed(6)}, {alert.location.lng.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="profile-modal-actions">
              {alert.user.contact && (
                <a href={`tel:${alert.user.contact}`}>
                  <button type="button" className="call-btn">
                    <PhoneCall size={13} /> Call
                  </button>
                </a>
              )}
              {alert.user.email && (
                <a href={`mailto:${alert.user.email}`}>
                  <button type="button" className="call-btn">
                    <Mail size={13} /> Email
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertCard;
