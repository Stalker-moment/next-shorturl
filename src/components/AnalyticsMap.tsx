"use client";

import React, { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
const DefaultIcon = L.icon({
 iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
 shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
 iconSize: [25, 41],
 iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export const COUNTRY_DATA: Record<string, { coords: [number, number]; name: string }> = {
 "ID": { coords: [-0.7893, 113.9213], name: "Indonesia" },
 "US": { coords: [37.0902, -95.7129], name: "Amerika Serikat" },
 "CA": { coords: [56.1304, -106.3468], name: "Kanada" },
 "GB": { coords: [55.3781, -3.4360], name: "Inggris" },
 "FR": { coords: [46.2276, 2.2137], name: "Prancis" },
 "DE": { coords: [51.1657, 10.4515], name: "Jerman" },
 "SG": { coords: [1.3521, 103.8198], name: "Singapura" },
 "JP": { coords: [36.2048, 138.2529], name: "Jepang" },
 "AU": { coords: [-25.2744, 133.7751], name: "Australia" },
 "IN": { coords: [20.5937, 78.9629], name: "India" },
 "BR": { coords: [-14.2350, -51.9253], name: "Brasil" },
 "RU": { coords: [61.5240, 105.3188], name: "Rusia" },
 "MY": { coords: [4.2105, 101.9758], name: "Malaysia" },
 "NL": { coords: [52.1326, 5.2913], name: "Belanda" },
 "ES": { coords: [40.4637, -3.7492], name: "Spanyol" },
 "CN": { coords: [35.8617, 104.1954], name: "Tiongkok" },
 "IT": { coords: [41.8719, 12.5674], name: "Italia" },
 "KR": { coords: [35.9078, 127.7669], name: "Korea Selatan" },
 "PH": { coords: [12.8797, 121.774], name: "Filipina" },
 "TH": { coords: [15.87, 100.9925], name: "Thailand" },
 "VN": { coords: [14.0583, 108.2772], name: "Vietnam" },
 "TR": { coords: [38.9637, 35.2433], name: "Turki" },
 "MX": { coords: [23.6345, -102.5528], name: "Meksiko" },
};

// Helper component to auto-focus map and fix size
function MapRefresher({ center, zoom }: { center: [number, number]; zoom: number }) {
 const map = useMap();
 
 useEffect(() => {
 map.invalidateSize();
 map.setView(center, zoom);
 }, [center, zoom, map]);

 return null;
}

interface MapLocation {
 id: string;
 lat: number | null;
 lon: number | null;
 city: string | null;
 country: string | null;
 count?: number;
}

interface Props {
 locations: MapLocation[];
 type?: 'overview' | 'detail';
}

export default function AnalyticsMap({ locations, type = 'overview' }: Props) {
 const [worldData, setWorldData] = useState<any>(null);

 useEffect(() => {
 if (type === 'overview') {
 // Fetch world GeoJSON for Choropleth
 fetch("https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson")
 .then(res => res.json())
 .then(data => setWorldData(data))
 .catch(err => console.error("Gagal memuat peta GeoJSON", err));
 }
 }, [type]);

 const { aggregatedByCountry, mapCenter, mapZoom, maxCount } = useMemo(() => {
 const agg: Record<string, number> = {};
 let topCountry = type === 'overview' ? "ID" : "";
 let max = 0;

 locations.forEach(curr => {
 if (curr.country) {
 const count = (curr.count || 1);
 agg[curr.country] = (agg[curr.country] || 0) + count;
 if (agg[curr.country] > max) {
 max = agg[curr.country];
 topCountry = curr.country;
 }
 }
 });

 let center: [number, number] = [20, 0];
 let zoom = 2;

 if (type === 'detail' && locations.length === 1 && locations[0].lat && locations[0].lon) {
 center = [locations[0].lat, locations[0].lon];
 zoom = 14;
 } else if (topCountry && COUNTRY_DATA[topCountry]) {
 center = COUNTRY_DATA[topCountry].coords;
 zoom = 4;
 }

 return { aggregatedByCountry: agg, mapCenter: center, mapZoom: zoom, maxCount: max };
 }, [locations, type]);

 // Style for Choropleth
 const getCountryStyle = (feature: any) => {
 const countryCode = feature.properties.iso_a2;
 const count = aggregatedByCountry[countryCode] || 0;
 
 // Cloudflare-like color scaling
 let color = 'rgba(255,255,255,0.05)'; // Default transparency
 let fillOpacity = 0.5;

 if (count > 0) {
 // Logarithmic or Linear color scaling
 const intensity = maxCount > 0 ? (Math.sqrt(count) / Math.sqrt(maxCount)) : 0;
 // From Zinc-800 to Blue-600
 color = count > 0 ? `rgba(79, 70, 229, ${0.4 + intensity * 0.6})` : 'rgba(255,255,255,0.05)';
 fillOpacity = 0.8;
 }

 return {
 fillColor: color,
 weight: 1,
 opacity: 0.1,
 color: 'white',
 fillOpacity: fillOpacity,
 };
 };

 const onEachCountry = (feature: any, layer: any) => {
 const countryCode = feature.properties.iso_a2;
 const countryName = feature.properties.name;
 const count = aggregatedByCountry[countryCode] || 0;

 if (count > 0) {
 layer.bindPopup(`
 <div class="p-1 font-sans text-center">
 <p class="font-black text-xs text-indigo-400 mb-0.5">Wilayah</p>
 <p class="font-black text-xs tracking-tighter text-white">${countryName} (${countryCode})</p>
 <div class="mt-2 text-xl font-black italic text-indigo-100">${count} <span class="text-[9px] non-italic text-zinc-500">Scan</span></div>
 </div>
 `);
 
 layer.on({
 mouseover: (e: any) => {
 const l = e.target;
 l.setStyle({
 fillOpacity: 1,
 weight: 2,
 opacity: 0.5
 });
 },
 mouseout: (e: any) => {
 const l = e.target;
 l.setStyle(getCountryStyle(feature));
 }
 });
 }
 };

 return (
 <div className="h-full w-full min-h-[350px] bg-[#0a0a0b] relative">
 <MapContainer 
 center={mapCenter} 
 zoom={mapZoom} 
 scrollWheelZoom={type === 'detail'}
 className="h-full w-full absolute inset-0 bg-[#0a0a0b]"
 zoomControl={false}
 >
 <MapRefresher center={mapCenter} zoom={mapZoom} />
 <TileLayer
 attribution='&copy; CARTO'
 url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
 />
 
 {type === 'overview' && worldData && (
 <GeoJSON 
 data={worldData} 
 style={getCountryStyle}
 onEachFeature={onEachCountry}
 />
 )}

 {/* Labels Layer (Placed on top of GeoJSON) */}
 <TileLayer
 attribution='&copy; CARTO'
 url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
 />

 {type === 'detail' && locations[0]?.lat && locations[0]?.lon && (
 <Marker position={[locations[0].lat, locations[0].lon]}>
 <Popup>
 <div className="p-1 font-sans text-left">
 <p className="font-black text-xs text-indigo-400 mb-1">Tik Lokasi</p>
 <p className="font-black text-xs tracking-tighter text-white">{locations[0].city || '??'}, {COUNTRY_DATA[locations[0].country || '']?.name || locations[0].country} ({locations[0].country})</p>
 </div>
 </Popup>
 </Marker>
 )}
 </MapContainer>
 <style jsx global>{`
 .leaflet-container { font-family: inherit; background: #0a0a0b !important; }
 .leaflet-popup-content-wrapper { background: #121214 !important; color: white !important; border: 1px solid rgba(255,255,255,0.05) !important; border-radius: 12px !important; box-shadow: 0 10px 40px rgba(0,0,0,1) !important; padding: 0 !important;}
 .leaflet-popup-content { margin: 10px 14px !important; }
 .leaflet-popup-tip { background: #121214 !important; }
 `}</style>
 </div>
 );
}
