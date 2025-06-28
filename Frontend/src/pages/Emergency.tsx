import React, { useState, useEffect, useRef } from 'react';
// Import Leaflet components and CSS, including GeoJSON for routes
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import './Emergency.css';

// Fix for default Leaflet marker icons not showing in Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', // Default red/orange for hospitals
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
});


// Define a type for your emergency locations
interface EmergencyLocation {
  id: number;
  lat: number;
  lng: number;
  name: string;
  address: string;
  phone: string;
  type: string;
}

// Initial hardcoded facilities (as a fallback or for areas Overpass might miss/slowly load)
const INITIAL_EMERGENCY_FACILITIES: EmergencyLocation[] = [
  // Keeping a robust set of major hospitals as a fallback
  { id: 1, lat: 10.3157, lng: 123.8854, name: 'Cebu Doctors\' University Hospital', address: 'Osmeña Blvd, Cebu City', phone: '(032) 255 5555', type: 'hospital' },
  { id: 2, lat: 10.3344, lng: 123.9056, name: 'Perpetual Succour Hospital', address: 'Gorordo Ave, Cebu City', phone: '(032) 233 8620', type: 'hospital' },
  { id: 3, lat: 10.3015, lng: 123.8967, name: 'Vicente Sotto Memorial Medical Center', address: 'B. Rodriguez St, Cebu City', phone: '(032) 253 9891', type: 'hospital' },
  { id: 4, lat: 10.3000, lng: 123.8800, name: 'Chong Hua Hospital (Cebu City)', address: 'Don Mariano Cui St, Cebu City', phone: '(032) 255 8000', type: 'hospital' },
  { id: 40, lat: 10.2500, lng: 123.8400, name: 'Cebu South Medical Center (Talisay District Hospital)', address: 'San Isidro, Talisay City', phone: '(032) 273 3713', type: 'hospital' },
  { id: 60, lat: 10.4000, lng: 123.9800, name: 'Mendero Medical Center, Inc.', address: 'Poblacion, Consolacion', phone: '(032) 423 3333', type: 'hospital' },
  { id: 70, lat: 10.5200, lng: 124.0400, name: 'Danao District Hospital', address: 'Poblacion, Danao City', phone: '(032) 200 3300', type: 'hospital' },
  // ... you can add more critical hardcoded hospitals here for robustness ...
];

// Helper function to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};


// OpenRouteService API Key (REPLACE WITH YOUR ACTUAL KEY!)
const ORS_API_KEY = '5b3ce3597851110001cf6248550434e639e24cdfaca90049a9b5e306'; // <-- REMEMBER TO REPLACE THIS!


