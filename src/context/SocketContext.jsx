import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken, user, admin, isAuthenticated } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const socketUrl = import.meta.env.VITE_WS_URL || window.location.origin;

  useEffect(() => {
    // Create socket connection with auth token if available
    const socketInstance = io(socketUrl, {
      transports: ["websocket"],
      auth: {
        token: accessToken || null,
      },
      // Reconnect settings
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on("connect", () => {
      console.log("🔌 Socket connected:", socketInstance.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;

      // Register user if authenticated
      if (user?._id) {
        socketInstance.emit("register_user", { userId: user._id });
      } else if (admin?._id) {
        socketInstance.emit("register_user", { userId: admin._id });
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      reconnectAttempts.current += 1;
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [accessToken, socketUrl]); // Reconnect when token or URL changes

  // Re-register user when auth state changes
  useEffect(() => {
    if (socket?.connected && isAuthenticated) {
      const userId = user?._id || admin?._id;
      if (userId) {
        socket.emit("register_user", { userId });
      }
    }
  }, [socket, user, admin, isAuthenticated]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
