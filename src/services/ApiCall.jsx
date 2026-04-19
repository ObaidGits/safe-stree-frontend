import axios from "axios";

let accessTokenProvider = null;

export const setAccessTokenProvider = (provider) => {
  accessTokenProvider = typeof provider === "function" ? provider : null;
};

const getAccessToken = () => {
  try {
    return accessTokenProvider ? accessTokenProvider() : null;
  } catch {
    return null;
  }
};

export const commonrequest = async (methods, url, body, header, options = {}) => {
  const baseUrl = import.meta.env.VITE_WS_URL || "http://localhost:8000";
  const { silent = false } = options; // silent mode suppresses error logging

  let configHeaders = {
    "Content-Type": "application/json",
  };

  const isFormData = body instanceof FormData;
  if (isFormData) {
    delete configHeaders["Content-Type"]; // browser sets correct multipart boundary
  }

  // ---- FIXED MERGE LOGIC ----
  if (header && typeof header === "object") {
    const normalized =
      header.headers && typeof header.headers === "object"
        ? header.headers
        : header;

    configHeaders = {
      ...configHeaders,
      ...normalized,
    };
  }

  const accessToken = getAccessToken();
  if (accessToken && !configHeaders.Authorization && !configHeaders.authorization) {
    configHeaders.Authorization = `Bearer ${accessToken}`;
  }
  // ---------------------------

  const config = {
    method: methods,
    url: `${baseUrl}${url}`,
    headers: configHeaders,
    data: body,
    withCredentials: true,
  };

  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    // Only log errors if not in silent mode (silent used for auth checks)
    if (!silent) {
      console.error("API Request Error:", {
        url: config.url,
        method: config.method,
        error: error.response?.data || error.message,
        status: error.response?.status,
        headersSent: config.headers,
      });
    }

    return {
      data:
        error.response?.data || {
          success: false,
          message: error.message || "Network error",
        },
      status: error.response?.status || 500,
      headers: error.response?.headers || {},
      config,
    };
  }
};

// Specialized function for file uploads (FormData)
export const commonrequestWithFile = async (
  methods,
  url,
  formData,
  customHeaders = {}
) => {
  const baseUrl = import.meta.env.VITE_WS_URL || "http://localhost:8000";

  const accessToken = getAccessToken();
  const mergedHeaders = {
    ...customHeaders,
  };

  if (accessToken && !mergedHeaders.Authorization && !mergedHeaders.authorization) {
    mergedHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const config = {
    method: methods,
    url: `${baseUrl}${url}`,
    headers: mergedHeaders,
    data: formData,
    withCredentials: true,
  };

  delete config.headers["Content-Type"];

  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    console.error("File Upload Error:", {
      url: config.url,
      method: config.method,
      error: error.response?.data || error.message,
    });
    return (
      error.response || {
        data: { success: false, message: error.message },
      }
    );
  }
};
