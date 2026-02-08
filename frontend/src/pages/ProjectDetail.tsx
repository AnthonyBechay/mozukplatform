import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ChevronRight, Upload, Trash2, Download, FileText } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  client: { id: string; name: string };
  documents: Document[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');

  const load = () => {
    if (id) api.getProject(id).then(setProject);
  };

  useEffect(() => { load(); }, [id]);

  const handleUpload = async () => {
    if (!selectedFile || !id) return;
    setUploading(true);
    try {
      await api.uploadDocument(id, selectedFile, docName || undefined);
      setShowUpload(false);
      setSelectedFile(null);
      setDocName('');
      load();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) {
      await api.deleteDocument(deleting.id);
      setDeleting(null);
      load();
    }
  };

  const handleDownload = (doc: Document) => {
    const token = localStorage.getItem('token');
    const url = api.downloadUrl(doc.id);
    const a = document.createElement('a');
    a.href = `${url}?token=${token}`;
    a.download = doc.name;
    a.click();
  };

  if (!project) return null;

  const statusBadge = (status: string) => {
    const cls = status === 'active' ? 'badge-active' : status === 'completed' ? 'badge-completed' : 'badge-on-hold';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/clients">Clients</Link>
        <ChevronRight size={14} />
        <Link to={`/clients/${project.client.id}`}>{project.client.name}</Link>
        <ChevronRight size={14} />
        <span>{project.name}</span>
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name} {statusBadge(project.status)}</h1>
          <p className="page-subtitle">{project.description || 'No description'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          <Upload size={16} /> Upload Document
        </button>
      </div>

      <div className="card">
        <div className="card-header">Documents ({project.documents.length})</div>
        {project.documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No documents yet. Upload a file to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {project.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 500 }}>{doc.name}</td>
                    <td style={{ color: '#64748b' }}>{doc.mimetype}</td>
                    <td>{formatBytes(doc.size)}</td>
                    <td style={{ color: '#64748b' }}>{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn-icon" onClick={() => handleDownload(doc)}>
                          <Download size={15} />
                        </button>
                        <button className="btn-icon danger" onClick={() => setDeleting(doc)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUpload && (
        <Modal
          title="Upload Document"
          onClose={() => { setShowUpload(false); setSelectedFile(null); setDocName(''); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowUpload(false); setSelectedFile(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Document Name (optional)</label>
            <input className="form-input" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Leave blank to use filename" />
          </div>
          <div
            className="file-drop"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={32} color="#94a3b8" />
            <p>{selectedFile ? selectedFile.name : 'Click to select a file'}</p>
            <input
              ref={fileRef}
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Document"
          message={`Are you sure you want to delete "${deleting.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
