import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useState } from 'react';
import { URGENCY_COLORS } from '../utils/ml';

const LEGEND = [
  { label: 'Critical', color: '#7c3aed' },
  { label: 'High',     color: '#ef4444' },
  { label: 'Medium',   color: '#f97316' },
  { label: 'Low',      color: '#22c55e' },
];

export default function MapPage({ reports }) {
  const [urgencyF, setUrgencyF] = useState('All Urgency');
  const [statusF,  setStatusF]  = useState('All Status');

  const filtered = reports.filter(r => {
    if (!r.latitude || !r.longitude) return false;
    if (urgencyF !== 'All Urgency' && r.ml?.urgency !== urgencyF) return false;
    if (statusF  !== 'All Status'  && r.status      !== statusF)  return false;
    return true;
  });

  // Centre map on average location, or default to India
  const centerLat = filtered.length
    ? filtered.reduce((s, r) => s + r.latitude, 0) / filtered.length
    : 20.5937;
  const centerLon = filtered.length
    ? filtered.reduce((s, r) => s + r.longitude, 0) / filtered.length
    : 78.9629;

  return (
    <div className="p-8 space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Map View</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          {filtered.length} potholes with location data
        </p>
      </div>

      {/* Filters + Legend bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Filter:</span>
          {[
            { value: urgencyF, set: setUrgencyF, options: ['All Urgency', 'Critical', 'High', 'Medium', 'Low'] },
            { value: statusF,  set: setStatusF,  options: ['All Status', 'Reported', 'Assigned', 'Resolved'] },
          ].map((f, i) => (
            <select
              key={i}
              value={f.value}
              onChange={e => f.set(e.target.value)}
              className="border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#1E2940] text-slate-600 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.07] shadow-sm dark:shadow-none" style={{ minHeight: 420 }}>
        <MapContainer
          center={[centerLat, centerLon]}
          zoom={filtered.length ? 10 : 5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filtered.map(r => {
            const color = URGENCY_COLORS[r.ml?.urgency]?.hex ?? '#22c55e';
            return (
              <CircleMarker
                key={r.id}
                center={[r.latitude, r.longitude]}
                radius={10}
                pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.9 }}
              >
                <Popup>
                  <div className="text-sm space-y-1 min-w-[160px]">
                    <p className="font-bold">{r.ml?.urgency} Priority</p>
                    <p className="text-slate-500 font-mono text-xs">
                      {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)}
                    </p>
                    <p>Size: {r.ml?.size}</p>
                    <p>Road: {r.ml?.roadType}</p>
                    <p>J Score: <strong>{r.ml?.J}</strong></p>
                    <p>Status: {r.status}</p>
                    {r.assignedTo && <p>Team: {r.assignedTo}</p>}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
