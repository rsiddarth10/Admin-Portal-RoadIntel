import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const STATUS_STYLES = {
  available: 'text-green-600 bg-green-50 dark:bg-green-500/20 dark:text-green-400',
  busy:      'text-orange-600 bg-orange-50 dark:bg-orange-500/20 dark:text-orange-400',
  off_duty:  'text-slate-500 bg-slate-100 dark:bg-slate-700/40 dark:text-slate-400',
};

const INITIAL_TEAMS = [
  { id: 1, name: 'Alpha Repair Squad',     supervisor: 'Ravi Kumar',  zone: 'North Zone',  members: 2, completed: 12, status: 'available', specialty: 'Pothole Repair' },
  { id: 2, name: 'Beta Road Team',          supervisor: 'Priya Sharma', zone: 'South Zone',  members: 1, completed: 8,  status: 'available', specialty: 'Road Resurfacing' },
  { id: 3, name: 'Emergency Response Unit', supervisor: 'Anil Singh',  zone: 'City Center', members: 0, completed: 25, status: 'available', specialty: 'Emergency' },
];

function AddTeamModal({ onClose, onAdd }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const form = Object.fromEntries(fd.entries());
    if (!form.name.trim()) return;
    onAdd({ ...form, members: Number(form.members), id: Date.now(), status: 'available', completed: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#161B28] rounded-2xl shadow-2xl w-full max-w-md mx-4 ring-1 ring-transparent dark:ring-white/[0.08]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.08]">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Add New Team</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { label: 'Team Name',  name: 'name',       type: 'text',   defaultValue: '' },
            { label: 'Supervisor', name: 'supervisor', type: 'text',   defaultValue: '' },
            { label: 'Zone',       name: 'zone',       type: 'text',   defaultValue: '' },
            { label: 'Members',    name: 'members',    type: 'number', defaultValue: '1' },
          ].map(f => (
            <div key={f.name}>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {f.label}
              </label>
              <input
                type={f.type}
                name={f.name}
                defaultValue={f.defaultValue}
                className="mt-1 w-full border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1E2940] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Specialty
            </label>
            <select
              name="specialty"
              defaultValue="Pothole Repair"
              className="mt-1 w-full border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#1E2940] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['Pothole Repair', 'Road Resurfacing', 'Emergency', 'General Maintenance'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            Add Team
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TeamsPage() {
  const { isDark } = useTheme();
  const [teams,      setTeams]      = useState(INITIAL_TEAMS);
  const [filter,     setFilter]     = useState('All');
  const [showModal,  setShowModal]  = useState(false);

  const handleAdd    = (team) => setTeams(prev => [...prev, team]);
  const handleDelete = (id)   => setTeams(prev => prev.filter(t => t.id !== id));

  const available = teams.filter(t => t.status === 'available').length;
  const busy      = teams.filter(t => t.status === 'busy').length;

  const filtered = filter === 'All'
    ? teams
    : teams.filter(t => t.status === filter.toLowerCase());

  return (
    <div className="p-8 space-y-5">
      {showModal && <AddTeamModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Repair Teams</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {available} available · {busy} busy · {teams.length} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Add Team
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Available',     value: available,    icon: '✅', color: '#22c55e' },
          { label: 'Currently Busy', value: busy,        icon: '🔧', color: '#f97316' },
          { label: 'Total Teams',   value: teams.length, icon: '👷', color: '#8b5cf6' },
        ].map(s => (
          <div
            key={s.label}
            className="bg-white dark:bg-[#161B28] rounded-xl p-5 shadow-sm dark:shadow-none border-l-4 ring-1 ring-transparent dark:ring-white/[0.07]"
            style={{ borderLeftColor: s.color }}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{s.value}</p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['All', 'Available', 'Busy', 'Off_duty'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${filter === f
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200'
                : 'bg-white dark:bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.12] hover:border-slate-400 dark:hover:border-white/30'}`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Team cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(team => (
          <div key={team.id} className="bg-white dark:bg-[#161B28] rounded-xl p-5 shadow-sm dark:shadow-none border border-slate-100 dark:border-white/[0.07] space-y-3">
            {/* Card header */}
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{team.name}</h3>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[team.status]}`}>
                {team.status.replace('_', ' ')}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Supervisor</p>
                <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{team.supervisor}</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Zone</p>
                <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{team.zone}</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Members</p>
                <p className="text-slate-700 dark:text-slate-200 font-medium mt-0.5">{team.members} people</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold">Completed</p>
                <p className="text-green-600 dark:text-green-400 font-semibold mt-0.5">{team.completed} jobs</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.07]">
              <span className="text-xs text-slate-400 dark:text-slate-500">{team.specialty}</span>
              <button
                onClick={() => handleDelete(team.id)}
                className="text-xs text-red-500 hover:text-red-400 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
