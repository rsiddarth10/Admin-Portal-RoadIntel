// src/components/Dashboard.jsx
// Real-time pothole report dashboard with mock ML priority ranking.

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ─────────────────────────────────────────────────────────────────
//  Mock ML Analysis Engine
//  Simulates YOLOv8 detection output + the paper's priority formula.
//
//  Uses a string-seeded deterministic hash so that the same Firestore
//  document ID always produces the same ML values (stable across
//  real-time listener re-fires and React re-renders).
// ─────────────────────────────────────────────────────────────────

/** Deterministic value in [0, 1) for a given seed string. */
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i) | 0;
  }
  return (Math.abs(hash) % 100000) / 100000;
}

function seededRange(seed, min, max) {
  return min + seededRandom(seed) * (max - min);
}

/**
 * Runs mock ML analysis on a report document.
 *
 * Paper formula:  J = w1 × (Ap / Amax) / (Rw / Rmax) + w2 × Td
 *   Ap  — Pothole Area (cm²),  Amax = 500
 *   Rw  — Road Width (m),      Rmax = 12
 *   Td  — Traffic Density,     range [0, 1]
 *   w1  = 0.6,  w2 = 0.4
 *
 * A large pothole (high Ap) on a narrow road (low Rw) under heavy
 * traffic (high Td) maximises J → highest repair priority.
 */
function runMockML(reportId) {
  const SEVERITIES = ['Minor', 'Medium', 'Major'];
  const W1 = 0.6, W2 = 0.4, AMAX = 500, RMAX = 12;

  const severity = SEVERITIES[Math.floor(seededRandom(reportId + '_sev') * 3)];
  const Ap = parseFloat(seededRange(reportId + '_ap', 20,  AMAX).toFixed(1));
  const Rw = parseFloat(seededRange(reportId + '_rw', 3,   RMAX).toFixed(1));
  const Td = parseFloat(seededRandom(reportId + '_td').toFixed(3));

  // Core priority formula from the research paper
  const J = parseFloat((W1 * ((Ap / AMAX) / (Rw / RMAX)) + W2 * Td).toFixed(4));

  return { severity, Ap, Rw, Td, J };
}

// ─────────────────────────────────────────────────────────────────
//  Styling maps
// ─────────────────────────────────────────────────────────────────

const SEVERITY_CLS = {
  Minor:  'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300',
  Medium: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300',
  Major:  'bg-red-100   text-red-800   ring-1 ring-red-300',
};

const STATUS_CLS = {
  Reported: 'bg-blue-100  text-blue-700',
  Assigned: 'bg-green-100 text-green-700',
  Resolved: 'bg-slate-100 text-slate-500',
};

function jColor(j) {
  if (j >= 1.0) return 'text-red-600 font-extrabold';
  if (j >= 0.5) return 'text-orange-500 font-bold';
  return 'text-emerald-600 font-semibold';
}

