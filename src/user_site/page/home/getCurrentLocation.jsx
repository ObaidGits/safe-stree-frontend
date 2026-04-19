/**
 * Get current location with fast fallback strategy
 * 1. First try low accuracy (fast, 3 seconds)
 * 2. If that fails, try high accuracy with longer timeout
 * This ensures SOS is sent quickly while still getting location
 */
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // Stage 1: Try fast, low accuracy first (3 seconds)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      () => {
        // Stage 2: If fast fails, try with high accuracy and longer timeout
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            });
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 30000 // Accept 30 second old cached position
          }
        );
      },
      {
        enableHighAccuracy: false, // Use network/wifi for speed
        timeout: 3000, // Fast timeout
        maximumAge: 60000 // Accept 1 minute old cached position for emergency
      }
    );
  });
}

export default getCurrentLocation;