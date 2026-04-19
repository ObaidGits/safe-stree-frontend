import { commonrequest } from "./ApiCall";

// Default config for JSON requests with credentials
const JSON_CONFIG = {
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
};

//<------------------------------------------- User Apis ------------------------------------------->
export const userSignUp = async (data, header) => {
  return await commonrequest("POST", `/api/v1/users/register`, data, header);
};

export const userLogin = async (data, header) => {
  return await commonrequest("POST", `/api/v1/users/login`, data, header);
};

// Silent option for auth checks (suppresses 401 console errors)
export const getUser = async (data, header, options = {}) => {
  return await commonrequest("POST", `/api/v1/users/current-user`, data, header, options);
};

export const userLogout = async (header = JSON_CONFIG) => {
  return await commonrequest("POST", `/api/v1/users/logout`, {}, header);
};

export const refreshUserToken = async (header = JSON_CONFIG) => {
  return await commonrequest("POST", `/api/v1/users/refresh-token`, {}, header);
};

export const updateUserProfile = async (formData) => {
  return await commonrequest("PUT", `/api/v1/users/update-profile`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
};

//<------------------------------------------- Admin Apis ------------------------------------------->
export const adminSignUp = async (data, header) => {
  return await commonrequest("POST", `/api/v1/admin/register`, data, header);
};

export const adminLogin = async (data, header) => {
  return await commonrequest("POST", `/api/v1/admin/login`, data, header);
};

export const adminLogout = async (header = JSON_CONFIG) => {
  return await commonrequest("POST", `/api/v1/admin/logout`, {}, header);
};

export const getAdmin = async (data, header, options = {}) => {
  return await commonrequest("POST", `/api/v1/admin/current-admin`, data, header, options);
};

//<------------------------------------------- Admin Management Apis ------------------------------------------->
export const fetchManagementOverview = async (header = JSON_CONFIG) => {
  return await commonrequest("GET", `/api/v1/admin/management/overview`, null, header);
};

export const fetchManagedUsers = async (params = {}, header = JSON_CONFIG) => {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = String(value);
      }
      return acc;
    }, {})
  ).toString();

  return await commonrequest(
    "GET",
    `/api/v1/admin/management/users${query ? `?${query}` : ""}`,
    null,
    header
  );
};

export const updateManagedUser = async (userId, data, header = JSON_CONFIG) => {
  const config = data instanceof FormData ? { headers: {} } : header;
  return await commonrequest("PATCH", `/api/v1/admin/management/users/${userId}`, data, config);
};

export const updateManagedUserStatus = async (userId, isActive, header = JSON_CONFIG) => {
  return await commonrequest(
    "PATCH",
    `/api/v1/admin/management/users/${userId}/status`,
    { isActive },
    header
  );
};

export const fetchManagedAdmins = async (params = {}, header = JSON_CONFIG) => {
  const query = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = String(value);
      }
      return acc;
    }, {})
  ).toString();

  return await commonrequest(
    "GET",
    `/api/v1/admin/management/admins${query ? `?${query}` : ""}`,
    null,
    header
  );
};

export const createManagedAdmin = async (data, header = JSON_CONFIG) => {
  return await commonrequest("POST", `/api/v1/admin/management/admins`, data, header);
};

export const updateManagedAdmin = async (adminId, data, header = JSON_CONFIG) => {
  return await commonrequest("PATCH", `/api/v1/admin/management/admins/${adminId}`, data, header);
};

export const updateManagedAdminStatus = async (adminId, isActive, header = JSON_CONFIG) => {
  return await commonrequest(
    "PATCH",
    `/api/v1/admin/management/admins/${adminId}/status`,
    { isActive },
    header
  );
};

//<------------------------------------------- WebSOS Apis ------------------------------------------->
export const sendSOSLocation = async (data, header) => {
  return await commonrequest("POST", `/api/v1/sos/`, data, header);
};

// FIXED: Changed POST to GET (backend route is GET)
export const fetchActiveWebAlerts = async (header = JSON_CONFIG) => {
  return await commonrequest("GET", `/api/v1/sos/active`, null, header);
};

// FIXED: Added proper auth header (route is protected)
export const fetchAllWebAlerts = async (header = JSON_CONFIG) => {
  return await commonrequest("GET", `/api/v1/sos/all-alerts`, null, header);
};

export const markWebSosResolved = async (alert_id, header = JSON_CONFIG) => {
  return await commonrequest("PUT", `/api/v1/sos/set-sos-resolved/${alert_id}`, {}, header);
};

//<------------------------------------------- cctvSOS Apis ------------------------------------------->
// FIXED: Changed POST to GET (backend route is GET)
export const fetchActiveCCTVAlerts = async (header = JSON_CONFIG) => {
  return await commonrequest("GET", `/api/v1/cctv/active`, null, header);
};

// FIXED: Added proper auth header (route is protected)
export const fetchAllCCTVAlerts = async (header = JSON_CONFIG) => {
  return await commonrequest("GET", `/api/v1/cctv/all-alerts`, null, header);
};

export const markCCTVSosResolved = async (alert_id, header = JSON_CONFIG) => {
  return await commonrequest("PUT", `/api/v1/cctv/set-sos-resolved/${alert_id}`, {}, header);
};