// Sub-component to manage map interactions and dynamic markers.
const LocationMarker: React.FC<{
  onClosestFacilityFound: (facility: EmergencyLocation | null, error?: string) => void;
  onDynamicFacilitiesLoaded: (facilities: EmergencyLocation[]) => void;
  onRouteLoaded: (routeGeoJson: any | null) => void;
  panToUser: boolean;
}> = ({ onClosestFacilityFound, onDynamicFacilitiesLoaded, onRouteLoaded, panToUser }) => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<L.LatLngExpression | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // User icon set to green for clear distinction
  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Function to fetch ONLY hospitals from Overpass API
  const fetchFacilitiesFromOverpass = async (centerLat: number, centerLng: number, radiusKm: number = 50) => {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const query = `
      [out:json];
      (
        node(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[amenity=hospital];
        node(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[healthcare=hospital];
        way(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[amenity=hospital];
        way(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[healthcare=hospital];
      );
      out body;
      >;
      out skel qt;
    `;

    try {
      const response = await fetch(overpassUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedFacilities: EmergencyLocation[] = data.elements
        .filter((el: any) => el.lat && el.lon && el.tags && el.tags.name)
        .map((el: any, index: number) => ({
          id: el.id || index,
          lat: el.lat,
          lng: el.lon,
          name: el.tags.name,
          address: el.tags['addr:full'] || el.tags['addr:street'] || el.tags['addr:housenumber'] || 'Address not available',
          phone: el.tags.phone || 'N/A',
          type: 'hospital'
        }));
      
      onDynamicFacilitiesLoaded(fetchedFacilities);
      return fetchedFacilities;

    } catch (error) {
      console.error("Failed to fetch hospitals from Overpass API:", error);
      setLocationError("Could not load nearby hospitals. Data might be unavailable or network issue.");
      onDynamicFacilitiesLoaded([]);
      return [];
    }
  };

  // Function to fetch route from ORS API
  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    if (!ORS_API_KEY || ORS_API_KEY === '5b3ce3597851110001cf6248550434e639e24cdfaca90049a9b5e306') {
      console.error("ERROR: OpenRouteService API Key is NOT set or is default. Cannot fetch route.");
      onRouteLoaded(null);
      return;
    }

    const routeUrl = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
    const body = {
      coordinates: [
        [startLng, startLat], // ORS API expects coordinates as [longitude, latitude]
        [endLng, endLat]     
      ]
    };

    try {
      const response = await fetch(routeUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, application/zipped-pbf, application/json',
          'Content-Type': 'application/json',
          'Authorization': ORS_API_KEY
        },
        body: JSON.stringify(body)
      });

      // --- CRITICAL DEBUGGING POINT 1: Check HTTP response status ---
      if (!response.ok) {
        const errorData = await response.json();
        console.error("ORS API Request Failed (HTTP Error):", response.status, response.statusText, errorData);
        throw new Error(`ORS API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      // --- CRITICAL DEBUGGING POINT 2: Log the full ORS response data ---
      console.log("ORS Route response (raw data):", data); 

      if (data.features && data.features.length > 0) {
          // Check if the feature is indeed a LineString
          if (data.features[0].geometry && data.features[0].geometry.type === 'LineString') {
            // --- CRITICAL DEBUGGING POINT 3: Log the specific GeoJSON feature being passed ---
            console.log("ORS Route GeoJSON feature being passed:", data.features[0]);
            onRouteLoaded(data.features[0]); // Pass the GeoJSON feature (the route) to parent
          } else {
            console.warn("ORS API returned feature, but it's not a LineString geometry:", data.features[0]);
            onRouteLoaded(null); // Clear route if geometry type is unexpected
          }
      } else {
          console.warn("ORS API returned no route features for the given coordinates. Check coordinates or network.");
          onRouteLoaded(null); // Clear route if no features found
      }
    } catch (error) {
      console.error("Failed to fetch route from ORS API (Catch Block):", error);
      setLocationError("Could not calculate route. Please check your API key, coordinates, or try again later.");
      onRouteLoaded(null); // Clear route on error
    }
  };


  const successCallback = async (position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const currentUserLoc: L.LatLngExpression = [lat, lng];
    setUserLocation(currentUserLoc);
    setLocationError(null);

    if (map && panToUser) {
      map.flyTo(currentUserLoc, 14); // flyTo for smooth animation
    }

    const dynamicHospitals = await fetchFacilitiesFromOverpass(lat, lng, 50);

    const allFacilities = [
      ...INITIAL_EMERGENCY_FACILITIES.filter(f => f.type === 'hospital'),
      ...dynamicHospitals
    ];

    let closestFacility: EmergencyLocation | null = null;
    let minDistance = Infinity;

    allFacilities.forEach(facility => {
      const distance = calculateDistance(
        lat, lng,
        facility.lat, facility.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestFacility = facility;
      }
    });

    if (closestFacility && minDistance < 50) {
      onClosestFacilityFound(closestFacility);
      
      const confirmedClosestFacility: EmergencyLocation = closestFacility; // TypeScript fix

      if (ORS_API_KEY !== '5b3ce3597851110001cf6248550434e639e24cdfaca90049a9b5e306') {
        // Log coordinates sent to ORS for debugging
        console.log(`Attempting to fetch route from [${lng}, ${lat}] to [${confirmedClosestFacility.lng}, ${confirmedClosestFacility.lat}]`);
        await fetchRoute(lat, lng, confirmedClosestFacility.lat, confirmedClosestFacility.lng); 
      } else {
        onRouteLoaded(null);
        console.warn("ORS API key is not configured, skipping route fetch.");
      }
    } else {
      onClosestFacilityFound(null, "No hospitals detected nearby (within 50 km).");
      onRouteLoaded(null); // Clear any previous route if no hospital found
    }
  };

  const errorCallback = (posError: GeolocationPositionError) => {
    console.error("Error getting user location:", posError);
    let errorMessage = "Could not retrieve your location. Please ensure location services are enabled.";
    if (posError.code === posError.PERMISSION_DENIED) {
      errorMessage = "Location permission denied. Please allow location access in your browser settings.";
    } else if (posError.code === posError.POSITION_UNAVAILABLE) {
      errorMessage = "Location information is unavailable.";
    } else if (posError.code === posError.TIMEOUT) {
      errorMessage = "The request to get user location timed out.";
    }
    setLocationError(errorMessage);
    onClosestFacilityFound(null, errorMessage);
    onRouteLoaded(null); // Clear any previous route on location error
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported by your browser.";
      setLocationError(msg);
      onClosestFacilityFound(null, msg);
      onRouteLoaded(null);
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [map, panToUser, ORS_API_KEY]);

  const handleManualUpdate = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(successCallback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  };

  return (
    <>
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>Your Current Location</Popup>
        </Marker>
      )}
      <div className="location-control-panel">
        <button className="location-button" onClick={handleManualUpdate}>
          <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Update My Location
        </button>
        {locationError && <p className="location-error-message">{locationError}</p>}
      </div>
    </>
  );
};


const Emergency: React.FC = () => {
  const [closestFacility, setClosestFacility] = useState<EmergencyLocation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dynamicFacilities, setDynamicFacilities] = useState<EmergencyLocation[]>([]);
  // --- TEMPORARY: Hardcoded test route for GeoJSON component ---
  // This route is from Cebu Doctors' to Vicente Sotto, hardcoded to test if GeoJSON component renders.
  // REMOVE OR COMMENT OUT THIS SECTION AFTER DEBUGGING!
  const [routeGeoJson, setRouteGeoJson] = useState<any | null>(
    // This is a simplified GeoJSON LineString. If this displays, ORS fetching is the problem.
    // If this does NOT display, the GeoJSON component or its style is the problem.
    // Example coordinates (long, lat) for a simple path in Cebu City
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [123.8854, 10.3157], // Cebu Doctors (lng, lat)
          [123.8870, 10.3120],
          [123.8885, 10.3080],
          [123.8900, 10.3050],
          [123.8967, 10.3015]  // Vicente Sotto (lng, lat)
        ]
      }
    }
  );

  const handleClosestFacilityUpdate = (facility: EmergencyLocation | null, error?: string) => {
    setClosestFacility(facility);
    setErrorMessage(error || null);
  };

  const handleDynamicFacilitiesLoaded = (facilities: EmergencyLocation[]) => {
    setDynamicFacilities(facilities);
  };

  const handleRouteLoaded = (geoJson: any | null) => {
    console.log("Route data received by Emergency component:", geoJson); // Confirm data is reaching here
    setRouteGeoJson(geoJson);
  };

  const defaultMapCenter: L.LatLngExpression = [10.35, 123.95];
  const defaultMapZoom = 10;

  const facilitiesToDisplay = [
    ...INITIAL_EMERGENCY_FACILITIES.filter(f => f.type === 'hospital'),
    ...dynamicFacilities
  ];

  const routeStyle = {
    color: '#007bff', // Blue color for the route
    weight: 5,
    opacity: 0.7
  };

  return (
    <div className="emergency-page-container">
      <div className="main-content-and-footer-wrapper">
        <div className="emergency-content-wrapper">
          <div className="emergency-header-info">
            <h1 className="emergency-page-title">Emergency Services</h1>
            <p className="emergency-page-description">
              Locate the nearest emergency hospitals and get help quickly.
            </p>
          </div>

          <div className="emergency-main-sections">
            <div className="emergency-section-left panel-box">
              <div className="map-container">
                <MapContainer
                  center={defaultMapCenter}
                  zoom={defaultMapZoom}
                  scrollWheelZoom={true}
                  className="leaflet-map-display"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {facilitiesToDisplay.map(loc => (
                    <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                      <Popup>
                        <strong>{loc.name} ({loc.type})</strong><br />
                        {loc.address}<br />
                        Phone: {loc.phone}
                      </Popup>
                    </Marker>
                  ))}

                  {/* Render the route GeoJSON if available */}
                  {routeGeoJson && (
                    <>
                        {/* --- CRITICAL DEBUGGING POINT 4: Log routeGeoJson immediately before rendering --- */}
                        {console.log("GeoJSON data attempting to render in MapContainer:", routeGeoJson)}
                        <GeoJSON data={routeGeoJson} style={routeStyle} />
                    </>
                  )}

                  <LocationMarker
                    onClosestFacilityFound={handleClosestFacilityUpdate}
                    onDynamicFacilitiesLoaded={handleDynamicFacilitiesLoaded}
                    onRouteLoaded={handleRouteLoaded}
                    panToUser={true}
                  />
                </MapContainer>
              </div>

              <div className="closest-hospital-info-panel panel-box">
                {closestFacility ? (
                  <>
                    <h3 className="hospital-found-title">Closest Hospital:</h3>
                    <p className="hospital-name-display">{closestFacility.name}</p>
                    <p className="hospital-address-display">{closestFacility.address}</p>
                    <p className="hospital-phone-display">Call: {closestFacility.phone}</p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(closestFacility.name + ' ' + closestFacility.address)}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="get-directions-button"
                    >
                      Get Directions (Google Maps)
                    </a>
                    <p className="disclaimer-small">Directions will open in Google Maps.</p>
                  </>
                ) : (
                  <p className="hospital-not-found-message">
                    {errorMessage || "Attempting to find your location and nearest hospital..."}
                  </p>
                )}
              </div>
            </div>

            <div className="emergency-section-right">
              <div className="emergency-hotlines panel-box">
                <h2>Emergency Hotlines</h2>
                <div className="hotline-item">
                  <i className="fas fa-phone-alt"></i>
                  <p>National Emergency Hotline</p>
                  <span>911</span>
                </div>
                {facilitiesToDisplay.filter(f => f.type === 'hospital').map(f => (
                  <div className="hotline-item" key={`hotline-${f.id}`}>
                    <i className="fas fa-phone-alt"></i>
                    <p>{f.name}</p>
                    <span>{f.phone}</span>
                  </div>
                ))}
                <p className="disclaimer">This list serves as a backup if no nearby hospital is found on the map. This list is for informational purposes only; always verify phone numbers during an emergency.</p>
              </div>
              <div className="draft-section panel-box">
                <p className="draft-text">Draft an emergency message here. (e.g., "I am at [address] and need an ambulance.")</p>
                <textarea placeholder="Type your message..." className="draft-textarea"></textarea>
                <button className="send-draft-button">Send Draft</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emergency;