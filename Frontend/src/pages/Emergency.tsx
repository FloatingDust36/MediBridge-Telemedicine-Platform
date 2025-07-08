import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
});


interface EmergencyLocation {
  id: number;
  lat: number;
  lng: number;
  name: string;
  address: string;
  phone: string;
  type: string;
}

const INITIAL_EMERGENCY_FACILITIES: EmergencyLocation[] = [
  { id: 1, lat: 10.3157, lng: 123.8854, name: 'Cebu Doctors\' University Hospital', address: 'Osmeña Blvd, Cebu City', phone: '(032) 255 5555', type: 'hospital' },
  { id: 2, lat: 10.3344, lng: 123.9056, name: 'Perpetual Succour Hospital', address: 'Gorordo Ave, Cebu City', phone: '(032) 233 8620', type: 'hospital' },
  { id: 3, lat: 10.3015, lng: 123.8967, name: 'Vicente Sotto Memorial Medical Center', address: 'B. Rodriguez St, Cebu City', phone: '(032) 253 9891', type: 'hospital' },
  { id: 4, lat: 10.3000, lng: 123.8800, name: 'Chong Hua Hospital (Cebu City)', address: 'Don Mariano Cui St, Cebu City', phone: '(032) 255 8000', type: 'hospital' },
  { id: 5, lat: 10.3205, lng: 123.8950, name: 'Adventist Hospital Cebu', address: 'Tres de Abril St, Cebu City', phone: '(032) 261 2100', type: 'hospital' },
  { id: 6, lat: 10.3005, lng: 123.8880, name: 'ACE Medical Center Cebu', address: 'Natalio Bacalso Ave, Cebu City', phone: '(032) 383 3454', type: 'hospital' },
  { id: 7, lat: 10.3160, lng: 123.8990, name: 'Cebu (Velez) General Hospital', address: 'F. Ramos St, Cebu City', phone: '(032) 255 0243', type: 'hospital' },
  { id: 8, lat: 10.3550, lng: 123.9000, name: 'Cebu North General Hospital', address: 'Talamban, Cebu City', phone: '(032) 343 0000', type: 'hospital' },
  { id: 9, lat: 10.2980, lng: 123.8930, name: 'Cebu City Medical Center', address: 'Natalio Bacalso Ave, Cebu City', phone: '(032) 255 1234', type: 'hospital' },
  { id: 10, lat: 10.2950, lng: 123.8900, name: 'Southwestern University Medical Center', address: 'Urgello St, Cebu City', phone: '(032) 416 5555', type: 'hospital' },
  { id: 15, lat: 10.3185, lng: 123.8920, name: 'Cebu Puericulture and Maternity House', address: 'F. Ramos St, Cebu City', phone: '(032) 255 2555', type: 'hospital' },
  { id: 16, lat: 10.3080, lng: 123.9010, name: 'Arcenas Hospital', address: 'A. Lopez St, Labangon, Cebu City', phone: '(032) 261 0313', type: 'hospital' },

  { id: 20, lat: 10.3580, lng: 123.9550, name: 'Chong Hua Hospital Mandaue', address: 'Mantawi Int\'l Drive, Mandaue City', phone: '(032) 233 8000', type: 'hospital' },
  { id: 21, lat: 10.3200, lng: 123.9650, name: 'University of Cebu Medical Center (UCMed)', address: 'Ouano Ave, Mandaue City', phone: '(032) 888 2662', type: 'hospital' },
  { id: 22, lat: 10.3205, lng: 123.9640, name: 'The Hospital at Maayo Well', address: 'UN Ave, Corner DM Cortes St, Mandaue City', phone: '+63 (32) 888 2662', type: 'hospital' },
  { id: 24, lat: 10.3450, lng: 123.9350, name: 'St. Vincent General Hospital (Mandaue)', address: 'S.B. Cabahug St, Mandaue City', phone: '(032) 346 0888', type: 'hospital' },

  { id: 30, lat: 10.3100, lng: 123.9780, name: 'Mactan Doctors\' Hospital', address: 'Basak, Lapu-Lapu City', phone: '(032) 340 0000', type: 'hospital' },
  { id: 31, lat: 10.3050, lng: 123.9850, name: 'Allegiant Regional Care Hospitals (ARC)', address: 'Bagumbayan, Lapu-Lapu City', phone: '(032) 236 7890', type: 'hospital' },
  { id: 32, lat: 10.3180, lng: 123.9550, name: 'Lapu-Lapu City Hospital', address: 'Gun-ob, Lapu-Lapu City', phone: '(032) 340 1111', type: 'hospital' },
  { id: 33, lat: 10.3200, lng: 123.9700, name: 'Tojong Inc. Maternity and General Hospital', address: 'Pajo, Lapu-Lapu City', phone: '(032) 340 2222', type: 'hospital' },
  { id: 34, lat: 10.3150, lng: 123.9600, name: 'Ouano Hospital', address: 'Humay-Humay Rd, Lapu-Lapu City', phone: '(032) 340 7318', type: 'hospital' },

  { id: 40, lat: 10.2500, lng: 123.8400, name: 'Cebu South Medical Center (Talisay District Hospital)', address: 'San Isidro, Talisay City', phone: '(032) 273 3713', type: 'hospital' },

  { id: 50, lat: 10.2050, lng: 123.7900, name: 'Minglanilla District Hospital', address: 'Tungkil, Minglanilla', phone: '(032) 254 0328', type: 'hospital' },
  { id: 51, lat: 10.2100, lng: 123.7950, name: 'San Lucas Medical Center', address: 'Tungkil, Minglanilla', phone: '(032) 231 3898', type: 'hospital' },

  { id: 60, lat: 10.4000, lng: 123.9800, name: 'Mendero Medical Center, Inc.', address: 'Poblacion, Consolacion', phone: '(032) 423 3333', type: 'hospital' },
  { id: 61, lat: 10.4100, lng: 123.9850, name: 'Consolacion Community Hospital', address: 'Poblacion, Consolacion', phone: '(032) 424 0000', type: 'hospital' },

  { id: 70, lat: 10.5200, lng: 124.0400, name: 'Danao District Hospital', address: 'Poblacion, Danao City', phone: '(032) 200 3300', type: 'hospital' },

  { id: 80, lat: 10.1000, lng: 123.6300, name: 'Cebu Provincial Hospital (Carcar City)', address: 'Poblacion, Carcar City', phone: '(032) 487 8120', type: 'hospital' },

  { id: 90, lat: 11.0500, lng: 124.0000, name: 'Cebu Provincial Hospital (Bogo City)', address: 'National Road, Bogo City', phone: '(032) 434 9128', type: 'hospital' },

  { id: 100, lat: 10.3700, lng: 123.6300, name: 'Toledo City General Hospital', address: 'Magsaysay Hills, Toledo City', phone: '(032) 465 8000', type: 'hospital' },

  { id: 110, lat: 10.3600, lng: 123.7200, name: 'Cebu Provincial Hospital (Balamban)', address: 'Poblacion, Balamban', phone: '(032) 333 2273', type: 'hospital' },

  { id: 120, lat: 10.0200, lng: 123.5900, name: 'Deiparine Community Hospital Sibonga', address: 'C. Delos Cientos, Sibonga', phone: '0922-382-7595', type: 'hospital' },

  { id: 130, lat: 10.2000, lng: 123.5800, name: 'Isidro Kintanar Memorial Hospital (Argao)', address: 'Poblacion, Argao', phone: '(032) 367 7500', type: 'hospital' },

  { id: 140, lat: 11.2700, lng: 124.0000, name: 'Daanbantayan District Hospital', address: 'Poblacion, Daanbantayan', phone: '(032) 437 5500', type: 'hospital' },

  { id: 150, lat: 11.1600, lng: 123.9500, name: 'Medellin Hospital (Example)', address: 'Poblacion, Medellin', phone: '(032) 436 2000', type: 'hospital' },

  { id: 160, lat: 10.1500, lng: 123.5500, name: 'Barili District Hospital', address: 'Poblacion, Barili', phone: '0922-382-7595', type: 'hospital' },

  { id: 170, lat: 9.7500, lng: 123.3800, name: 'Oslob District Hospital', address: 'Poblacion, Oslob', phone: '(032) 481 9900', type: 'hospital' },

  { id: 180, lat: 9.8000, lng: 123.3600, name: 'Mariano Jesus Cuenco Memorial Hospital (Malabuyoc)', address: 'Poblacion, Malabuyoc', phone: '(032) 516 1400', type: 'hospital' },
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const ORS_API_KEY = '5b3ce3597851110001cf6248550434e639e24cdfaca90049a9b5e306';


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

  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const fetchFacilitiesFromOverpass = async (centerLat: number, centerLng: number, radiusKm: number = 50) => {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const query = `
      [out:json];
      (
        node(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[amenity=hospital];
        node(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[healthcare=hospital];
        node(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[amenity=doctors];
        node(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[healthcare=doctor];
        way(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[amenity=hospital];
        way(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[healthcare=hospital];
        way(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[amenity=doctors];
        way(around:${radiusKm * 1000}, ${centerLat}, ${centerLng})[healthcare=doctor];
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
      console.log("Overpass API response (expanded facilities):", data);

      const fetchedFacilities: EmergencyLocation[] = data.elements
        .filter((el: any) => el.lat && el.lon && el.tags && el.tags.name)
        .map((el: any, index: number) => ({
          id: el.id || index,
          lat: el.lat,
          lng: el.lon,
          name: el.tags.name,
          address: el.tags['addr:full'] || el.tags['addr:street'] || el.tags['addr:housenumber'] || 'Address not available',
          phone: el.tags.phone || 'N/A',
          type: el.tags.healthcare || el.tags.amenity || 'facility'
        }));
      
      onDynamicFacilitiesLoaded(fetchedFacilities);
      console.log("Fetched facilities (expanded):", fetchedFacilities);
      return fetchedFacilities;

    } catch (error) {
      console.error("Failed to fetch facilities from Overpass API:", error);
      setLocationError("Could not load nearby medical facilities. Data might be unavailable or network issue.");
      onDynamicFacilitiesLoaded([]);
      return [];
    }
  };

  const fetchRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    if (!ORS_API_KEY) {
      console.error("ERROR: OpenRouteService API Key is NOT set. Cannot fetch route.");
      onRouteLoaded(null);
      return;
    }

    const routeUrl = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
    const body = {
      coordinates: [
        [startLng, startLat],
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error("ORS API Request Failed (HTTP Error):", response.status, response.statusText, errorData);
        throw new Error(`ORS API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("ORS Route response (raw data):", data);

      if (data.features && data.features.length > 0) {
          if (data.features[0].geometry && data.features[0].geometry.type === 'LineString') {
            console.log("ORS Route GeoJSON feature being passed:", data.features[0]);
            onRouteLoaded(data.features[0]);
          } else {
            console.warn("ORS API returned feature, but it's not a LineString geometry:", data.features[0]);
            onRouteLoaded(null);
          }
      } else {
          console.warn("ORS API returned no route features for the given coordinates. Check coordinates or network.");
          onRouteLoaded(null);
      }
    } catch (error) {
      console.error("Failed to fetch route from ORS API (Catch Block):", error);
      setLocationError("Could not calculate route. Please check your API key, coordinates, or try again later.");
      onRouteLoaded(null);
    }
  };


  const successCallback = async (position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const currentUserLoc: L.LatLngExpression = [lat, lng];
    setUserLocation(currentUserLoc);
    setLocationError(null);

    if (map && panToUser) {
      map.flyTo(currentUserLoc, 14);
    }

    const dynamicFacilities = await fetchFacilitiesFromOverpass(lat, lng, 50);

    const allFacilities = [
      ...INITIAL_EMERGENCY_FACILITIES,
      ...dynamicFacilities
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

    if (closestFacility && minDistance < 100) {
      onClosestFacilityFound(closestFacility);
      const confirmedClosestFacility: EmergencyLocation = closestFacility;

      if (ORS_API_KEY) {
        console.log(`Attempting to fetch route from [${lng}, ${lat}] to [${confirmedClosestFacility.lng}, ${confirmedClosestFacility.lat}]`);
        await fetchRoute(lat, lng, confirmedClosestFacility.lat, confirmedClosestFacility.lng);
      } else {
        onRouteLoaded(null);
        console.warn("ORS API key is not configured, skipping route fetch.");
      }
    } else {
      onClosestFacilityFound(null, "No medical facilities detected nearby (within 100 km).");
      onRouteLoaded(null);
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
    onRouteLoaded(null);
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
  const [routeGeoJson, setRouteGeoJson] = useState<any | null>(null);

  const handleClosestFacilityUpdate = (facility: EmergencyLocation | null, error?: string) => {
    setClosestFacility(facility);
    setErrorMessage(error || null);
  };

  const handleDynamicFacilitiesLoaded = (facilities: EmergencyLocation[]) => {
    setDynamicFacilities(facilities);
  };

  const handleRouteLoaded = (geoJson: any | null) => {
    console.log("Route data received by Emergency component:", geoJson);
    setRouteGeoJson(geoJson);
  };

  const defaultMapCenter: L.LatLngExpression = [10.35, 123.95];
  const defaultMapZoom = 10;

  const facilitiesToDisplay = [
    ...INITIAL_EMERGENCY_FACILITIES,
    ...dynamicFacilities
  ];

  const routeStyle = {
    color: '#007bff',
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
              Locate the nearest emergency medical facilities and get help quickly.
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
                        <strong>{loc.name} ({loc.type.charAt(0).toUpperCase() + loc.type.slice(1)})</strong><br />
                        {loc.address}<br />
                        Phone: {loc.phone}
                      </Popup>
                    </Marker>
                  ))}

                  {routeGeoJson && (
                    <>
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
                    <h3 className="hospital-found-title">Closest Medical Facility:</h3>
                    <p className="hospital-name-display">{closestFacility.name} ({closestFacility.type.charAt(0).toUpperCase() + closestFacility.type.slice(1)})</p>
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
                    {errorMessage || "Attempting to find your location and nearest medical facility..."}
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
                {facilitiesToDisplay.filter(f => f.phone && f.phone !== 'N/A').map(f => (
                  <div className="hotline-item" key={`hotline-${f.id}`}>
                    <i className="fas fa-phone-alt"></i>
                    <p>{f.name} ({f.type.charAt(0).toUpperCase() + f.type.slice(1)})</p>
                    <span>{f.phone}</span>
                  </div>
                ))}
                <p className="disclaimer">This list serves as a backup if no nearby medical facility is found on the map. This list is for informational purposes only; always verify phone numbers during an emergency.</p>
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