import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Loader2, Navigation, CheckCircle2 } from 'lucide-react';

import { propertyApi } from '../../../services/propertyApi';

// Fix default Leaflet icon marker asset issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 }; // Ahmedabad City Center

const LOCALITY_COORDINATES = {
  'South Bopal': { lat: 23.0312, lng: 72.4689 },
  'Satellite': { lat: 23.0300, lng: 72.5176 },
  'Bodakdev': { lat: 23.0384, lng: 72.5119 },
  'Prahlad Nagar': { lat: 23.0135, lng: 72.5089 },
  'Science City': { lat: 23.0784, lng: 72.4952 },
  'Vastrapur': { lat: 23.0350, lng: 72.5293 },
  'Thaltej': { lat: 23.0500, lng: 72.5020 },
  'SG Highway': { lat: 23.0450, lng: 72.5090 },
  'Sindhu Bhavan Road': { lat: 23.0430, lng: 72.4980 },
  'Ambli': { lat: 23.0320, lng: 72.4850 },
  'Shela': { lat: 23.0120, lng: 72.4600 },
  'Gota': { lat: 23.1040, lng: 72.5350 },
  'Chandkheda': { lat: 23.1160, lng: 72.5830 },
  'Naranpura': { lat: 23.0560, lng: 72.5520 },
  'Paldi': { lat: 23.0120, lng: 72.5630 },
  'CG Road': { lat: 23.0300, lng: 72.5600 },
  'Maninagar': { lat: 22.9980, lng: 72.6020 },
  'Motera': { lat: 23.1050, lng: 72.5950 },
  'Navrangpura': { lat: 23.0370, lng: 72.5580 },
  'Ellisbridge': { lat: 23.0250, lng: 72.5700 },
  'Memnagar': { lat: 23.0520, lng: 72.5350 },
  'Sola': { lat: 23.0720, lng: 72.5210 },
  'Vatva': { lat: 22.9600, lng: 72.6300 },
  'Naroda': { lat: 23.0670, lng: 72.6500 },
  'Nikol': { lat: 23.0450, lng: 72.6650 },
  'Shahibaug': { lat: 23.0550, lng: 72.5920 },
};

