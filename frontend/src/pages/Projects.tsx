import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [projectIdSuffix, setProjectIdSuffix] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'ON_GOING',
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

  // Auto-increment project ID suffix when client is selected
  useEffect(() => {
    if (!editing && form.clientId && clients.length > 0 && projects.length >= 0) {
      // Find all projects for this client
      const clientProjects = projects.filter(p => p.client.id === form.clientId);

      console.log('=== AUTO-INCREMENT DEBUG ===');
      console.log('Selected client ID:', form.clientId);
      console.log('ALL CLIENTS:');
      clients.forEach(c => {
        console.log(`  - ${c.name} | DB ID: ${c.id} | Custom ID: ${c.customId}`);
      });
      const selectedClient = clients.find(c => c.id === form.clientId);
      console.log('SELECTED CLIENT:', selectedClient ? `${selectedClient.name} | DB ID: ${selectedClient.id} | Custom ID: ${selectedClient.customId}` : 'NONE');
      console.log('Total projects loaded:', projects.length);
      console.log('ALL PROJECTS:');
      projects.forEach(p => {
        console.log(`  - ${p.projectId} | Client DB ID: ${p.client?.id} | Client Custom ID: ${p.client?.customId}`);
      });
      console.log('Client projects found:', clientProjects.length);
      console.log('Client project IDs:', clientProjects.map(p => p.projectId));

      // Extract project numbers from suffix after dash (e.g., "1001-003" -> 3)
      const projectNumbers = clientProjects
        .map(p => {
          const match = p.projectId?.match(/-(\d+)$/);  // Match digits after last dash
          const num = match ? parseInt(match[1], 10) : 0;
          console.log(`  Project ${p.projectId} -> extracted number: ${num}`);
          return num;
        })
        .filter(n => n > 0);

      console.log('Extracted numbers:', projectNumbers);
      console.log('Max number:', projectNumbers.length > 0 ? Math.max(...projectNumbers) : 0);

      // Get next number
      const nextNumber = projectNumbers.length > 0
        ? Math.max(...projectNumbers) + 1
        : 1;

      console.log('Next number will be:', nextNumber);
      console.log('=== END DEBUG ===');

      // Set suffix (e.g., "001")
      setProjectIdSuffix(String(nextNumber).padStart(3, '0'));
    }
  }, [form.clientId, editing, clients, projects]);  // Removed projectIdSuffix from dependencies!

  // Auto-generate composite project ID when client or suffix changes
  useEffect(() => {
    if (!editing && form.clientId && clients.length > 0) {
      const selectedClient = clients.find(c => c.id === form.clientId);
      if (selectedClient) {
        const clientId = selectedClient.customId || 'XXXX';
        const fullProjectId = projectIdSuffix
          ? `${clientId}-${projectIdSuffix}`
          : `${clientId}-`;
        setForm(prev => ({ ...prev, projectId: fullProjectId }));
      }
    }
  }, [form.clientId, projectIdSuffix, clients, editing]);

  const openNew = () => {
    setProjectIdSuffix('');
    setForm({
      name: '',
      description: '',
      status: 'ON_GOING',
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
    const cls = status === 'ON_GOING' ? 'badge-on-hold' : status === 'COMPLETE_SOLVED' ? 'badge-completed' : status === 'COMPLETE_NOT_SOLVED' ? 'badge-active' : 'badge-danger';
    const label = status === 'ON_GOING' ? 'On Going' : status === 'COMPLETE_SOLVED' ? 'Complete Solved' : status === 'COMPLETE_NOT_SOLVED' ? 'Complete Not Solved' : 'Cancelled';
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
                {projects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p) => (
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

      {/* Pagination Controls */}
      {projects.length > itemsPerPage && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '20px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span style={{ color: '#888' }}>
            Page <strong style={{ color: '#fff' }}>{currentPage}</strong> of {Math.ceil(projects.length / itemsPerPage)}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(p => Math.min(Math.ceil(projects.length / itemsPerPage), p + 1))}
            disabled={currentPage === Math.ceil(projects.length / itemsPerPage)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

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
            <select
              className="form-input"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              disabled={editing}
              style={editing ? {
                backgroundColor: '#2a2a2a',
                color: '#888',
                cursor: 'not-allowed'
              } : {}}
            >
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
            {!editing && form.clientId && clients.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Client ID - locked/greyed */}
                <input
                  type="text"
                  className="form-input"
                  value={(() => {
                    const selectedClient = clients.find((c: Client) => c.id === form.clientId);
                    return selectedClient ? (selectedClient.customId || 'XXXX') : '';
                  })()}
                  readOnly
                  placeholder="Client ID"
                  style={{
                    flex: '1',
                    backgroundColor: '#2a2a2a',
                    color: '#888',
                    cursor: 'not-allowed',
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: '#888', fontSize: '20px', fontWeight: 'bold' }}>-</span>

                {/* Project Suffix - editable */}
                <input
                  type="text"
                  className="form-input"
                  value={projectIdSuffix}
                  onChange={(e) => setProjectIdSuffix(e.target.value)}
                  placeholder="Project #"
                  style={{ flex: '1', textAlign: 'center' }}
                />
              </div>
            ) : (
              <input
                className="form-input"
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                placeholder={editing ? "Project ID" : "Select a client first"}
                readOnly={!editing}
                style={!editing ? {
                  backgroundColor: '#2a2a2a',
                  color: '#888',
                  cursor: 'not-allowed'
                } : {}}
              />
            )}
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
          message={`Are you sure you want to delete "${deleting.name}"? This will also delete all documents.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
