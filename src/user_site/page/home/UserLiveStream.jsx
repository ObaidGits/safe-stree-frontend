import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../../../context/SocketContext";
import "./UserLiveStream.css";

/**
 * WebRTC Configuration with public STUN servers
 * These help with NAT traversal for peer-to-peer connections
 */
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

// Target video bitrate in kbps (5 Mbps for HD quality)
const VIDEO_BITRATE_KBPS = 5000;

/**
 * Modify SDP to set minimum and maximum bitrate for video
 * This helps maintain video quality by preventing aggressive downscaling
 */
const setMediaBitrate = (sdp, mediaType, bitrate) => {
  const lines = sdp.split('\n');
  let mediaLineIndex = -1;
  
  // Find the media line (m=video or m=audio)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`m=${mediaType}`)) {
      mediaLineIndex = i;
      break;
    }
  }
  
  if (mediaLineIndex === -1) return sdp;
  
  // Find next media line or end
  let nextMediaIndex = lines.length;
  for (let i = mediaLineIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('m=')) {
      nextMediaIndex = i;
      break;
    }
  }
  
  // Check if b=AS line exists
  let bLineIndex = -1;
  for (let i = mediaLineIndex; i < nextMediaIndex; i++) {
    if (lines[i].startsWith('b=AS:') || lines[i].startsWith('b=TIAS:')) {
      bLineIndex = i;
      break;
    }
  }
  
  // Set bitrate using b=AS (Application Specific) in kbps
  const bLine = `b=AS:${bitrate}`;
  
  if (bLineIndex !== -1) {
    lines[bLineIndex] = bLine;
  } else {
    // Insert after c= line or after m= line
    let insertIndex = mediaLineIndex + 1;
    for (let i = mediaLineIndex + 1; i < nextMediaIndex; i++) {
      if (lines[i].startsWith('c=')) {
        insertIndex = i + 1;
        break;
      }
    }
    lines.splice(insertIndex, 0, bLine);
  }
  
  return lines.join('\n');
};

/**
 * UserLiveStream - Handles video streaming from user to admin
 * 
 * Flow:
 * 1. Admin requests live video
 * 2. User sees modal to accept/reject
 * 3. User accepts -> getUserMedia + create WebRTC offer
 * 4. Admin receives offer -> creates answer
 * 5. ICE candidates exchanged -> connection established
 */
