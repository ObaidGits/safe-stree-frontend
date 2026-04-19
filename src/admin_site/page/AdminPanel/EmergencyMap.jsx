import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const EmergencyMap = ({ alertCoords }) => {
  const [policeStationCoords, setPoliceStationCoords] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  const orsApiKey =
    import.meta.env.VITE_ORS_API_KEY || '5b3ce3597851110001cf6248faeaa86e3ffb46ce97252e71ddeb6afa';

  // Function to get nearest police station using Overpass API
  const fetchNearestPoliceStation = async (lat, lng) => {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const radius = 5000; // meters

    const query = `
      [out:json];
      (
        node["amenity"="police"](around:${radius},${lat},${lng});
        way["amenity"="police"](around:${radius},${lat},${lng});
        relation["amenity"="police"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    try {
      const res = await axios.post(overpassUrl, query, {
        headers: { 'Content-Type': 'text/plain' },
      });

      const elements = res.data.elements;

      if (elements.length === 0) {
        console.warn('❌ No police stations found nearby.');
        return null;
      }

      // Use first result (nearest)
      const nearest = elements[0];
      const coords = nearest.type === 'node'
        ? { lat: nearest.lat, lng: nearest.lon }
        : { lat: nearest.center.lat, lng: nearest.center.lon };

      return coords;
    } catch (err) {
      console.error('Overpass API error:', err);
      return null;
    }
  };

  // Route calculation
  useEffect(() => {
    const fetchRoute = async () => {
      if (!alertCoords) return;

      const nearestStation = await fetchNearestPoliceStation(alertCoords.lat, alertCoords.lng);
      if (!nearestStation) return;

      setPoliceStationCoords(nearestStation);

      try {
        const response = await axios.post(
          'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
          {
            coordinates: [
              [nearestStation.lng, nearestStation.lat],
              [alertCoords.lng, alertCoords.lat]
            ]
          },
          {
            headers: {
              Authorization: orsApiKey,
              'Content-Type': 'application/json'
            }
          }
        );

        const route = response.data.features[0];
        const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
        setRouteCoords(coords);

        const distInKm = (route.properties.summary.distance / 1000).toFixed(2);
        const timeInMin = Math.round(route.properties.summary.duration / 60);
        setDistance(`${distInKm} km`);
        setDuration(`${timeInMin} min`);
      } catch (err) {
        console.error('❌ Error fetching route:', err);
      }
    };

    fetchRoute();
  }, [alertCoords]);

  // Auto-fit map to route
  const FitBounds = () => {
    const map = useMap();

    useEffect(() => {
      if (routeCoords.length > 0) {
        const bounds = L.latLngBounds(routeCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [routeCoords, map]);

    return null;
  };

  const centerPosition = alertCoords || { lat: 28.6139, lng: 77.2090 }; // fallback to Delhi

  return (
    <div className="emergency-map">
      <div className="emergency-map-stats">
        <p>
          <strong>Distance</strong>
          <span>{distance || 'Pending route...'}</span>
        </p>
        <p>
          <strong>ETA</strong>
          <span>{duration || 'Calculating...'}</span>
        </p>
      </div>

      <div className="emergency-map-canvas">
        <MapContainer center={centerPosition} zoom={13} className="emergency-map-leaflet">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {policeStationCoords && (
            <Marker position={[policeStationCoords.lat, policeStationCoords.lng]}>
              <Popup>Nearest Police Station</Popup>
            </Marker>
          )}

          {alertCoords && (
            <Marker position={[alertCoords.lat, alertCoords.lng]}>
              <Popup>SOS Alert Location</Popup>
            </Marker>
          )}

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} color="red" />
          )}

          <FitBounds />
        </MapContainer>
      </div>
    </div>
  );
};

export default EmergencyMap;
