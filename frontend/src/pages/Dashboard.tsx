import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  FileText,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Tag
} from 'lucide-react';

interface Stats {
  clients: number;
  projects: number;
  activeProjects: number;
  completedProjects: number;
  documents: number;
  totalRevenue: number;
  totalCollected: number;
  outstanding: number;
  totalExpenses: number;
  netProfit: number;
}

interface RecentProject {
  id: string;
  name: string;
  clientName: string;
  status: string;
  updatedAt: string;
}

interface RecentDocument {
  id: string;
  name: string;
  projectName: string;
  type: string;
  date: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    clients: 0,
    projects: 0,
    activeProjects: 0,
    completedProjects: 0,
    documents: 0,
    totalRevenue: 0,
    totalCollected: 0,
    outstanding: 0,
    totalExpenses: 0,
    netProfit: 0
  });
  const [categoriesBreakdown, setCategoriesBreakdown] = useState<{ name: string; amount: number; count: number }[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getClients(),
      api.getProjects(),
      api.getDocuments(),
      api.getPayments(),
      api.getPaymentCategories()
    ]).then(
      ([clients, projects, documents, payments, categories]) => {

        // Calculate Financials
        const invoices = documents.filter((d: any) => d.documentType === 'INVOICE');
        const totalRevenue = invoices.reduce((sum: number, doc: any) => sum + (doc.amount || 0), 0);
        const totalCollected = invoices
          .filter((doc: any) => doc.paid === true)
          .reduce((sum: number, doc: any) => sum + (doc.amount || 0), 0);
        const outstanding = totalRevenue - totalCollected;

        const totalExpenses = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        const catsBreakdown = categories.map((cat: any) => ({
          name: cat.name,
          amount: cat.totalPayments || 0,
          count: cat.paymentsCount || 0
        })).filter((cat: any) => cat.amount > 0)
           .sort((a: any, b: any) => b.amount - a.amount);

        setCategoriesBreakdown(catsBreakdown);

        // Calculate Project Stats
        // Calculate Project Stats
        const activeProjects = projects.filter((p: any) => p.status === 'ON_GOING').length;
        const completedProjects = projects.length - activeProjects;

        // Get Recent Projects (Top 5 by projectDate)
        const sortedProjects = [...projects].sort((a: any, b: any) => {
          const dateA = new Date(a.projectDate || a.createdAt).getTime();
          const dateB = new Date(b.projectDate || b.createdAt).getTime();
          return dateB - dateA;
        }).slice(0, 5);

        const recentProjs = sortedProjects.map((p: any) => ({
          id: p.id,
          name: p.name,
          clientName: p.client?.name || 'Unknown Client',
          status: p.status,
          date: p.projectDate || p.createdAt
        }));

        // Get Recent Documents (Top 5 by documentDate)
        const sortedDocs = [...documents].sort((a: any, b: any) => {
          const dateA = new Date(a.documentDate || a.createdAt).getTime();
          const dateB = new Date(b.documentDate || b.createdAt).getTime();
          return dateB - dateA;
        }).slice(0, 5);

        const recentDocs = sortedDocs.map((d: any) => ({
          id: d.id,
          name: d.documentName,
          projectName: d.project?.name || 'Unknown Project',
          type: d.documentType,
          date: d.documentDate || d.createdAt
        }));

        setStats({
          clients: clients.length,
          projects: projects.length,
          activeProjects,
          completedProjects,
          documents: documents.length,
          totalRevenue,
          totalCollected,
          outstanding,
          totalExpenses,
          netProfit
        });
        setRecentProjects(recentProjs);
        setRecentDocuments(recentDocs);
        setLoading(false);
      }
    ).catch(err => {
      console.error("Failed to load dashboard data", err);
      setLoading(false);
    });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const statusBadge = (status: string) => {
    const cls = status === 'ON_GOING' ? 'badge-on-hold' : status === 'COMPLETE_SOLVED' ? 'badge-completed' : status === 'COMPLETE_NOT_SOLVED' ? 'badge-active' : 'badge-danger';
    const label = status === 'ON_GOING' ? 'On Going' : status === 'COMPLETE_SOLVED' ? 'Complete Solved' : status === 'COMPLETE_NOT_SOLVED' ? 'Complete Not Solved' : status === 'CANCELLED' ? 'Cancelled' : status;
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  if (loading) {
    return <div style={{ padding: '40px', color: '#666' }}>Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your business performance</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/projects')}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Financial Overview Row */}
      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DollarSign size={20} color="#04a89a" /> Financial Performance
      </h3>
      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(4, 168, 154, 0.1) 0%, rgba(4, 168, 154, 0.05) 100%)', borderColor: 'rgba(4, 168, 154, 0.2)' }}>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: '#04a89a' }}>{formatCurrency(stats.totalRevenue)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Across {stats.projects} projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Collected</div>
          <div className="stat-value">{formatCurrency(stats.totalCollected)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Paid Invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value" style={{ color: stats.outstanding > 0 ? '#ef4444' : '#64748b' }}>
            {formatCurrency(stats.outstanding)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Pending Payments</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{formatCurrency(stats.totalExpenses)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Outgoing Payments</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <div className="stat-label">Net Profit</div>
          <div className="stat-value" style={{ color: stats.netProfit >= 0 ? '#3b82f6' : '#ef4444' }}>{formatCurrency(stats.netProfit)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Revenue - Expenses</div>
        </div>
      </div>

      {/* Project Health Row */}
      <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '32px 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={20} color="#3b82f6" /> Business Health
      </h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label"><FolderKanban size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Active Projects</div>
          <div className="stat-value">{stats.activeProjects}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>In progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><TrendingUp size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Total Clients</div>
          <div className="stat-value">{stats.clients}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Active relationships</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FileText size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />Total Documents</div>
          <div className="stat-value">{stats.documents}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Files managed</div>
        </div>
      </div>

      {/* Recent Activity Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '32px' }}>

        {/* Recent Projects */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderKanban size={16} /> Recent Projects
            </span>
            <button className="btn-sm btn-secondary" onClick={() => navigate('/projects')}>View All</button>
          </div>
          <div className="table-container">
            <table style={{ minWidth: 'auto' }}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: '#666' }}>No projects yet</td></tr>
                ) : (
                  recentProjects.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{new Date(p.date).toLocaleDateString()}</div>
                      </td>
                      <td>{p.clientName}</td>
                      <td>{statusBadge(p.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} /> Recent Documents
            </span>
            <button className="btn-sm btn-secondary" onClick={() => navigate('/documents')}>View All</button>
          </div>
          <div className="table-container">
            <table style={{ minWidth: 'auto' }}>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: '#666' }}>No recently added documents</td></tr>
                ) : (
                  recentDocuments.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{d.name}</div>
                        <div style={{ fontSize: '11px', color: '#666' }}>{d.projectName}</div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#2a2a2a',
                          color: '#ccc'
                        }}>
                          {d.type}
                        </span>
                      </td>
                      <td>{new Date(d.date).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={16} /> Expenses by Category
            </span>
            <button className="btn-sm btn-secondary" onClick={() => navigate('/payments')}>View All</button>
          </div>
          <div className="table-container">
            <table style={{ minWidth: 'auto' }}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Total Payments</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {categoriesBreakdown.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: '#666' }}>No expenses recorded yet</td></tr>
                ) : (
                  categoriesBreakdown.map(cat => (
                    <tr key={cat.name}>
                      <td>
                        <span style={{ fontWeight: 500 }}>{cat.name}</span>
                      </td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 500 }}>
                        -{formatCurrency(cat.amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>{cat.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
