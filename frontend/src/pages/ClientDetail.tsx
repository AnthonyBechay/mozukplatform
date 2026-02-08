import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Pencil, Trash2, ChevronRight, FolderKanban } from 'lucide-react';

interface Document {
  id: string;
  projectId: string;
  amount: number | null;
  paid: boolean | null;
}

interface Project {
  id: string;
  projectId: string | null;
  name: string;
  description: string | null;
  status: string;
  projectDate: string | null;
  projectLocation: string | null;
  projectTag: string;
  createdAt: string;
}

interface Client {
  id: string;
  customId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  projects: Project[];
}

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'ON_GOING',
    projectId: '',
    projectDate: '',
    projectLocation: '',
    projectTag: 'MISC'
  });

  const load = async () => {
    if (!id) return;
    try {
      const [clientData, docsData] = await Promise.all([
        api.getClient(id),
        api.getDocuments(),
      ]);
      setClient(clientData);
      setDocuments(docsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  useEffect(() => { load(); }, [id]);

  const openNew = () => {
    setForm({
      name: '',
      description: '',
      status: 'ON_GOING',
      projectId: '',
      projectDate: '',
      projectLocation: '',
      projectTag: 'MISC'
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    await api.createProject({ ...form, clientId: id });
    setShowForm(false);
    load();
  };

  const handleDelete = async () => {
    if (deleting) {
      await api.deleteProject(deleting.id);
      setDeleting(null);
      load();
    }
  };

  if (!client) return null;

  const statusBadge = (status: string) => {
    const cls = status === 'active' ? 'badge-active' : status === 'completed' ? 'badge-completed' : 'badge-on-hold';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  // Calculate financial totals for each project
  const getProjectFinancials = (projectId: string) => {
    const projectDocs = documents.filter(doc => doc.projectId === projectId);
    const totalInvoice = projectDocs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
    const totalPaid = projectDocs
      .filter(doc => doc.paid === true)
      .reduce((sum, doc) => sum + (doc.amount || 0), 0);
    const balance = totalInvoice - totalPaid;
    return { totalInvoice, totalPaid, balance };
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/clients">Clients</Link>
        <ChevronRight size={14} />
        <span>{client.name}</span>
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{client.name}</h1>
          <p className="page-subtitle">
            {[client.company, client.email, client.phone].filter(Boolean).join(' · ') || 'No details'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Add Project
        </button>
      </div>

      {client.notes && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">Notes</div>
          <div className="card-body" style={{ fontSize: 14, color: '#64748b' }}>{client.notes}</div>
        </div>
      )}

      <div className="card">
        <div className="card-header">Projects ({client.projects.length})</div>
        {client.projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={48} />
            <p>No projects yet. Create a project for this client.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Total Invoice</th>
                  <th>Total Paid</th>
                  <th>Balance</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {client.projects.map((p) => {
                  const financials = getProjectFinancials(p.id);
                  return (
                    <tr key={p.id}>
                      <td>
                        <a onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer', fontWeight: 500 }}>
                          {p.name}
                        </a>
                      </td>
                      <td>{statusBadge(p.status)}</td>
                      <td style={{ color: '#64748b' }}>{p.description || '—'}</td>
                      <td>${financials.totalInvoice.toFixed(2)}</td>
                      <td>${financials.totalPaid.toFixed(2)}</td>
                      <td style={{ color: financials.balance > 0 ? '#ef4444' : '#04a89a', fontWeight: 500 }}>
                        ${financials.balance.toFixed(2)}
                      </td>
                      <td>
                        <button className="btn-icon danger" onClick={() => setDeleting(p)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal
          title="New Project"
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Create</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Project ID</label>
            <input className="form-input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} placeholder="Optional unique identifier" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Project Date</label>
            <input className="form-input" type="date" value={form.projectDate} onChange={(e) => setForm({ ...form, projectDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Project Location</label>
            <input className="form-input" value={form.projectLocation} onChange={(e) => setForm({ ...form, projectLocation: e.target.value })} placeholder="Location" />
          </div>
          <div className="form-group">
            <label className="form-label">Project Tag</label>
            <select className="form-input" value={form.projectTag} onChange={(e) => setForm({ ...form, projectTag: e.target.value })}>
              <option value="MISC">Misc</option>
              <option value="MOZUK">Mozuk</option>
              <option value="MOZUK_MARINE">Mozuk Marine</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ON_GOING">On Going</option>
              <option value="COMPLETE_SOLVED">Complete Solved</option>
              <option value="COMPLETE_NOT_SOLVED">Complete Not Solved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Project"
          message={`Are you sure you want to delete "${deleting.name}"? This will also delete all associated documents.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