const UserLiveStream = ({ userId }) => {
  const { socket, isConnected: socketConnected } = useSocket();
  
  // Refs for WebRTC
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const reconnectTimeoutRef = useRef(null);
  const isRegisteredRef = useRef(false);
  const renegotiateRef = useRef(null);
  const isStreamingRef = useRef(false);
  const showRequestModalRef = useRef(false);

  // State
  const [showRequestModal, _setShowRequestModal] = useState(false);
  const [isStreaming, _setIsStreaming] = useState(false);

  // Wrapper setters that also update refs (to avoid stale closures in event handlers)
  const setShowRequestModal = (val) => { showRequestModalRef.current = val; _setShowRequestModal(val); };
  const setIsStreaming = (val) => { isStreamingRef.current = val; _setIsStreaming(val); };
  const [connectionState, setConnectionState] = useState("idle"); // idle, connecting, connected, failed
  const [streamError, setStreamError] = useState(null);
  const [adminViewing, setAdminViewing] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Cleanup function
  const cleanup = useCallback((notifySocket = false) => {
    console.log("[UserStream] Cleaning up...");
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log("[UserStream] Track stopped:", track.kind);
      });
      localStreamRef.current = null;
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    iceCandidatesQueue.current = [];
    setIsStreaming(false);
    setConnectionState("idle");
    setAdminViewing(false);

    if (notifySocket && socket && userId) {
      socket.emit("live_stream_stopped", { roomId: userId, userId });
    }
  }, [socket, userId]);

  // Initialize WebRTC peer connection
  const createPeerConnection = useCallback(() => {
    console.log("[UserStream] Creating peer connection...");
    
    const peer = new RTCPeerConnection(RTC_CONFIG);
    
    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log("[UserStream] Sending ICE candidate");
        socket.emit("ice-candidate", { roomId: userId, candidate: event.candidate });
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log("[UserStream] ICE state:", peer.iceConnectionState);
      
      switch (peer.iceConnectionState) {
        case "checking":
          setConnectionState("connecting");
          break;
        case "connected":
        case "completed":
          setConnectionState("connected");
          setAdminViewing(true);
          // Reapply encoding parameters when connection is established
          peer.getSenders().forEach(async (sender) => {
            if (sender.track?.kind === 'video') {
              try {
                const params = sender.getParameters();
                if (!params.encodings || params.encodings.length === 0) {
                  params.encodings = [{}];
                }
                params.encodings[0].maxBitrate = 5000000; // 5 Mbps
                params.encodings[0].scaleResolutionDownBy = 1.0;
                params.degradationPreference = "maintain-resolution";
                await sender.setParameters(params);
                console.log("[UserStream] Encoding params reapplied on connection");
              } catch (e) {
                console.log("[UserStream] Failed to reapply encoding params:", e);
              }
            }
          });
          break;
        case "disconnected":
          setConnectionState("connecting");
          setAdminViewing(false);
          // Don't auto-renegotiate - wait for ICE to recover or fail
          console.log("[UserStream] ICE disconnected, waiting for recovery...");
          break;
        case "failed":
          setConnectionState("failed");
          setAdminViewing(false);
          setStreamError("Connection failed. Admin may need to reconnect.");
          break;
        case "closed":
          setConnectionState("idle");
          setAdminViewing(false);
          break;
      }
    };

    peer.onconnectionstatechange = () => {
      console.log("[UserStream] Connection state:", peer.connectionState);
    };

    return peer;
  }, [socket, userId]);

  // Renegotiate the connection
  const renegotiate = useCallback(async () => {
    if (!peerRef.current || !socket) return;
    
    try {
      const offer = await peerRef.current.createOffer({ iceRestart: true });
      await peerRef.current.setLocalDescription(offer);
      socket.emit("offer", { roomId: userId, offer });
      console.log("[UserStream] Renegotiation offer sent");
    } catch (err) {
      console.error("[UserStream] Renegotiation failed:", err);
    }
  }, [socket, userId]);

  // Keep ref updated
  useEffect(() => {
    renegotiateRef.current = renegotiate;
  }, [renegotiate]);

  // Start live stream
  const startLiveStream = async () => {
    console.log("[UserStream] Starting live stream...");
    setShowRequestModal(false);
    setStreamError(null);
    setConnectionState("connecting");
    
    // Set streaming to true FIRST so the video element renders
    setIsStreaming(true);

    // Notify admin that user accepted
    socket?.emit("live_stream_accepted", { roomId: userId, userId });

    try {
      // Get user media with high quality settings
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            frameRate: { min: 15, ideal: 30, max: 30 },
            facingMode: "user"
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        });
      } catch (constraintError) {
        // Fallback to basic constraints if camera doesn't support HD
        console.log("[UserStream] HD constraints failed, trying basic constraints:", constraintError.name);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      console.log("[UserStream] Media stream obtained, tracks:", stream.getTracks().map(t => t.kind).join(', '));
      
      // Log actual video settings and warn if low quality
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log("[UserStream] ✅ Actual video settings:", {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
          deviceId: settings.deviceId
        });
        
        // Warn if quality is low
        if (settings.width < 640 || settings.height < 480) {
          console.warn("[UserStream] ⚠️ Camera is providing low resolution! Check camera settings.");
        }
      }
      
      localStreamRef.current = stream;

      // Wait for video element to be rendered (state update is async)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to set video srcObject, with retry
      const setVideoSrc = () => {
        if (videoRef.current) {
          console.log("[UserStream] Setting local video preview...");
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log("[UserStream] Local video metadata loaded, dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight);
          };
          videoRef.current.play().then(() => {
            console.log("[UserStream] Local video preview playing");
          }).catch(e => console.log("[UserStream] Local video play error:", e));
          return true;
        }
        return false;
      };
      
      if (!setVideoSrc()) {
        console.log("[UserStream] Video element not ready, retrying in 200ms...");
        await new Promise(resolve => setTimeout(resolve, 200));
        if (!setVideoSrc()) {
          console.log("[UserStream] WARNING: videoRef.current still null after retry!");
        }
      }

      // Create peer connection
      const peer = createPeerConnection();
      peerRef.current = peer;

      // Add tracks to peer - use addTrack with stream for proper association
      const videoSenders = [];
      stream.getTracks().forEach(track => {
        const sender = peer.addTrack(track, stream);
        console.log("[UserStream] Added track:", track.kind, "sender:", !!sender);
        if (track.kind === 'video') {
          videoSenders.push(sender);
        }
      });

      // Set encoding parameters for video senders after a short delay
      // This ensures the sender is fully initialized
      setTimeout(async () => {
        for (const sender of videoSenders) {
          if (!sender) continue;
          try {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            // Set high quality encoding parameters
            params.encodings[0].maxBitrate = 5000000; // 5 Mbps
            params.encodings[0].scaleResolutionDownBy = 1.0; // No downscaling
            params.degradationPreference = "maintain-resolution"; // Prefer dropping frames over resolution
            
            await sender.setParameters(params);
            console.log("[UserStream] Video encoding params set:", {
              maxBitrate: "5 Mbps",
              scaleResolutionDownBy: 1.0,
              degradationPreference: "maintain-resolution"
            });
          } catch (e) {
            console.log("[UserStream] Failed to set encoding params:", e);
          }
        }
      }, 500);

      // Join room first
      socket.emit("join-room", { roomId: userId, role: "user" });
      
      // Small delay to ensure room is joined
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create offer with proper options
      const offer = await peer.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });
      
      // Modify SDP to add bitrate constraints
      let modifiedSdp = setMediaBitrate(offer.sdp, 'video', VIDEO_BITRATE_KBPS);
      modifiedSdp = setMediaBitrate(modifiedSdp, 'audio', 128); // 128 kbps for audio
      
      const modifiedOffer = {
        type: offer.type,
        sdp: modifiedSdp
      };
      
      console.log("[UserStream] Offer SDP contains video:", modifiedSdp.includes('m=video'));
      console.log("[UserStream] Offer SDP contains b=AS:", modifiedSdp.includes('b=AS:'));
      
      await peer.setLocalDescription(modifiedOffer);
      
      console.log("[UserStream] Sending offer to admin with modified bitrate");
      socket.emit("offer", { roomId: userId, offer: modifiedOffer });

    } catch (err) {
      console.error("[UserStream] Failed to start stream:", err);
      setIsStreaming(false);
      setConnectionState("failed");
      
      if (err.name === "NotAllowedError") {
        setStreamError("Camera/microphone permission denied. Please allow access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setStreamError("No camera found. Please connect a camera and try again.");
      } else if (err.name === "NotReadableError") {
        setStreamError("Camera is in use by another application. Please close other apps using the camera.");
      } else if (err.name === "OverconstrainedError") {
        // Camera doesn't support requested resolution, try with lower settings
        console.log("[UserStream] Camera doesn't support high resolution, retrying with lower settings...");
        setStreamError("Camera doesn't support high quality. Trying again...");
      } else {
        setStreamError("Failed to start stream: " + err.message);
      }
      
      // Notify admin of failure
      socket?.emit("live_stream_stopped", { 
        roomId: userId, 
        userId, 
        reason: err.message 
      });
    }
  };

  // Stop live stream
  const stopLiveStream = () => {
    console.log("[UserStream] User stopping stream...");
    cleanup(true);
  };

  // Reject stream request
  const rejectStreamRequest = () => {
    console.log("[UserStream] User rejected stream request");
    setShowRequestModal(false);
    socket?.emit("live_stream_rejected", { roomId: userId, userId });
  };

  // Register user to socket room - critical for receiving events
  useEffect(() => {
    if (!socket) {
      console.log("[UserStream] No socket available");
      return;
    }
    
    if (!userId) {
      console.log("[UserStream] No userId available yet");
      return;
    }

    const registerUser = () => {
      console.log("[UserStream] 🔑 Registering user to socket room:", userId);
      socket.emit("register_user", { userId });
    };

    // Handle registration confirmation from server
    const handleRegistrationConfirmed = (data) => {
      if (data?.userId === userId) {
        console.log("[UserStream] ✅ Registration confirmed:", data.userId);
        isRegisteredRef.current = true;
        setIsRegistered(true);
      }
    };

    // Register immediately if connected
    if (socket.connected) {
      registerUser();
    }

    // Re-register on reconnect
    socket.on("connect", registerUser);
    socket.on("registration_confirmed", handleRegistrationConfirmed);

    return () => {
      socket.off("connect", registerUser);
      socket.off("registration_confirmed", handleRegistrationConfirmed);
    };
  }, [socket, userId]);

  // Socket event handlers for live streaming
  useEffect(() => {
    if (!socket) {
      console.log("[UserStream] No socket, skipping event setup");
      return;
    }

    console.log("[UserStream] Setting up live streaming event handlers");

    // Admin requests live video
    const handleRequestLiveVideo = (data) => {
      console.log("[UserStream] 📹 Live video request received:", data);
      const targetUserId = data?.targetUserId;
      
      if (!userId) {
        console.log("[UserStream] No userId, ignoring request");
        return;
      }
      
      // Don't show modal if already streaming or modal already showing (use refs to avoid stale closure)
      if (isStreamingRef.current || showRequestModalRef.current) {
        console.log("[UserStream] Already streaming or modal showing, ignoring request");
        return;
      }
      
      if (targetUserId === userId) {
        console.log("[UserStream] ✅ Request is for this user - showing modal");
        setShowRequestModal(true);
        setStreamError(null);
      }
    };

    // Admin joined and needs offer (reconnect scenario)
    const handleAdminReady = (data) => {
      const requestedRoom = data?.roomId;
      console.log("[UserStream] Admin ready event:", requestedRoom);
      if (requestedRoom === userId && isStreamingRef.current && peerRef.current) {
        console.log("[UserStream] Admin ready, sending new offer");
        renegotiate();
      }
    };

    // Receive answer from admin
    const handleAnswer = async (answer) => {
      console.log("[UserStream] Received answer from admin");
      if (!peerRef.current) {
        console.log("[UserStream] No peer connection, ignoring answer");
        return;
      }
      
      try {
        if (peerRef.current.signalingState === "have-local-offer") {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          console.log("[UserStream] Remote description set successfully");
          
          // Process queued ICE candidates
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("[UserStream] Processed queued ICE candidate");
          }
        } else {
          console.log("[UserStream] Unexpected signaling state:", peerRef.current.signalingState);
        }
      } catch (err) {
        console.error("[UserStream] Error setting answer:", err);
        setStreamError("Failed to connect to admin viewer.");
      }
    };

    // Receive ICE candidate from admin
    const handleIceCandidate = async (candidate) => {
      if (!peerRef.current) {
        iceCandidatesQueue.current.push(candidate);
        return;
      }
      
      try {
        if (peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          // Queue if remote description not set yet
          iceCandidatesQueue.current.push(candidate);
        }
      } catch (err) {
        console.error("[UserStream] ICE candidate error:", err);
      }
    };

    // Admin disconnected
    const handleAdminDisconnected = (data) => {
      const disconnectedRoom = data?.roomId;
      if (disconnectedRoom === userId && isStreamingRef.current) {
        console.log("[UserStream] Admin disconnected from viewing");
        setAdminViewing(false);
        // Don't stop streaming - admin might reconnect
      }
    };

    socket.on("request_live_video", handleRequestLiveVideo);
    socket.on("admin_ready", handleAdminReady);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("admin_disconnected", handleAdminDisconnected);

    return () => {
      socket.off("request_live_video", handleRequestLiveVideo);
      socket.off("admin_ready", handleAdminReady);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("admin_disconnected", handleAdminDisconnected);
    };
  }, [socket, userId, renegotiate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup(true);
  }, [cleanup]);

  // Set video srcObject when streaming starts (backup for when video element renders after state change)
  useEffect(() => {
    if (isStreaming && localStreamRef.current && videoRef.current) {
      console.log("[UserStream] useEffect: Setting video srcObject");
      videoRef.current.srcObject = localStreamRef.current;
      videoRef.current.play().catch(e => console.log("[UserStream] useEffect play error:", e));
    }
  }, [isStreaming]);

  // Debug log for connection status
  useEffect(() => {
    console.log("[UserStream] Status:", {
      socketConnected,
      userId,
      isRegistered,
      isStreaming,
      showRequestModal
    });
  }, [socketConnected, userId, isRegistered, isStreaming, showRequestModal]);

  return (
    <div className="user-live-stream">
      {/* Request Modal */}
      {showRequestModal && (
        <div className="stream-modal-overlay" onClick={(e) => e.target === e.currentTarget && rejectStreamRequest()}>
          <div className="stream-modal">
            <div className="stream-modal-icon">📹</div>
            <h2>Live Video Request</h2>
            <p>
              An emergency responder is requesting to view your live camera feed
              to better assist you during this emergency.
            </p>
            <div className="stream-modal-info">
              <span className="info-item">🔒 Secure Connection</span>
              <span className="info-item">👁️ Responders Only</span>
            </div>
            <div className="stream-modal-actions">
              <button className="stream-btn reject" onClick={rejectStreamRequest}>
                Decline
              </button>
              <button className="stream-btn accept" onClick={startLiveStream}>
                Accept & Share Video
              </button>
            </div>
            <p className="stream-modal-hint">
              You can stop sharing at any time by pressing the stop button.
            </p>
          </div>
        </div>
      )}

      {/* Streaming UI */}
      {isStreaming && (
        <div className="stream-active-panel">
          <div className="stream-header">
            <div className="stream-status">
              <span className={`status-dot ${connectionState}`}></span>
              <span className="status-text">
                {connectionState === "connecting" && "Connecting..."}
                {connectionState === "connected" && "Live - Sharing Video"}
                {connectionState === "failed" && "Connection Failed"}
                {connectionState === "idle" && "Initializing..."}
              </span>
            </div>
            {adminViewing && (
              <div className="admin-viewing-badge">
                👁️ Responder is watching
              </div>
            )}
          </div>

          <div className="stream-preview">
            <video
              ref={(el) => {
                videoRef.current = el;
                // Set srcObject immediately when video element mounts
                if (el && localStreamRef.current && !el.srcObject) {
                  console.log("[UserStream] Callback ref: Setting video srcObject");
                  el.srcObject = localStreamRef.current;
                  el.play().catch(e => console.log("[UserStream] Callback ref play error:", e));
                }
              }}
              autoPlay
              playsInline
              muted
              className="preview-video"
              style={{ minHeight: '180px', backgroundColor: '#111' }}
              onLoadedData={() => console.log("[UserStream] Video loaded data")}
              onCanPlay={() => console.log("[UserStream] Video can play")}
            />
            <div className="preview-overlay">
              <span className="live-badge">🔴 LIVE</span>
            </div>
          </div>

          {streamError && (
            <div className="stream-error">
              ⚠️ {streamError}
            </div>
          )}

          <button className="stream-btn stop" onClick={stopLiveStream}>
            Stop Sharing
          </button>
        </div>
      )}

      {/* Connection Status Indicator (for debugging - can be hidden in production) */}
      {!isStreaming && !showRequestModal && (
        <div className={`connection-status ${isRegistered ? 'registered' : 'not-registered'}`}>
          {isRegistered ? '🟢' : '🟡'}
        </div>
      )}
    </div>
  );
};

export default UserLiveStream;
