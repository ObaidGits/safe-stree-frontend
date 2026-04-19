import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../../context/SocketContext";
import "./AdminLiveViewer.css";

/**
 * WebRTC Configuration with public STUN servers
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
 */
const setMediaBitrate = (sdp, mediaType, bitrate) => {
  const lines = sdp.split('\n');
  let mediaLineIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`m=${mediaType}`)) {
      mediaLineIndex = i;
      break;
    }
  }
  
  if (mediaLineIndex === -1) return sdp;
  
  let nextMediaIndex = lines.length;
  for (let i = mediaLineIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('m=')) {
      nextMediaIndex = i;
      break;
    }
  }
  
  let bLineIndex = -1;
  for (let i = mediaLineIndex; i < nextMediaIndex; i++) {
    if (lines[i].startsWith('b=AS:') || lines[i].startsWith('b=TIAS:')) {
      bLineIndex = i;
      break;
    }
  }
  
  const bLine = `b=AS:${bitrate}`;
  
  if (bLineIndex !== -1) {
    lines[bLineIndex] = bLine;
  } else {
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
 * Connection states for UI
 */
const CONNECTION_STATES = {
  CHECKING_ONLINE: "checking_online",
  USER_OFFLINE: "user_offline",
  WAITING: "waiting",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  REJECTED: "rejected",
  STOPPED: "stopped",
  DISCONNECTED: "disconnected",
  FAILED: "failed",
};

/**
 * AdminLiveViewer - View live video stream from a user
 * 
 * Flow:
 * 1. Admin opens this page (from AlertCard "View Live")
 * 2. Check if user is online
 * 3. If online, send request to user to start streaming
 * 4. User accepts -> receives WebRTC offer
 * 5. Admin creates answer -> connection established
 */
const AdminLiveViewer = () => {
  const { socket, isConnected: socketConnected } = useSocket();
  const { userId: roomId } = useParams();
  const navigate = useNavigate();

  // Refs
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const retryTimeoutRef = useRef(null);
  const requestTimeoutRef = useRef(null);
  const hasRequestedRef = useRef(false);
  const handleOfferRef = useRef(null);
  const requestLiveVideoRef = useRef(null);
  const cleanupRef = useRef(null);

  // State
  const [status, setStatus] = useState(CONNECTION_STATES.CHECKING_ONLINE);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isUserOnline, setIsUserOnline] = useState(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("[AdminViewer] Cleaning up...");

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    iceCandidatesQueue.current = [];
    hasRequestedRef.current = false;
  }, []);

  // Create peer connection for receiving stream
  const createPeerConnection = useCallback(() => {
    console.log("[AdminViewer] Creating peer connection...");

    const peer = new RTCPeerConnection(RTC_CONFIG);

    peer.ontrack = (event) => {
      console.log("[AdminViewer] Received track:", event.track.kind, "readyState:", event.track.readyState, "enabled:", event.track.enabled);
      console.log("[AdminViewer] Streams count:", event.streams.length);
      
      // Add track event listeners for debugging
      event.track.onmute = () => console.log("[AdminViewer] Track muted:", event.track.kind);
      event.track.onunmute = () => console.log("[AdminViewer] Track unmuted:", event.track.kind);
      event.track.onended = () => console.log("[AdminViewer] Track ended:", event.track.kind);
      
      if (videoRef.current) {
        // Use the first stream
        if (event.streams && event.streams[0]) {
          console.log("[AdminViewer] Setting video srcObject from streams[0]");
          console.log("[AdminViewer] Stream tracks:", event.streams[0].getTracks().map(t => ({kind: t.kind, readyState: t.readyState, enabled: t.enabled})));
          videoRef.current.srcObject = event.streams[0];
        } else {
          // Fallback: create a new MediaStream with the track
          console.log("[AdminViewer] No streams, creating MediaStream from track");
          if (!videoRef.current.srcObject) {
            videoRef.current.srcObject = new MediaStream();
          }
          videoRef.current.srcObject.addTrack(event.track);
        }
        
        // Force play the video (muted is set in JSX for autoplay policy)
        videoRef.current.play().then(() => {
          console.log("[AdminViewer] Video playback started, videoWidth:", videoRef.current.videoWidth, "videoHeight:", videoRef.current.videoHeight);
        }).catch(err => {
          console.error("[AdminViewer] Video play failed:", err);
        });
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log("[AdminViewer] ICE state:", peer.iceConnectionState);

      switch (peer.iceConnectionState) {
        case "checking":
          setStatus(CONNECTION_STATES.CONNECTING);
          break;
        case "connected":
        case "completed":
          setStatus(CONNECTION_STATES.CONNECTED);
          setError(null);
          break;
        case "disconnected":
          console.log("[AdminViewer] Connection disconnected, waiting for recovery...");
          break;
        case "failed":
          setStatus(CONNECTION_STATES.FAILED);
          setError("Connection failed. The user may have network issues.");
          if (peerRef.current) {
            peerRef.current.restartIce();
          }
          break;
        case "closed":
          if (status === CONNECTION_STATES.CONNECTED) {
            setStatus(CONNECTION_STATES.STOPPED);
          }
          break;
      }
    };

    return peer;
  }, [socket, roomId, status]);

  // Handle incoming offer from user
  const handleOffer = useCallback(async (offer) => {
    console.log("[AdminViewer] Received offer from user");
    console.log("[AdminViewer] Offer type:", offer?.type);
    console.log("[AdminViewer] Offer has video:", offer?.sdp?.includes('m=video'));
    console.log("[AdminViewer] Offer has audio:", offer?.sdp?.includes('m=audio'));

    try {
      // Close existing peer if any
      if (peerRef.current) {
        console.log("[AdminViewer] Closing existing peer connection");
        peerRef.current.close();
      }

      const peer = createPeerConnection();
      peerRef.current = peer;

      console.log("[AdminViewer] Setting remote description...");
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("[AdminViewer] Remote description set successfully");
      console.log("[AdminViewer] Transceivers:", peer.getTransceivers().map(t => ({ mid: t.mid, direction: t.direction, kind: t.receiver?.track?.kind })));

      // Process queued ICE candidates
      console.log("[AdminViewer] Processing", iceCandidatesQueue.current.length, "queued ICE candidates");
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }

      console.log("[AdminViewer] Creating answer...");
      const answer = await peer.createAnswer();
      
      // Modify SDP to support high bitrate
      let modifiedSdp = setMediaBitrate(answer.sdp, 'video', VIDEO_BITRATE_KBPS);
      modifiedSdp = setMediaBitrate(modifiedSdp, 'audio', 128);
      
      const modifiedAnswer = {
        type: answer.type,
        sdp: modifiedSdp
      };
      
      await peer.setLocalDescription(modifiedAnswer);

      socket.emit("answer", { roomId, answer: modifiedAnswer });
      console.log("[AdminViewer] Answer sent to user with modified bitrate");

      setStatus(CONNECTION_STATES.CONNECTING);

    } catch (err) {
      console.error("[AdminViewer] Error handling offer:", err);
      setError("Failed to establish connection: " + err.message);
      setStatus(CONNECTION_STATES.FAILED);
    }
  }, [socket, roomId, createPeerConnection]);

  // Request live video from user
  const requestLiveVideo = useCallback(() => {
    // Prevent duplicate requests
    if (hasRequestedRef.current) {
      console.log("[AdminViewer] Already requested, skipping");
      return;
    }
    
    if (!socket) {
      console.log("[AdminViewer] No socket available");
      setError("Connection to server lost. Please refresh the page.");
      setStatus(CONNECTION_STATES.FAILED);
      return;
    }
    
    if (!roomId || roomId === 'undefined') {
      console.log("[AdminViewer] Invalid roomId:", roomId);
      setError("Invalid user ID. Please go back and try again.");
      setStatus(CONNECTION_STATES.FAILED);
      return;
    }

    console.log("[AdminViewer] Requesting live video from user:", roomId);
    hasRequestedRef.current = true;
    setStatus(CONNECTION_STATES.WAITING);
    setError(null);

    // Join the room
    socket.emit("join-room", { roomId, role: "admin" });

    // Request live video
    socket.emit("request_live_video", { targetUserId: roomId });

    // Set timeout for response
    requestTimeoutRef.current = setTimeout(() => {
      if (status === CONNECTION_STATES.WAITING) {
        console.log("[AdminViewer] Request timed out");
        setError("Request timed out. User did not respond within 60 seconds.");
        setStatus(CONNECTION_STATES.FAILED);
        hasRequestedRef.current = false;
      }
    }, 60000);

  }, [socket, roomId, status]);

  // Retry connection
  const retryConnection = () => {
    setRetryCount(prev => prev + 1);
    cleanup();
    checkUserOnlineAndRequest();
  };

  // Check if user is online and then request
  const checkUserOnlineAndRequest = useCallback(() => {
    if (!socket || !roomId) return;
    
    console.log("[AdminViewer] Checking if user is online:", roomId);
    setStatus(CONNECTION_STATES.CHECKING_ONLINE);
    
    socket.emit("check_user_online", { userId: roomId });
  }, [socket, roomId]);

  // Exit viewer
  const handleExit = () => {
    cleanup();
    socket?.emit("admin_disconnected", { roomId });
    navigate("/admin/home");
  };

  // Keep refs updated with latest callbacks
  useEffect(() => {
    handleOfferRef.current = handleOffer;
    requestLiveVideoRef.current = requestLiveVideo;
    cleanupRef.current = cleanup;
  });

  // Initial check on mount
  useEffect(() => {
    if (!socket || !roomId) return;

    console.log("[AdminViewer] Initializing for room:", roomId);
    checkUserOnlineAndRequest();

  }, [socket, roomId, checkUserOnlineAndRequest]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    console.log("[AdminViewer] Setting up socket event handlers, socket id:", socket.id);

    // Debug: log all incoming events
    const onAnyEvent = (eventName) => {
      console.log("[AdminViewer] Socket event received:", eventName);
    };
    socket.onAny(onAnyEvent);

    // Handle user online status response
    const onUserOnlineStatus = ({ userId, online }) => {
      if (userId === roomId) {
        console.log("[AdminViewer] User online status:", online);
        setIsUserOnline(online);
        
        if (online) {
          requestLiveVideoRef.current?.();
        } else {
          hasRequestedRef.current = false;
          setStatus(CONNECTION_STATES.USER_OFFLINE);
          setError("This user is not currently connected to the app.");
        }
      }
    };

    // Handle user offline notification
    const onUserOffline = ({ userId, message }) => {
      if (userId === roomId) {
        console.log("[AdminViewer] User is offline:", message);
        setIsUserOnline(false);
        hasRequestedRef.current = false;
        setStatus(CONNECTION_STATES.USER_OFFLINE);
        setError(message || "User is not currently online");
      }
    };

    // Handle live request sent confirmation
    const onLiveRequestSent = ({ targetUserId, message }) => {
      if (targetUserId === roomId) {
        console.log("[AdminViewer] Live request sent confirmation:", message);
      }
    };

    // Handle offer from user - use ref to always get latest handler
    const onOffer = (offer) => {
      console.log("[AdminViewer] 📥 RAW OFFER EVENT RECEIVED");
      handleOfferRef.current?.(offer);
    };

    // Handle ICE candidates
    const onIceCandidate = async (candidate) => {
      if (!peerRef.current) {
        iceCandidatesQueue.current.push(candidate);
        return;
      }

      try {
        if (peerRef.current.remoteDescription) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceCandidatesQueue.current.push(candidate);
        }
      } catch (err) {
        console.error("[AdminViewer] ICE error:", err);
      }
    };

    // User accepted the request
    const onStreamAccepted = ({ userId }) => {
      if (userId === roomId) {
        console.log("[AdminViewer] User accepted stream request");
        setStatus(CONNECTION_STATES.CONNECTING);
        if (requestTimeoutRef.current) {
          clearTimeout(requestTimeoutRef.current);
          requestTimeoutRef.current = null;
        }
      }
    };

    // User rejected the request
    const onStreamRejected = ({ userId }) => {
      if (userId === roomId) {
        console.log("[AdminViewer] User rejected stream request");
        setStatus(CONNECTION_STATES.REJECTED);
        setError("User declined the video streaming request.");
        cleanupRef.current?.();
      }
    };

    // User stopped streaming
    const onStreamStopped = ({ userId, reason }) => {
      if (userId === roomId) {
        console.log("[AdminViewer] User stopped streaming:", reason);
        setStatus(CONNECTION_STATES.STOPPED);
        setError(reason || "User stopped the video stream.");
        cleanupRef.current?.();
      }
    };

    // User disconnected
    const onUserDisconnected = ({ userId, reason }) => {
      if (userId === roomId) {
        console.log("[AdminViewer] User disconnected:", reason);
        setStatus(CONNECTION_STATES.DISCONNECTED);
        setError("User has disconnected from the app.");
        setIsUserOnline(false);
        cleanupRef.current?.();
      }
    };

    // Live stream error
    const onLiveStreamError = ({ error: errMsg, code }) => {
      console.error("[AdminViewer] Live stream error:", errMsg, code);
      setError(errMsg);
      setStatus(CONNECTION_STATES.FAILED);
    };

    socket.on("user_online_status", onUserOnlineStatus);
    socket.on("user_offline", onUserOffline);
    socket.on("live_request_sent", onLiveRequestSent);
    socket.on("offer", onOffer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("live_stream_accepted", onStreamAccepted);
    socket.on("live_stream_rejected", onStreamRejected);
    socket.on("live_stream_stopped", onStreamStopped);
    socket.on("live_stream_user_disconnected", onUserDisconnected);
    socket.on("live_stream_error", onLiveStreamError);

    console.log("[AdminViewer] ✅ All socket listeners registered, including 'offer'");

    return () => {
      socket.offAny(onAnyEvent);
      socket.off("user_online_status", onUserOnlineStatus);
      socket.off("user_offline", onUserOffline);
      socket.off("live_request_sent", onLiveRequestSent);
      socket.off("offer", onOffer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("live_stream_accepted", onStreamAccepted);
      socket.off("live_stream_rejected", onStreamRejected);
      socket.off("live_stream_stopped", onStreamStopped);
      socket.off("live_stream_user_disconnected", onUserDisconnected);
      socket.off("live_stream_error", onLiveStreamError);
      cleanupRef.current?.();
    };
  }, [socket, roomId]); // Removed callback dependencies - using refs instead

  // Render status indicator
  const renderStatusBadge = () => {
    switch (status) {
      case CONNECTION_STATES.CHECKING_ONLINE:
        return <span className="status-badge checking">🔍 Checking User Status...</span>;
      case CONNECTION_STATES.USER_OFFLINE:
        return <span className="status-badge offline">📵 User Offline</span>;
      case CONNECTION_STATES.WAITING:
        return <span className="status-badge waiting">📡 Requesting Stream...</span>;
      case CONNECTION_STATES.CONNECTING:
        return <span className="status-badge connecting">🔄 Connecting...</span>;
      case CONNECTION_STATES.CONNECTED:
        return <span className="status-badge connected">🔴 Live Stream Active</span>;
      case CONNECTION_STATES.REJECTED:
        return <span className="status-badge rejected">❌ Request Declined</span>;
      case CONNECTION_STATES.STOPPED:
        return <span className="status-badge stopped">⏹️ User Stopped Streaming</span>;
      case CONNECTION_STATES.DISCONNECTED:
        return <span className="status-badge disconnected">📴 User Disconnected</span>;
      case CONNECTION_STATES.FAILED:
        return <span className="status-badge failed">⚠️ Connection Failed</span>;
      default:
        return null;
    }
  };

  // Get error state icon
  const getErrorIcon = () => {
    switch (status) {
      case CONNECTION_STATES.USER_OFFLINE:
        return "📵";
      case CONNECTION_STATES.REJECTED:
        return "🚫";
      case CONNECTION_STATES.STOPPED:
        return "⏹️";
      case CONNECTION_STATES.DISCONNECTED:
        return "📴";
      case CONNECTION_STATES.FAILED:
        return "⚠️";
      default:
        return "❌";
    }
  };

  // Get error state title
  const getErrorTitle = () => {
    switch (status) {
      case CONNECTION_STATES.USER_OFFLINE:
        return "User is Offline";
      case CONNECTION_STATES.REJECTED:
        return "Request Declined";
      case CONNECTION_STATES.STOPPED:
        return "Stream Ended";
      case CONNECTION_STATES.DISCONNECTED:
        return "User Disconnected";
      case CONNECTION_STATES.FAILED:
        return "Connection Failed";
      default:
        return "Error";
    }
  };

  const showErrorState = [
    CONNECTION_STATES.USER_OFFLINE,
    CONNECTION_STATES.REJECTED,
    CONNECTION_STATES.STOPPED,
    CONNECTION_STATES.DISCONNECTED,
    CONNECTION_STATES.FAILED,
  ].includes(status);

  return (
    <div className="admin-live-viewer">
      {/* Header */}
      <div className="viewer-header">
        <button className="exit-btn" onClick={handleExit}>
          ← Back to Dashboard
        </button>
        <div className="viewer-title">
          <h1>Live Stream Viewer</h1>
          <span className="room-id">User: {roomId?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className="status-container">
        {renderStatusBadge()}
        {isUserOnline !== null && (
          <span className={`online-indicator ${isUserOnline ? 'online' : 'offline'}`}>
            {isUserOnline ? '🟢 User Online' : '🔴 User Offline'}
          </span>
        )}
      </div>

      {/* Video Container */}
      <div className="video-container">
        {status === CONNECTION_STATES.CHECKING_ONLINE && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Checking if user is online...</p>
          </div>
        )}

        {status === CONNECTION_STATES.WAITING && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Waiting for user to accept...</p>
            <p className="hint">The user will see a popup to accept your request.</p>
          </div>
        )}

        {status === CONNECTION_STATES.CONNECTING && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Establishing connection...</p>
            <p className="hint">User has accepted. Setting up video stream...</p>
          </div>
        )}

        {showErrorState && (
          <div className="error-state">
            <div className="error-icon">{getErrorIcon()}</div>
            <p className="error-title">{getErrorTitle()}</p>
            {error && <p className="error-message">{error}</p>}
            
            {status === CONNECTION_STATES.USER_OFFLINE ? (
              <div className="action-buttons">
                <button className="retry-btn" onClick={checkUserOnlineAndRequest}>
                  🔄 Check Again
                </button>
                <button className="back-btn" onClick={handleExit}>
                  ← Go Back
                </button>
              </div>
            ) : (
              <button className="retry-btn" onClick={retryConnection}>
                🔄 Try Again ({retryCount > 0 ? `Attempt ${retryCount + 1}` : 'Retry'})
              </button>
            )}
          </div>
        )}

        {/* Video element - always present, muted for autoplay support */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          controls={status === CONNECTION_STATES.CONNECTED}
          onLoadedMetadata={() => console.log("[AdminViewer] Video metadata loaded")}
          onCanPlay={() => console.log("[AdminViewer] Video can play")}
          onPlay={() => {
            console.log("[AdminViewer] Video playing");
            setStatus(CONNECTION_STATES.CONNECTED);
          }}
          onError={(e) => console.error("[AdminViewer] Video error:", e)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#000',
            opacity: status === CONNECTION_STATES.CONNECTED ? 1 : 0,
            zIndex: status === CONNECTION_STATES.CONNECTED ? 1 : -1,
            transition: 'opacity 0.3s ease'
          }}
        />

        {status === CONNECTION_STATES.CONNECTED && (
          <div className="video-overlay">
            <span className="live-indicator">🔴 LIVE</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="viewer-footer">
        {status === CONNECTION_STATES.CONNECTED && (
          <p className="footer-text">
            Viewing live stream from user. The user can stop sharing at any time.
          </p>
        )}
        {!socketConnected && (
          <p className="connection-warning">
            ⚠️ Connection to server lost. Trying to reconnect...
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminLiveViewer;