// Helper component to center map smoothly
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number' && !isNaN(center.lat) && !isNaN(center.lng)) {
      map.flyTo([center.lat, center.lng], 15, { animate: true, duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Component to capture click events on map
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMap() {
  const { watch, setValue } = useFormContext();
  const currentLat = watch('latitude');
  const currentLng = watch('longitude');
  const watchLocality = watch('locality');
  const watchFullAddress = watch('fullAddress');

  const [position, setPosition] = useState(() => ({
    lat: currentLat && !isNaN(Number(currentLat)) ? Number(currentLat) : DEFAULT_CENTER.lat,
    lng: currentLng && !isNaN(Number(currentLng)) ? Number(currentLng) : DEFAULT_CENTER.lng,
  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressSnippet, setAddressSnippet] = useState('');

  const markerRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);

  // 1. Sync external lat/lng changes into map position (e.g. when reset() fires in EditPropertyPage)
  useEffect(() => {
    if (currentLat !== undefined && currentLng !== undefined && currentLat !== null && currentLng !== null) {
      const latNum = Number(currentLat);
      const lngNum = Number(currentLng);
      if (!isNaN(latNum) && !isNaN(lngNum) && (latNum !== position.lat || lngNum !== position.lng)) {
        setPosition({ lat: latNum, lng: lngNum });
      }
    }
  }, [currentLat, currentLng]);

  // 2. Ensure initial values are set in form state on mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (currentLat === undefined || currentLat === null || currentLng === undefined || currentLng === null) {
        setValue('latitude', position.lat, { shouldValidate: true, shouldDirty: true });
        setValue('longitude', position.lng, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [currentLat, currentLng, position, setValue]);

  // 3. Sync position when user selects a locality from dropdown
  useEffect(() => {
    if (watchLocality && LOCALITY_COORDINATES[watchLocality]) {
      const locCoords = LOCALITY_COORDINATES[watchLocality];
      // Only auto-move map if position is at default center or matches another locality
      const isDefault = Math.abs(position.lat - DEFAULT_CENTER.lat) < 0.0001 && Math.abs(position.lng - DEFAULT_CENTER.lng) < 0.0001;
      if (isDefault) {
        updateLocation(locCoords.lat, locCoords.lng, watchLocality + ', Ahmedabad, Gujarat');
      }
    }
  }, [watchLocality]);

  // Handle position update (from search, drag, click)
  const updateLocation = (lat, lng, displayName = '') => {
    const latFixed = Number(Number(lat).toFixed(6));
    const lngFixed = Number(Number(lng).toFixed(6));
    setPosition({ lat: latFixed, lng: lngFixed });
    setValue('latitude', latFixed, { shouldValidate: true, shouldDirty: true });
    setValue('longitude', lngFixed, { shouldValidate: true, shouldDirty: true });

    if (displayName) {
      setAddressSnippet(displayName);
      if (!watchFullAddress) {
        setValue('fullAddress', displayName, { shouldValidate: true, shouldDirty: true });
      }
    } else {
      reverseGeocode(latFixed, lngFixed);
    }
  };

  // Reverse Geocoding with Local Offline Map API
  const reverseGeocode = async (lat, lng) => {
    try {
      setIsGeocoding(true);
      const res = await propertyApi.reverseGeocodeMap(lat, lng);
      if (res && res.success && res.data?.display_name) {
        setAddressSnippet(res.data.display_name);

        // Auto-fill full address and locality in form state
        setValue('fullAddress', res.data.display_name, { shouldValidate: true, shouldDirty: true });
        if (res.data.locality && res.data.locality !== 'Ahmedabad') {
          setValue('locality', res.data.locality, { shouldValidate: true, shouldDirty: true });
        }
      }
    } catch (err) {
      console.error('Local reverse geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };


  // Search Address Autocomplete via Local Offline Map API (Debounced 300ms)
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await propertyApi.searchMapLocation(query);
        if (res && res.success && res.data) {
          setSearchResults(res.data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Local location search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };


  // Select search item
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    updateLocation(lat, lon, result.display_name);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(',')[0]);
  };

  // Drag marker event
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          updateLocation(latLng.lat, latLng.lng);
        }
      },
    }),
    []
  );

  return (
    <div className="space-y-4 pt-4 border-t border-[#e2e7ff] animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-[#131b2e] uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#0058be]" /> Interactive Location Map (Leaflet / OpenStreetMap)
          </label>

        </div>
        {isGeocoding && (
          <span className="text-xs text-[#0058be] font-semibold flex items-center gap-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching location address...
          </span>
        )}
      </div>

      {/* Address Search with Autocomplete */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 text-[#727785] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search location, building or area in Ahmedabad (e.g. South Bopal, SG Highway)..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#c2c6d6] focus:border-[#0058be] focus:ring-2 focus:ring-[#adc6ff] text-sm outline-none bg-white transition"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-[#0058be] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <ul className="absolute z-[1000] left-0 right-0 mt-1 bg-white border border-[#c2c6d6] rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-[#f2f3ff]">
            {searchResults.map((item, idx) => (
              <li
                key={idx}
                onClick={() => handleSelectResult(item)}
                className="p-3 hover:bg-[#f2f3ff] cursor-pointer text-xs font-medium text-[#131b2e] flex items-start gap-2 transition"
              >
                <Navigation className="w-3.5 h-3.5 text-[#0058be] mt-0.5 flex-shrink-0" />
                <span>{item.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leaflet Map Box */}
      <div className="h-[320px] w-full rounded-2xl overflow-hidden border border-[#c2c6d6] shadow-inner relative">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[position.lat, position.lng]}
            ref={markerRef}
          />
          <MapRecenter center={position} />
          <MapClickHandler onMapClick={(lat, lng) => updateLocation(lat, lng)} />
        </MapContainer>
      </div>

      {/* Selected Location Address Snippet */}
      {addressSnippet && (
        <div className="p-3 rounded-xl bg-[#f2f3ff] border border-[#d8e2ff] text-xs text-[#424754] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#006947] flex-shrink-0" />
          <span className="truncate">
            <strong className="text-[#131b2e]">Selected Point:</strong> {addressSnippet}
          </span>
        </div>
      )}

      {/* VISIBLE LATITUDE & LONGITUDE INPUTS (User Side Display) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1">
            LATITUDE <span className="text-[#0058be]">(Auto-filled from Map)</span>
          </label>
          <input
            type="text"
            readOnly
            value={position.lat}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-[#131b2e] outline-none cursor-default"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#424754] uppercase tracking-wider mb-1">
            LONGITUDE <span className="text-[#0058be]">(Auto-filled from Map)</span>
          </label>
          <input
            type="text"
            readOnly
            value={position.lng}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-[#131b2e] outline-none cursor-default"
          />
        </div>
      </div>
    </div>
  );
}
