import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { runMockML } from './utils/ml';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/DashboardPage';
import ReportsPage from './components/ReportsPage';
import MapPage from './components/MapPage';
import TeamsPage from './components/TeamsPage';

function AppShell() {
  const [activePage, setActivePage] = useState('dashboard');
  const [reports, setReports]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'pothole_reports'),
      (snapshot) => {
        const rows = snapshot.docs.map(d => {
          const data = d.data();
          let ts = null;
          if (data.timestamp?.toDate) ts = data.timestamp.toDate();
          else if (data.timestamp)    ts = new Date(data.timestamp);
          return { id: d.id, ...data, timestamp: ts, ml: runMockML(d.id) };
        });
        rows.sort((a, b) => b.ml.J - a.ml.J);
        setReports(rows);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore:', err);
        setError('Could not connect to Firestore. Check your .env and Firestore rules.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const pages = {
    dashboard: <DashboardPage reports={reports} loading={loading} error={error} />,
    reports:   <ReportsPage   reports={reports} loading={loading} />,
    map:       <MapPage       reports={reports} />,
    teams:     <TeamsPage />,
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-[#0D1117] overflow-hidden transition-colors duration-200">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {pages[activePage]}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
