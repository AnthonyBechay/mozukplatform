import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  client: { id: string; name: string };
  _count: { documents: number };
}

interface Client {
  id: string;
  name: string;
}

export function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'active', clientId: '' });

  const load = () => {
    api.getProjects().then(setProjects);
    api.getClients().then(setClients);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ name: '', description: '', status: 'active', clientId: clients[0]?.id || '' });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Project) => {
    setForm({ name: p.name, description: p.description || '', status: p.status, clientId: p.client.id });
    setEditing(p);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editing) {
      await api.updateProject(editing.id, form);
    } else {
      await api.createProject(form);
    }
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

  const statusBadge = (status: string) => {
    const cls = status === 'active' ? 'badge-active' : status === 'completed' ? 'badge-completed' : 'badge-on-hold';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} total projects</p>
        </div>
        <button className="btn btn-primary" onClick={openNew} disabled={clients.length === 0}>
          <Plus size={16} /> Add Project
        </button>
      </div>

      <div className="card">
        {projects.length === 0 ? (
          <div className="empty-state">
            <FolderKanban size={48} />
            <p>No projects yet. {clients.length === 0 ? 'Create a client first.' : 'Add your first project.'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Documents</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <a onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer', fontWeight: 500 }}>
                        {p.name}
                      </a>
                    </td>
                    <td>
                      <a onClick={() => navigate(`/clients/${p.client.id}`)} style={{ cursor: 'pointer' }}>
                        {p.client.name}
                      </a>
                    </td>
                    <td>{statusBadge(p.status)}</td>
                    <td>{p._count.documents}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn-icon" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                        <button className="btn-icon danger" onClick={() => setDeleting(p)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <Modal
          title={editing ? 'Edit Project' : 'New Project'}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select className="form-input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Project"
          message={`Are you sure you want to delete "${deleting.name}"? This will also delete all documents.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
