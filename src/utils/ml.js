// Deterministic seeded random — same doc ID always gives same ML result
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

const ROAD_TYPES = ['Lane', 'Residential', 'Main Road', 'Highway'];

/**
 * Mock ML analysis using the paper's priority formula:
 * J = w1 × (Ap/Amax) / (Rw/Rmax) + w2 × Td
 * w1=0.6, w2=0.4, Amax=500, Rmax=12
 */
export function runMockML(reportId) {
  const W1 = 0.6, W2 = 0.4, AMAX = 500, RMAX = 12;
  const SEVERITIES = ['Minor', 'Medium', 'Major'];

  const severity = SEVERITIES[Math.floor(seededRandom(reportId + '_sev') * 3)];
  const Ap = parseFloat(seededRange(reportId + '_ap', 20, AMAX).toFixed(1));
  const Rw = parseFloat(seededRange(reportId + '_rw', 3, RMAX).toFixed(1));
  const Td = parseFloat(seededRandom(reportId + '_td').toFixed(3));
  const J  = parseFloat((W1 * ((Ap / AMAX) / (Rw / RMAX)) + W2 * Td).toFixed(4));

  const roadType = ROAD_TYPES[Math.floor(seededRandom(reportId + '_rt') * 4)];

  let urgency;
  if (J >= 1.2)       urgency = 'Critical';
  else if (J >= 0.7)  urgency = 'High';
  else if (J >= 0.35) urgency = 'Medium';
  else                urgency = 'Low';

  const size = urgency === 'Critical' ? 'Critical'
    : severity === 'Major'  ? 'Large'
    : severity === 'Medium' ? 'Medium' : 'Small';

  const priority = Math.min(100, Math.round(J * 55));

  return { severity, Ap, Rw, Td, J, roadType, urgency, size, priority };
}

// Colour helpers — light-mode Tailwind classes + dark-mode variants
// Both badge and badgeDark strings appear statically so Tailwind JIT includes them.
export const URGENCY_COLORS = {
  Critical: {
    badge:     'bg-purple-100 text-purple-700',
    badgeDark: 'bg-purple-500/20 text-purple-300',
    dot: '#7c3aed', hex: '#7c3aed',
  },
  High: {
    badge:     'bg-red-100 text-red-600',
    badgeDark: 'bg-red-500/20 text-red-400',
    dot: '#ef4444', hex: '#ef4444',
  },
  Medium: {
    badge:     'bg-orange-100 text-orange-600',
    badgeDark: 'bg-orange-500/20 text-orange-400',
    dot: '#f97316', hex: '#f97316',
  },
  Low: {
    badge:     'bg-green-100 text-green-600',
    badgeDark: 'bg-green-500/20 text-green-400',
    dot: '#22c55e', hex: '#22c55e',
  },
};

export const STATUS_COLORS = {
  Reported: 'bg-slate-100 text-slate-600',
  Assigned: 'bg-amber-100 text-amber-700',
  Verified: 'bg-blue-100 text-blue-700',
  Resolved: 'bg-green-100 text-green-700',
};

export const STATUS_COLORS_DARK = {
  Reported: 'bg-slate-700/40 text-slate-300',
  Assigned: 'bg-amber-500/20 text-amber-300',
  Verified: 'bg-blue-500/20 text-blue-300',
  Resolved: 'bg-green-500/20 text-green-300',
};
