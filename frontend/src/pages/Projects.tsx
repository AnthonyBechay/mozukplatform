import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react';

interface Project {
  id: string;
  projectId: string | null;
  name: string;
  description: string | null;
  status: string;
  projectDate: string | null;
  projectLocation: string | null;
  projectTag: string;
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
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'INCOMPLETE',
    clientId: '',
    projectId: '',
    projectDate: '',
    projectLocation: '',
    projectTag: 'MISC'
  });

  const load = () => {
    api.getProjects().then(setProjects);
    api.getClients().then(setClients);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({
      name: '',
      description: '',
      status: 'INCOMPLETE',
      clientId: clients[0]?.id || '',
      projectId: '',
      projectDate: '',
      projectLocation: '',
      projectTag: 'MISC'
    });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Project) => {
    setForm({
      name: p.name,
      description: p.description || '',
      status: p.status,
      clientId: p.client.id,
      projectId: p.projectId || '',
      projectDate: p.projectDate || '',
      projectLocation: p.projectLocation || '',
      projectTag: p.projectTag
    });
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
    const cls = status === 'INCOMPLETE' ? 'badge-on-hold' : status === 'COMPLETE_SOLVED' ? 'badge-completed' : 'badge-active';
    const label = status === 'INCOMPLETE' ? 'Incomplete' : status === 'COMPLETE_SOLVED' ? 'Complete Solved' : 'Complete Not Solved';
    return <span className={`badge ${cls}`}>{label}</span>;
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
              <option value="INCOMPLETE">Incomplete</option>
              <option value="COMPLETE_SOLVED">Complete Solved</option>
              <option value="COMPLETE_NOT_SOLVED">Complete Not Solved</option>
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
