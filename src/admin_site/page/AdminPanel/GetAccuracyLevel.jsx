export function getAccuracyLevel(accuracyInMeters) {
    if (accuracyInMeters <= 50) {
      return 'High';     // GPS-level accuracy (good for precise location)
    } else if (accuracyInMeters <= 500) {
      return 'Medium';   // WiFi/cell tower triangulation (neighborhood level)
    } else {
      return 'Low';      // IP-based or very poor GPS (city-level or worse)
    }
  }