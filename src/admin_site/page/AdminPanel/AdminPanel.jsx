import React, { useState, useEffect, useRef, useCallback } from 'react';
import './AdminPanel.css';
import DashboardHeader from './DashboardHeader';
import AlertCard from './AlertCard';
import EmergencyMap from './EmergencyMap';
import AlertAudio from './AlertAudio';
import AdminManagement from './AdminManagement';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';
import { 
  fetchAllWebAlerts, 
  fetchAllCCTVAlerts, 
  markWebSosResolved, 
  markCCTVSosResolved 
} from '../../../services/Apis';
import { convertToIST } from './TimeconvertToIST';
import { getAccuracyLevel } from './GetAccuracyLevel';
import { toast } from 'react-toastify';
import { Navigate, useNavigate } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';

const AdminPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [playAlertSound, setPlayAlertSound] = useState(false);
  
  // Ref for direct audio control
  const alertAudioRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);

  const [mapVisible, setMapVisible] = useState(false);
  const [selectedAlertCoords, setSelectedAlertCoords] = useState(null);

  const [officers, setOfficers] = useState([
    { id: 1, name: 'Officer Raj', status: 'available', location: 'Station' },
    { id: 2, name: 'Officer Priya', status: 'patrolling', location: 'MG Road' }
  ]);

  const navigate = useNavigate();
  const { socket } = useSocket();
  const { admin, isAdmin, isLoading: authLoading } = useAuth();

  // ----------------------------- ADMIN AUTH CHECK ---------------------------------
  useEffect(() => {
    // Wait for auth to complete loading
    if (authLoading) return;
    
    // If not logged in as admin, redirect to login
    if (!isAdmin || !admin) {
      // Don't show "session expired" - just redirect to login
      navigate('/admin/login', { replace: true });
    } else {
      setIsLoading(false);
    }
  }, [authLoading, isAdmin, admin, navigate]);

  // ----------------------------- PLAY ALERT SOUND ---------------------------------
  const triggerAlertSound = useCallback(() => {
    // Try to play via ref first (more reliable)
    if (alertAudioRef.current?.playAlert) {
      alertAudioRef.current.playAlert();
    } else {
      // Fallback to prop-based trigger
      setPlayAlertSound(true);
      setTimeout(() => setPlayAlertSound(false), 5000);
    }
  }, []);

  // ----------------------------- FETCH ALERTS ---------------------------------
  const fetchAndSetAlerts = async () => {
    try {
      const [webRes, cctvRes] = await Promise.all([
        fetchAllWebAlerts(),
        fetchAllCCTVAlerts()
      ]);

      // Check if responses are successful
      const webSuccess = webRes?.data?.success !== false && webRes?.status !== 401;
      const cctvSuccess = cctvRes?.data?.success !== false && cctvRes?.status !== 401;

      // If both failed with auth error, don't show toast (handled by auth redirect)
      if (!webSuccess && !cctvSuccess) {
        if (webRes?.status === 401 || cctvRes?.status === 401) {
          console.log("Session expired, redirecting to login");
          return; // Auth redirect will handle this
        }
        console.error("Failed to fetch alerts", { webRes, cctvRes });
        return;
      }

      // Handle new paginated response structure: { alerts, pagination }
      const webAlertsData = webSuccess ? (webRes?.data?.data?.alerts || webRes?.data?.data || []) : [];
      const cctvAlertsData = cctvSuccess ? (cctvRes?.data?.data?.alerts || cctvRes?.data?.data || []) : [];

      const webAlerts = webAlertsData.map(data => ({
        alertTime: convertToIST(data.createdAt),
        id: data._id,
        location: {
          accuracy: getAccuracyLevel(data.location.accuracy),
          lat: data.location.coordinates[1],
          lng: data.location.coordinates[0],
        },
        liveAddress: data.liveAddress || '',
        status: data.status,
        source: 'Web',
        user: data.userId
          ? {
              _id: data.userId._id,
              name: data.userId.fullName,
              email: data.userId.email,
              contact: data.userId.contact,
              photo: data.userId.avatar,
              age: data.userId.age,
              bloodGroup: data.userId.bloodGroup,
              medicalInfo: data.userId.medicalInfo,
              medicalConditions: data.userId.medicalConditions || [],
              allergies: data.userId.allergies,
              emergencyContact1: data.userId.emergencyContact1,
              emergencyContact2: data.userId.emergencyContact2,
              address: data.userId.address,
              city: data.userId.city,
              state: data.userId.state,
              pincode: data.userId.pincode,
            }
          : { name: 'Unknown', email: '', contact: '', photo: '' }
      }));

      const cctvAlerts = cctvAlertsData.map(data => ({
        alertTime: convertToIST(data.createdAt),
        id: data._id,
        location: {
          accuracy: getAccuracyLevel(data.location.accuracy),
          lat: data.location.coordinates[1],
          lng: data.location.coordinates[0],
        },
        status: data.status,
        source: 'CCTV',
        sosImg: `${import.meta.env.VITE_WS_URL}/cctv_sos/${data.sos_img}`,
        user: { age: null, emergencyContacts: [], name: 'CCTV Camera', photo: data.sos_img }
      }));

      const combined = [...webAlerts, ...cctvAlerts].sort(
        (a, b) => new Date(b.alertTime) - new Date(a.alertTime)
      );

      setAlerts(combined);

    } catch (error) {
      // Only log error, don't show toast (may be auth redirect in progress)
      console.error('Error fetching alerts:', error);
    }
  };

  // ----------------------------- SOCKET CONNECTION ---------------------------------
  useEffect(() => {
    fetchAndSetAlerts();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewAlert = (data) => {
      const newAlert = {
        alertTime: convertToIST(data.createdAt),
        id: data._id,
        location: {
          accuracy: getAccuracyLevel(data.location.accuracy),
          lat: data.location.coordinates[1],
          lng: data.location.coordinates[0],
        },
        liveAddress: data.liveAddress || '',
        status: data.status || 'active', // Default to active for new alerts
        source: data.userId ? 'Web' : 'CCTV',
        user: data.userId
          ? {
              _id: data.userId._id,
              name: data.userId.fullName,
              email: data.userId.email,
              contact: data.userId.contact,
              photo: data.userId.avatar,
              age: data.userId.age,
              bloodGroup: data.userId.bloodGroup,
              medicalInfo: data.userId.medicalInfo,
              medicalConditions: data.userId.medicalConditions || [],
              allergies: data.userId.allergies,
              emergencyContact1: data.userId.emergencyContact1,
              emergencyContact2: data.userId.emergencyContact2,
              address: data.userId.address,
              city: data.userId.city,
              state: data.userId.state,
              pincode: data.userId.pincode,
            }
          : { name: 'CCTV Camera', photo: data.sos_img || 'cctv-icon.png' }
      };

      setAlerts(prev => {
        const exists = prev.some(a => a.id === newAlert.id);
        if (!exists) {
          // New alert - trigger sound immediately
          console.log("🚨 New alert received, triggering sound");
          triggerAlertSound();
          return [newAlert, ...prev];
        }
        return prev;
      });
    };

    socket.on("new_alert", handleNewAlert);

    return () => {
      socket.off("new_alert", handleNewAlert);
    };
  }, [socket, triggerAlertSound]);

  // ----------------------------- SCROLL AUTOMATICALLY ON NEW ALERT ---------------------------------
  useEffect(() => {
    const alertListEl = document.querySelector('.alert-list');
    if (alertListEl) alertListEl.scrollTo({ top: 0, behavior: 'smooth' });
  }, [alerts]);

  // ----------------------------- RESOLVE ALERT ---------------------------------
  const handleResolve = async (alertId, source = 'Web') => {
    try {
      const response =
        source === 'CCTV'
          ? await markCCTVSosResolved(alertId, {})
          : await markWebSosResolved(alertId, {});

      if (response?.data?.success) {
        toast.success(`${source} SOS marked resolved`);
        fetchAndSetAlerts();
      } else toast.warning("Server did not confirm resolution");

    } catch (error) {
      console.error('Resolve error:', error);
      toast.error("Failed to resolve SOS");
    }
  };

  const handleDispatch = (alertId, officerId) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, status: 'dispatched', assignedOfficer: officerId } : alert
      )
    );

    setOfficers(prev =>
      prev.map(officer =>
        officer.id === officerId ? { ...officer, status: 'assigned' } : officer
      )
    );
  };

  const handleLocateOnMap = (coords) => {
    setSelectedAlertCoords(coords);
    setMapVisible(true);
  };

  if (isLoading || authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <p className="loading-label">Responder Console</p>
          <h2>Loading admin command center...</h2>
        </div>
      </div>
    );
  }

  if (!admin) return <Navigate to="/admin/login" replace />;

  const activeAlertCount = alerts.filter((alert) => alert.status === 'active').length;
  const isManagementView = activeTab === 'management';
  const filteredAlerts = activeTab === 'history'
    ? alerts
    : alerts.filter((alert) => alert.status === 'active');

  return (
    <div className="admin-panel">
      <div className="admin-panel-bg admin-panel-bg-top" aria-hidden="true"></div>
      <div className="admin-panel-bg admin-panel-bg-bottom" aria-hidden="true"></div>

      {/* Alert Audio - handles its own permission modal */}
      <AlertAudio ref={alertAudioRef} play={playAlertSound} />

      <div className="admin-panel-shell">
        <DashboardHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          alertCount={activeAlertCount}
          totalAlertCount={alerts.length}
          currentAdmin={admin}
        />

        {isManagementView ? (
          <AdminManagement />
        ) : (
          <div className="dashboard-content">
            <section className="alert-list" aria-label="Emergency Alerts">
              <div className="alert-list-head">
                <div>
                  <p className="alert-list-eyebrow">Live Response Feed</p>
                  <h2>{activeTab === 'dashboard' ? 'Active Alerts' : 'Alert History'}</h2>
                </div>
                <span className="alert-list-count">{filteredAlerts.length}</span>
              </div>

              {filteredAlerts.length ? (
                filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    officers={officers}
                    onDispatch={handleDispatch}
                    onResolve={() => handleResolve(alert.id, alert.source)}
                    onLocateOnMap={() => handleLocateOnMap(alert.location)}
                  />
                ))
              ) : (
                <div className="admin-empty-state">
                  <h3>No alerts in this view</h3>
                  <p>New SOS events will appear here in real-time as soon as they are reported.</p>
                </div>
              )}
            </section>

            <aside className="map-container" aria-label="Navigation Map Panel">
              <div className="map-header">
                <div>
                  <p className="alert-list-eyebrow">Dispatch Navigation</p>
                  <h2>Nearest Route Guidance</h2>
                </div>

                {mapVisible ? (
                  <button
                    className="close-map-btn"
                    onClick={() => {
                      setSelectedAlertCoords(null);
                      setMapVisible(false);
                    }}
                  >
                    <IoClose /> Close Map
                  </button>
                ) : null}
              </div>

              {mapVisible && selectedAlertCoords ? (
                <EmergencyMap alertCoords={selectedAlertCoords} />
              ) : (
                <div className="map-placeholder">
                  <h3>Select an alert to open route map</h3>
                  <p>
                    Use the <strong>Locate on Map</strong> action from any alert card to view the closest dispatch route.
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
