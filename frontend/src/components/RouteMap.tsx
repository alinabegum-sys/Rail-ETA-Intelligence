import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TrainStop, TrainSummary } from '../types';

interface RouteMapProps {
  stops: TrainStop[];
  train?: TrainSummary;
  selectedTrainId: string;
}

export const RouteMap: React.FC<RouteMapProps> = ({ stops, train, selectedTrainId }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.5, 78.5],
        zoom: 5,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (!stops || stops.length === 0) return;

    const latLngs: L.LatLngTuple[] = stops.map(s => [s.latitude, s.longitude]);

    // 1. Draw railway route line
    const routeLine = L.polyline(latLngs, {
      color: '#0284c7',
      weight: 4,
      opacity: 0.85,
      dashArray: '8, 6'
    }).addTo(layerGroup);

    // 2. Add station markers
    stops.forEach((stop, index) => {
      const isSource = index === 0;
      const isDestination = index === stops.length - 1;
      const markerColor = isSource ? '#10b981' : isDestination ? '#f43f5e' : '#38bdf8';
      
      const customIcon = L.divIcon({
        className: 'custom-station-icon',
        html: `
          <div style="
            background: #0f172a; 
            border: 2px solid ${markerColor}; 
            border-radius: 50%; 
            width: 14px; 
            height: 14px; 
            box-shadow: 0 0 8px ${markerColor}66;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: customIcon }).addTo(layerGroup);
      
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 2px;">
          <div style="font-weight: bold; font-size: 13px; color: #f8fafc;">${stop.station_name} (${stop.station_code})</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Seq: ${stop.sequence} | Dist: ${stop.distance_from_source} km</div>
          <div style="font-size: 11px; color: #38bdf8; margin-top: 4px;">Scheduled Arr: <b>${stop.scheduled_arrival}</b></div>
          <div style="font-size: 11px; color: #cbd5e1;">Scheduled Dep: <b>${stop.scheduled_departure}</b></div>
        </div>
      `);
    });

    // 3. Add Live Train Position Marker
    if (train) {
      // Use exact simulated GPS coordinates from backend
      const trainLat = (train.latitude && train.latitude !== 0) ? train.latitude : stops[0].latitude;
      const trainLng = (train.longitude && train.longitude !== 0) ? train.longitude : stops[0].longitude;

      const trainIcon = L.divIcon({
        className: 'custom-train-marker',
        html: `
          <div style="
            position: relative;
            background: #2563eb;
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 9999px;
            padding: 4px 8px;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.6);
            white-space: nowrap;
          ">
            <span>🚆 ${train.train_number}</span>
            <span style="
              background: ${train.current_delay_minutes > 20 ? '#ef4444' : train.current_delay_minutes > 5 ? '#f59e0b' : '#10b981'};
              padding: 1px 4px;
              border-radius: 4px;
              font-size: 9px;
            ">+${train.current_delay_minutes.toFixed(0)}m</span>
          </div>
        `,
        iconSize: [84, 24],
        iconAnchor: [42, 12]
      });

      const trainMarker = L.marker([trainLat, trainLng], { icon: trainIcon, zIndexOffset: 1000 }).addTo(layerGroup);
      
      trainMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-weight: bold; font-size: 14px; color: #38bdf8;">${train.train_name} (${train.train_number})</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 3px;">Type: <b>${train.train_type}</b></div>
          <div style="font-size: 11px; color: #cbd5e1;">Speed: <b>${train.speed.toFixed(1)} km/h</b></div>
          <div style="font-size: 11px; color: ${train.current_delay_minutes > 20 ? '#f87171' : '#34d399'};">Current Delay: <b>+${train.current_delay_minutes.toFixed(0)} mins</b></div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Heading to: <b>${train.next_station}</b></div>
          <div style="font-size: 11px; color: #e2e8f0; margin-top: 2px;">ML Predicted Terminus ETA: <b>${train.predicted_final_eta}</b></div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">GPS: ${trainLat.toFixed(4)}° N, ${trainLng.toFixed(4)}° E</div>
        </div>
      `);
    }

    if (latLngs.length > 0) {
      map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }
  }, [stops, train, selectedTrainId]);

  return (
    <div className="relative w-full h-[440px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-[400] bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shadow-lg">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
        GIS Track Geometry • OpenStreetMap
      </div>
    </div>
  );
};
