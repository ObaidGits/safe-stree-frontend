import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getUser, getAdmin, refreshUserToken } from "../services/Apis";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider manages authentication state across the app
 * Stores accessToken in memory (not localStorage for security)
 * Token is also stored in httpOnly cookies by the server
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authType, setAuthType] = useState(null); // 'user' or 'admin'

  // Standard config for requests - memoized to avoid dependency issues
  const config = useMemo(() => ({
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  }), []);

  /**
   * Check if user is authenticated on app load
   * Tries to fetch current user/admin using cookies
   * Uses silent mode to avoid console errors for expected 401 responses
   */
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    
    // Try user first (silently - don't log 401 errors)
    const userRes = await getUser({}, config, { silent: true });
    if (userRes?.status === 200 && userRes?.data?.data) {
      setUser(userRes.data.data);
      setAuthType("user");
      if (userRes.data.data.accessToken) {
        setAccessToken(userRes.data.data.accessToken);
      }
      setIsLoading(false);
      return;
    }

    // Try admin (silently - don't log 401 errors)
    const adminRes = await getAdmin({}, config, { silent: true });
    if (adminRes?.status === 200 && adminRes?.data?.data) {
      setAdmin(adminRes.data.data);
      setAuthType("admin");
      if (adminRes.data.data.accessToken) {
        setAccessToken(adminRes.data.data.accessToken);
      }
      setIsLoading(false);
      return;
    }

    // No valid session
    setUser(null);
    setAdmin(null);
    setAccessToken(null);
    setAuthType(null);
    setIsLoading(false);
  }, [config]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Login handler - called after successful login API response
   * @param {Object} userData - User/Admin data from login response
   * @param {string} token - Access token from login response
   * @param {"user"|"admin"} type - Type of authentication
   */
  const login = (userData, token, type = "user") => {
    if (type === "admin") {
      setAdmin(userData);
      setUser(null);
    } else {
      setUser(userData);
      setAdmin(null);
    }
    setAccessToken(token);
    setAuthType(type);
  };

  /**
   * Logout handler - clears local state
   * Server will clear cookies on logout API call
   */
  const logout = () => {
    setUser(null);
    setAdmin(null);
    setAccessToken(null);
    setAuthType(null);
  };

  /**
   * Refresh access token
   */
  const refreshToken = async () => {
    try {
      const res = await refreshUserToken(config);
      if (res?.status === 200 && res?.data?.data?.accessToken) {
        setAccessToken(res.data.data.accessToken);
        return res.data.data.accessToken;
      }
    } catch (e) {
      console.error("Token refresh failed:", e);
      logout();
    }
    return null;
  };

  const value = {
    user,
    admin,
    accessToken,
    isLoading,
    authType,
    isAuthenticated: !!(user || admin),
    isUser: !!user,
    isAdmin: !!admin,
    login,
    logout,
    refreshToken,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