// ─────────────────────────────────────────────────────────────────
//  Dashboard (main export)
// ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'pothole_reports'),
      (snapshot) => {
        const rows = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            // Convert Firestore Timestamp → JS Date
            timestamp: data.timestamp?.toDate?.() ?? null,
            // Run (or recall) deterministic mock ML
            ml: runMockML(d.id),
          };
        });

        // Sort descending by J score — most urgent first
        rows.sort((a, b) => b.ml.J - a.ml.J);
        setReports(rows);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError('Failed to connect to database. Check your Firebase configuration and Firestore rules.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleAssign = async (id) => {
    setAssigningId(id);
    try {
      await updateDoc(doc(db, 'pothole_reports', id), { status: 'Assigned' });
    } catch (e) {
      console.error('Update failed:', e);
      alert('Could not update status. Check your Firestore write rules.');
    } finally {
      setAssigningId(null);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
        <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-lg">Connecting to live feed…</span>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-semibold text-lg">Connection Error</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <StatsBar reports={reports} />

      {/* Empty state */}
      {reports.length === 0 ? (
        <div className="text-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <p className="text-5xl mb-4">🛣️</p>
          <p className="text-xl font-semibold text-slate-600">No reports yet</p>
          <p className="text-sm mt-2">
            Reports submitted from the mobile app will appear here in real-time.
          </p>
        </div>
      ) : (
        /* Reports table */
        <div className="overflow-x-auto rounded-2xl shadow-sm border border-slate-200 bg-white">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">GPS Location</th>
                <th className="px-4 py-3">Reported At</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Ap&nbsp;(cm²)</th>
                <th className="px-4 py-3">Rw&nbsp;(m)</th>
                <th className="px-4 py-3">Td</th>
                <th className="px-4 py-3 text-slate-700 font-bold">J Score ↓</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report, idx) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  rank={idx + 1}
                  onAssign={handleAssign}
                  isAssigning={assigningId === report.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Stats Bar
// ─────────────────────────────────────────────────────────────────

function StatsBar({ reports }) {
  const total    = reports.length;
  const reported = reports.filter(r => r.status === 'Reported').length;
  const assigned = reports.filter(r => r.status === 'Assigned').length;
  const major    = reports.filter(r => r.ml?.severity === 'Major').length;

  const cards = [
    { label: 'Total Reports',   value: total,    ring: 'ring-blue-200',   text: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Awaiting Action', value: reported,  ring: 'ring-orange-200', text: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Team Assigned',   value: assigned,  ring: 'ring-green-200',  text: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Major Severity',  value: major,     ring: 'ring-red-200',    text: 'text-red-600',    bg: 'bg-red-50'    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} ring-1 ${c.ring} rounded-2xl px-5 py-4`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</p>
          <p className={`text-4xl font-extrabold mt-1 ${c.text}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Single Report Row
// ─────────────────────────────────────────────────────────────────

function ReportRow({ report, rank, onAssign, isAssigning }) {
  const { id, imageUrl, latitude, longitude, timestamp, status, ml } = report;
  const isUrgent = ml.J >= 1.0 && status === 'Reported';

  return (
    <tr className={`transition-colors hover:bg-slate-50 ${isUrgent ? 'bg-red-50/40' : ''}`}>

      {/* Rank */}
      <td className="px-4 py-3 font-bold text-slate-400 text-base">#{rank}</td>

      {/* Thumbnail */}
      <td className="px-4 py-3">
        {imageUrl ? (
          <a href={imageUrl} target="_blank" rel="noreferrer">
            <img
              src={imageUrl}
              alt="Pothole"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 hover:scale-110 transition-transform shadow-sm"
            />
          </a>
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
            No image
          </div>
        )}
      </td>

      {/* GPS */}
      <td className="px-4 py-3">
        <p className="font-mono text-xs text-slate-600 leading-5">
          {latitude?.toFixed(5)},<br />{longitude?.toFixed(5)}
        </p>
        <a
          href={`https://maps.google.com/?q=${latitude},${longitude}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:underline text-[11px] mt-0.5 inline-block"
        >
          View on Map →
        </a>
      </td>

      {/* Timestamp */}
      <td className="px-4 py-3 text-slate-500 text-xs">
        {timestamp
          ? timestamp.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          : '—'}
      </td>

      {/* Severity badge */}
      <td className="px-4 py-3">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${SEVERITY_CLS[ml.severity] ?? SEVERITY_CLS.Minor}`}>
          {ml.severity}
        </span>
      </td>

      {/* ML values */}
      <td className="px-4 py-3 font-mono text-slate-700">{ml.Ap}</td>
      <td className="px-4 py-3 font-mono text-slate-700">{ml.Rw}</td>
      <td className="px-4 py-3 font-mono text-slate-700">{ml.Td}</td>

      {/* J Score — coloured by urgency */}
      <td className="px-4 py-3 font-mono text-sm">
        <span className={jColor(ml.J)}>{ml.J}</span>
      </td>

      {/* Status badge */}
      <td className="px-4 py-3">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLS[status] ?? STATUS_CLS.Reported}`}>
          {status}
        </span>
      </td>

      {/* Action */}
      <td className="px-4 py-3">
        {status === 'Reported' ? (
          <button
            onClick={() => onAssign(id)}
            disabled={isAssigning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {isAssigning ? 'Saving…' : 'Assign Team'}
          </button>
        ) : (
          <span className="text-slate-400 text-xs">Done ✓</span>
        )}
      </td>
    </tr>
  );
}
