import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Users, FolderKanban, FileText } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, projects: 0, documents: 0 });

  useEffect(() => {
    Promise.all([api.getClients(), api.getProjects(), api.getDocuments()]).then(
      ([clients, projects, documents]) => {
        setStats({
          clients: clients.length,
          projects: projects.length,
          documents: documents.length,
        });
      }
    );
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to Mozuk Platform</p>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><Users size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Clients</div>
          <div className="stat-value">{stats.clients}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FolderKanban size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Projects</div>
          <div className="stat-value">{stats.projects}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FileText size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Documents</div>
          <div className="stat-value">{stats.documents}</div>
        </div>
      </div>
    </div>
  );
}
