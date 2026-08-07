import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ALLOWED_CATEGORIES } from './nearbyPlacesService';

function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Property Marker Icon
const PROPERTY_ICON = L.divIcon({
  className: 'leaflet-property-marker-container',
  html: `
    <div class="relative flex items-center justify-center">
      <span class="absolute w-10 h-10 bg-blue-500/30 rounded-full animate-ping"></span>
      <span class="absolute w-7 h-7 bg-blue-600/40 rounded-full animate-pulse"></span>
      <div class="relative z-10 w-9 h-9 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-blue-500/30">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <div class="absolute -bottom-5 bg-slate-900 text-white font-black text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-blue-400/40">
        PROPERTY
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// SVG Icon templates for category markers
const CATEGORY_SVG_ICONS = {
  school: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>`,
  hospital: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 6v12M6 12h12"/></svg>`,
  bank: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M5 10v11M9 10v11M15 10v11M19 10v11M12 2L3 7h18z"/></svg>`,
  shopping: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  metro: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8M8 19l-3 3M16 19l3 3M8 15h.01M16 15h.01"/></svg>`,
  transport: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 6v6M16 6v6M3 12h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6H4z"/><path d="M6.5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM17.5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>`,
  park: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 10v.01M14 14v.01M12 2a8 8 0 0 0-8 8c0 4.5 5 11 8 12 3-1 8-7.5 8-12a8 8 0 0 0-8-8z"/></svg>`,
  theatre: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 4v16M18 4v16M2 8h20M2 16h20"/></svg>`,
  gym: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M8 4v16M16 4v16"/></svg>`,
};

// Static Icon Cache to prevent DOM re-creation shaking on hover
const ICON_CACHE = {};

function getCategoryDivIcon(category) {
  if (ICON_CACHE[category]) return ICON_CACHE[category];

  const catDef = ALLOWED_CATEGORIES[category] || ALLOWED_CATEGORIES.school;
  const color = catDef.color || '#3b82f6';
  const svgIcon = CATEGORY_SVG_ICONS[category] || CATEGORY_SVG_ICONS.school;

  const icon = L.divIcon({
    className: 'leaflet-category-marker-container',
    html: `
      <div class="group relative flex items-center justify-center cursor-pointer transform-gpu transition-all duration-200 hover:scale-125">
        <div class="w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md border-2 border-white" style="background-color: ${color}">
          ${svgIcon}
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  ICON_CACHE[category] = icon;
  return icon;
}

export default function NeighborhoodMap({ property, places }) {
  const [hoveredPlace, setHoveredPlace] = useState(null);

  const centerLat = Number(property?.latitude) || 23.0225;
  const centerLng = Number(property?.longitude) || 72.5714;
  const propertyPos = useMemo(() => [centerLat, centerLng], [centerLat, centerLng]);

  return (
    <div className="relative w-full h-[420px] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl bg-slate-900">
      {/* Legend overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span>Radius: 500m • 1km • 2km • 3km</span>
      </div>

      <MapContainer
        center={propertyPos}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={propertyPos} zoom={14} />

        {/* ── 500m, 1km, 2km, 3km Concentric Distance Rings ─────────── */}
        <Circle
          center={propertyPos}
          radius={500}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.04,
            dashArray: '5, 5',
            weight: 1.2,
          }}
        />
        <Circle
          center={propertyPos}
          radius={1000}
          pathOptions={{
            color: '#6366f1',
            fillColor: '#6366f1',
            fillOpacity: 0.03,
            dashArray: '5, 5',
            weight: 1.2,
          }}
        />
        <Circle
          center={propertyPos}
          radius={2000}
          pathOptions={{
            color: '#8b5cf6',
            fillColor: '#8b5cf6',
            fillOpacity: 0.02,
            dashArray: '5, 5',
            weight: 1.2,
          }}
        />
        <Circle
          center={propertyPos}
          radius={3000}
          pathOptions={{
            color: '#ec4899',
            fillColor: '#ec4899',
            fillOpacity: 0.01,
            dashArray: '5, 5',
            weight: 1.2,
          }}
        />

        {/* ── Subtle Animated Line on Hover ────────────────────────── */}
        {hoveredPlace && (
          <Polyline
            positions={[propertyPos, [hoveredPlace.lat, hoveredPlace.lng]]}
            pathOptions={{
              color: '#2563eb',
              weight: 3,
              dashArray: '8, 8',
              opacity: 0.9,
            }}
          >
            <Tooltip permanent direction="center" className="custom-distance-tooltip">
              <span className="font-extrabold text-xs text-blue-700 bg-white px-2.5 py-1 rounded-full shadow-md border border-blue-200">
                {hoveredPlace.distanceText} ({hoveredPlace.walkTime})
              </span>
            </Tooltip>
          </Polyline>
        )}

        {/* ── Property Marker ───────────────────────────────────────── */}
        <Marker position={propertyPos} icon={PROPERTY_ICON}>
          <Tooltip direction="top" opacity={1} className="custom-property-tooltip">
            <div className="p-1 text-center">
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Property Location</span>
              <h4 className="font-black text-sm text-slate-900">{property?.title}</h4>
              <p className="text-xs text-slate-500">{property?.address || property?.locality}</p>
            </div>
          </Tooltip>
        </Marker>

        {/* ── Facility Markers ──────────────────────────────────────── */}
        {places.map((place) => {
          const catDef = ALLOWED_CATEGORIES[place.category] || ALLOWED_CATEGORIES.school;
          const markerIcon = getCategoryDivIcon(place.category);

          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={markerIcon}
              eventHandlers={{
                mouseover: () => setHoveredPlace(place),
                mouseout: () => setHoveredPlace(null),
              }}
            >
              {/* Instant Rich Hover Tooltip (opens automatically on hover without clicking) */}
              <Tooltip direction="top" opacity={1} className="custom-hover-details-tooltip">
                <div className="p-2 space-y-1.5 min-w-[190px]">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                      style={{ backgroundColor: `${catDef.color}15`, color: catDef.color }}
                    >
                      {catDef.label}
                    </span>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                      {place.distanceText}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{place.name}</h4>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 font-semibold">
                    <span>🚶 {place.walkTime}</span>
                    <span className="truncate max-w-[110px] text-slate-400">{place.address}</span>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
