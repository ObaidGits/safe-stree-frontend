let watchId = null;

function startContinuousTracking() {
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      // Send updated location to server
      sendLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString()
      });
    },
    (error) => {
      console.error('Tracking error:', error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );
}

function stopContinuousTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}