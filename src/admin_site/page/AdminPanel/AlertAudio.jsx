import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import alertSound from "../../../assets/Audio/alert.mp3";

/**
 * AlertAudio - Audio alert component with robust permission handling
 * 
 * Permission Flow:
 * 1. Check localStorage for previous permission
 * 2. If previously granted, try to auto-enable on first user interaction
 * 3. Only show modal if never granted before OR if user explicitly denied
 * 4. Use sessionStorage to prevent repeated modal popups in same session
 */
const AlertAudio = forwardRef(({ play, onPermissionChange }, ref) => {
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const stopTimer = useRef(null);
  const hasTriedAutoEnable = useRef(false);

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Check if we should show modal (only if never granted before)
  const shouldShowModal = () => {
    const granted = localStorage.getItem("audioPermissionGranted");
    const askedThisSession = sessionStorage.getItem("audioModalShown");
    return granted !== "true" && askedThisSession !== "true";
  };

  // Initialize AudioContext for better browser compatibility
  const initAudioContext = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
        }
      }
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } catch (e) {
      console.warn("AudioContext init failed:", e);
    }
  }, []);

  // Try to silently enable audio (called on user interaction)
  const tryAutoEnable = useCallback(async () => {
    if (hasTriedAutoEnable.current || audioEnabled) return;
    hasTriedAutoEnable.current = true;

    const granted = localStorage.getItem("audioPermissionGranted");
    if (granted !== "true") return;

    try {
      initAudioContext();
      const audio = audioRef.current;
      if (!audio) return;

      audio.muted = false;
      audio.volume = 0.01; // Very quiet test
      audio.currentTime = 0;

      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0;

      setAudioEnabled(true);
      console.log("🔊 Audio auto-enabled from previous permission");
    } catch (err) {
      console.log("Auto-enable failed, will need user interaction:", err.name);
      // Don't show modal here - wait for explicit trigger
    }
  }, [audioEnabled, initAudioContext]);

  // Setup auto-enable on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      tryAutoEnable();
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [tryAutoEnable]);

  // Check permission status on mount
  useEffect(() => {
    const granted = localStorage.getItem("audioPermissionGranted");
    if (granted === "true") {
      // Previously granted - will try auto-enable on first interaction
      // Don't show modal
      setShowPermissionModal(false);
    } else if (shouldShowModal()) {
      // Never granted - show modal once
      setShowPermissionModal(true);
      sessionStorage.setItem("audioModalShown", "true");
    }
  }, []);

  // Enable audio - called via user interaction
  const enableAudio = async () => {
    try {
      initAudioContext();
      
      const audio = audioRef.current;
      if (!audio) return false;

      audio.muted = false;
      audio.volume = 1.0;
      audio.currentTime = 0;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, 100);
      }

      localStorage.setItem("audioPermissionGranted", "true");
      setAudioEnabled(true);
      setShowPermissionModal(false);
      setPermissionDenied(false);
      
      if (onPermissionChange) {
        onPermissionChange(true);
      }

      if (pendingPlay) {
        setPendingPlay(false);
        setTimeout(() => playAlert(), 200);
      }

      return true;
    } catch (err) {
      console.error("Audio enable failed:", err);
      setPermissionDenied(true);
      return false;
    }
  };

  // Play alert sound
  const playAlert = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return false;

    // If not enabled, check if we had previous permission and try to unlock
    if (!audioEnabled) {
      const hadPermission = localStorage.getItem("audioPermissionGranted") === "true";
      if (hadPermission) {
        console.log("🔇 Audio not unlocked yet, will play on next interaction");
        setPendingPlay(true);
        return false;
      }
      // Never had permission - show modal once
      console.log("🔇 Audio not enabled, showing permission modal");
      if (!sessionStorage.getItem("audioModalShown")) {
        setShowPermissionModal(true);
        sessionStorage.setItem("audioModalShown", "true");
      }
      setPendingPlay(true);
      return false;
    }

    try {
      // Ensure AudioContext is active
      initAudioContext();

      // Stop any previous sound
      if (stopTimer.current) {
        clearTimeout(stopTimer.current);
      }
      audio.pause();
      audio.currentTime = 0;

      // Play new alert
      setIsPlaying(true);
      audio.volume = 1.0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("🔊 Alert sound playing");
            // Stop after 6 seconds
            stopTimer.current = setTimeout(() => {
              audio.pause();
              audio.currentTime = 0;
              setIsPlaying(false);
            }, 6000);
          })
          .catch(err => {
            console.error("Alert playback failed:", err);
            setIsPlaying(false);
            
            // If autoplay blocked, try re-enabling on next user interaction
            // DON'T remove localStorage - session might just need re-unlock
            if (err.name === 'NotAllowedError') {
              console.log("🔇 Autoplay blocked - will re-enable on next interaction");
              setAudioEnabled(false);
              hasTriedAutoEnable.current = false; // Allow retry
              // Only show modal if user hasn't already granted permission before
              if (localStorage.getItem("audioPermissionGranted") !== "true") {
                setShowPermissionModal(true);
                setPendingPlay(true);
              }
            }
          });
      }
      
      return true;
    } catch (err) {
      console.error("Play error:", err);
      setIsPlaying(false);
      return false;
    }
  }, [audioEnabled, initAudioContext]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    playAlert,
    isEnabled: () => audioEnabled,
    requestPermission: () => setShowPermissionModal(true)
  }), [playAlert, audioEnabled]);

  // Handle play prop changes
  useEffect(() => {
    if (play) {
      playAlert();
    }
  }, [play, playAlert]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  return (
    <>
      <audio 
        ref={audioRef} 
        src={alertSound} 
        preload="auto"
        playsInline
      />

      {/* Sound Permission Modal - Full screen, critical for emergency alerts */}
      {showPermissionModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div style={{
            background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
            borderRadius: "20px",
            padding: "40px",
            maxWidth: "450px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
            animation: "slideUp 0.4s ease-out"
          }}>
            {/* Icon */}
            <div style={{
              fontSize: "64px",
              marginBottom: "20px",
              animation: "pulse 1.5s infinite"
            }}>
              🔔
            </div>

            {/* Title */}
            <h2 style={{
              color: "#fff",
              fontSize: "24px",
              fontWeight: "700",
              margin: "0 0 12px",
            }}>
              Enable Emergency Alerts
            </h2>

            {/* Description */}
            <p style={{
              color: "#a0aec0",
              fontSize: "15px",
              lineHeight: "1.6",
              margin: "0 0 8px"
            }}>
              Sound alerts are <strong style={{ color: "#f56565" }}>critical</strong> for
              emergency response. You will be notified immediately when someone needs help.
            </p>

            {permissionDenied && (
              <p style={{
                color: "#fc8181",
                fontSize: "13px",
                background: "rgba(252, 129, 129, 0.1)",
                padding: "10px",
                borderRadius: "8px",
                margin: "10px 0"
              }}>
                ⚠️ Audio was blocked. Click the button below to try again.
              </p>
            )}

            {/* Enable Button */}
            <button
              onClick={enableAudio}
              style={{
                width: "100%",
                padding: "16px 32px",
                marginTop: "20px",
                background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 10px 30px rgba(72, 187, 120, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              🔊 Enable Alert Sounds
            </button>

            {/* Warning if they try to skip */}
            <p style={{
              color: "#718096",
              fontSize: "12px",
              marginTop: "16px",
              fontStyle: "italic"
            }}>
              ⚠️ You won't receive audio notifications for SOS alerts without this permission
            </p>
          </div>
        </div>
      )}

      {/* Playing Indicator */}
      {isPlaying && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          background: "linear-gradient(135deg, #e53e3e 0%, #c53030 100%)",
          color: "#fff",
          padding: "14px 24px",
          borderRadius: "10px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "pulse 1s infinite",
          zIndex: 9999,
          boxShadow: "0 4px 20px rgba(229, 62, 62, 0.5)"
        }}>
          <span style={{ fontSize: "20px" }}>🚨</span>
          EMERGENCY ALERT
        </div>
      )}

      {/* Inline CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </>
  );
});

AlertAudio.displayName = 'AlertAudio';

export default AlertAudio;
