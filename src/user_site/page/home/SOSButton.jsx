import React, { useState } from 'react';
import './SOSButton.css';
import getCurrentLocation from './getCurrentLocation';
import { sendSOSLocation } from '../../../services/Apis';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const SOSButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, isUser, isAuthenticated } = useAuth();

  const JSON_CONFIG = {
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
  };

  const sendSOSAlert = async (payload) => {
    return await sendSOSLocation(payload, JSON_CONFIG);
  };

  const handleSOSClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1️⃣ Check auth from context (no API call needed)
      if (!isAuthenticated || !isUser || !user?._id) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      // 2️⃣ Get location
      const location = await getCurrentLocation();
      console.log("Location:", location);

      // 3️⃣ Send SOS
      const response = await sendSOSAlert({
        longitude: location.longitude,
        latitude: location.latitude,
        accuracy: location.accuracy
      });

      if (response?.status === 201 || response?.status === 200) {
        toast.success("Help is on the way! Your location has been shared.");
      } else {
        throw new Error(response?.data?.message || "Failed to send SOS");
      }
    } 
    catch (err) {
      console.error("Error during SOS:", err);

      const msg = err?.message || "Failed to send SOS.";
      setError(msg);
      toast.error(msg);

      if (msg.includes("permission")) {
        toast.error("Enable device location to send SOS.");
      }
    } 
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sos-container">
      <button
        onClick={handleSOSClick}
        disabled={isLoading}
        className="sos-button"
      >
        {isLoading ? 'Sending SOS...' : 'SOS EMERGENCY'}
      </button>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default SOSButton;
