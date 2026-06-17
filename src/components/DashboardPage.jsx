import { useTheme } from '../context/ThemeContext';
import { URGENCY_COLORS, STATUS_COLORS, STATUS_COLORS_DARK } from '../utils/ml';

// ── Simple SVG pie chart ──────────────────────────────────────────
function PieChart({ slices }) {
  if (!slices.length || slices.every(s => s.value === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-sm">
        No data yet
      </div>
    );
  }
  const total = slices.reduce((s, d) => s + d.value, 0);
  const CX = 90, CY = 90, R = 70;

  const polar = (angle) => ({
    x: CX + R * Math.cos((angle - 90) * Math.PI / 180),
    y: CY + R * Math.sin((angle - 90) * Math.PI / 180),
  });

  let cursor = 0;
  const paths = slices.map(s => {
    if (s.value === 0) return null;
    const startAngle = cursor;
    const sweep      = (s.value / total) * 360;
    cursor          += sweep;
    const endAngle   = cursor;
    const large      = sweep > 180 ? 1 : 0;
    const s1 = polar(startAngle), s2 = polar(endAngle);
    return (
      <path
        key={s.label}
        d={`M ${CX} ${CY} L ${s1.x} ${s1.y} A ${R} ${R} 0 ${large} 1 ${s2.x} ${s2.y} Z`}
        fill={s.color}
      />
    );
  });

  return (
    <div className="flex items-center gap-8">
      <svg viewBox="0 0 180 180" width={180} height={180}>{paths}</svg>
      <div className="space-y-2">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-slate-600 dark:text-slate-400">
              {s.label}: <span className="font-semibold">{s.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent }) {
  return (
    <div
      className="bg-white dark:bg-[#161B28] rounded-xl p-5 border-l-4 shadow-sm dark:shadow-none ring-1 ring-transparent dark:ring-white/[0.07]"
      style={{ borderLeftColor: accent }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
            {label}
          </p>
          <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
        </div>
        <span className="text-3xl select-none opacity-80">{icon}</span>
      </div>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────
export default function DashboardPage({ reports, loading, error }) {
  const { isDark } = useTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-3">
        <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Connecting to live feed…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-6 text-center">
          <p className="text-red-700 dark:text-red-400 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const total    = reports.length;
  const pending  = reports.filter(r => r.status === 'Reported').length;
  const assigned = reports.filter(r => r.status === 'Assigned').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;
  const critical = reports.filter(r => r.ml?.urgency === 'Critical').length;

  const urgencyCounts = {
    Critical: reports.filter(r => r.ml?.urgency === 'Critical').length,
    High:     reports.filter(r => r.ml?.urgency === 'High').length,
    Medium:   reports.filter(r => r.ml?.urgency === 'Medium').length,
    Low:      reports.filter(r => r.ml?.urgency === 'Low').length,
  };

  const pieSlices = [
    { label: 'Critical', value: urgencyCounts.Critical, color: '#7c3aed' },
    { label: 'High',     value: urgencyCounts.High,     color: '#ef4444' },
    { label: 'Medium',   value: urgencyCounts.Medium,   color: '#f97316' },
    { label: 'Low',      value: urgencyCounts.Low,      color: '#22c55e' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Overview of pothole reports and repair status
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard label="Total Reports"   value={total}    icon="📋" accent="#3b82f6" />
        <StatCard label="Pending Review"  value={pending}  icon="⏱️" accent="#f97316" sub={`${assigned} in progress`} />
        <StatCard label="Assigned"        value={assigned} icon="🔧" accent="#f59e0b" sub={`${assigned} in progress`} />
        <StatCard label="Fixed"           value={resolved} icon="✅" accent="#22c55e" />
        <StatCard label="Critical"        value={critical} icon="🚨" accent="#ef4444" sub={`${critical} high priority`} />
        <StatCard label="Teams Available" value={3}        icon="👷" accent="#8b5cf6" sub="0 currently busy" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#161B28] rounded-xl p-6 shadow-sm dark:shadow-none border border-slate-100 dark:border-white/[0.07]">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Reports by Urgency</h2>
          <PieChart slices={pieSlices} />
        </div>

        <div className="bg-white dark:bg-[#161B28] rounded-xl p-6 shadow-sm dark:shadow-none border border-slate-100 dark:border-white/[0.07]">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Monthly Fixes</h2>
          {resolved === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-sm">
              No fix data available yet
            </div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{resolved}</span>
                <div
                  className="w-10 bg-blue-500 rounded-t"
                  style={{ height: `${Math.min(100, resolved * 20)}%` }}
                />
                <span className="text-xs text-slate-400 dark:text-slate-500">This month</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top priority reports */}
      {reports.length > 0 && (
        <div className="bg-white dark:bg-[#161B28] rounded-xl p-6 shadow-sm dark:shadow-none border border-slate-100 dark:border-white/[0.07]">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Top Priority Reports</h2>
          <div className="space-y-3">
            {reports.slice(0, 5).map((r, i) => {
              const uc = URGENCY_COLORS[r.ml?.urgency] ?? URGENCY_COLORS.Low;
              const sc = isDark
                ? (STATUS_COLORS_DARK[r.status] ?? STATUS_COLORS_DARK.Reported)
                : (STATUS_COLORS[r.status] ?? STATUS_COLORS.Reported);
              return (
                <div key={r.id} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400 dark:text-slate-500 w-5 text-center font-bold">
                    #{i + 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isDark ? uc.badgeDark : uc.badge}`}>
                    {r.ml?.urgency}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                    {r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}
                  </span>
                  <span className="ml-auto text-slate-400 dark:text-slate-500">J = {r.ml?.J}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${sc}`}>
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
