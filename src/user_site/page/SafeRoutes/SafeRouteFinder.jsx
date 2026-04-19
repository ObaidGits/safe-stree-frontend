import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Center of Delhi by default
const defaultCenter = [28.6448, 77.216721];
const safeRouteApiUrl = import.meta.env.VITE_SAFE_ROUTE_API || "http://localhost:5000/safest-route";

// Custom component to fit map bounds to the route
const FitBounds = ({ route }) => {
  const map = useMap();

  useEffect(() => {
    if (route.length > 1) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);

  return null;
};

export default function SafeRouteFinder() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [route, setRoute] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Optional: Convert place name to lat/lng using Nominatim
  const geocode = async (placeName) => {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        format: "json",
        q: placeName,
        limit: 1,
      },
      timeout: 10000,
    });

    if (res.data && res.data.length > 0) {
      const { lat, lon } = res.data[0];
      return [parseFloat(lat), parseFloat(lon)];
    }
    throw new Error("Place not found");
  };

  const handleGetSafeRoute = async () => {
    const normalizedStart = start.trim();
    const normalizedEnd = end.trim();

    if (!normalizedStart || !normalizedEnd) {
      setError("Please enter both source and destination locations.");
      return;
    }

    setError(null);
    setRoute([]);
    setLoading(true);

    try {
      const startCoords = await geocode(normalizedStart);
      const endCoords = await geocode(normalizedEnd);

      const res = await axios.post(safeRouteApiUrl, {
        start: startCoords,
        end: endCoords,
      }, {
        timeout: 15000,
      });

      const path = res.data.route;

      if (Array.isArray(path) && path.length >= 2) {
        setRoute(path);
      } else {
        setError("No safe path found between selected locations.");
      }
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || "Failed to fetch route. Please check locations or try again.");
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Safest Path Finder</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder="Enter source location"
          className="border p-2 rounded w-1/2"
        />
        <input
          type="text"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          placeholder="Enter destination location"
          className="border p-2 rounded w-1/2"
        />
        <button
          onClick={handleGetSafeRoute}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Loading..." : "Get Safe Route"}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-[500px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {route.length > 0 && (
          <>
            <FitBounds route={route} />
            <Polyline positions={route} color="green" />

            <Marker
              position={route[0]}
              icon={L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [30, 30],
              })}
            >
              <Popup>Start</Popup>
            </Marker>

            <Marker
              position={route[route.length - 1]}
              icon={L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
                iconSize: [30, 30],
              })}
            >
              <Popup>End</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
