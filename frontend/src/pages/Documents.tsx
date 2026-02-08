import { useState, useEffect, FormEvent } from 'react';
import { api } from '../lib/api';
import { FileText, Download, Trash2, Plus, X } from 'lucide-react';

interface Document {
    id: string;
    name: string;
    filename: string;
    mimetype: string;
    size: number;
    projectId: string;
    project: {
        id: string;
        name: string;
    };
    createdAt: string;
}

interface Project {
    id: string;
    name: string;
}

export function Documents() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        projectId: '',
        name: '',
        file: null as File | null,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [docsData, projectsData] = await Promise.all([
                api.getDocuments(),
                api.getProjects(),
            ]);
            setDocuments(docsData);
            setProjects(projectsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await api.deleteDocument(id);
            setDocuments(documents.filter((d) => d.id !== id));
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document');
        }
    };

    const handleUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.file || !formData.projectId) {
            alert('Please select a project and file');
            return;
        }

        setUploading(true);
        try {
            await api.uploadDocument(formData.projectId, formData.file, formData.name || undefined);
            await loadData();
            setShowModal(false);
            setFormData({ projectId: '', name: '', file: null });
        } catch (error) {
            console.error('Failed to upload document:', error);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Documents</h1>
                </div>
                <div className="card">
                    <div className="card-body">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Documents</h1>
                    <p className="page-subtitle">{documents.length} total documents</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Document
                </button>
            </div>

            <div className="card">
                {documents.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No documents yet. Click "Add Document" to upload a file.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Project</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Uploaded</th>
                                    <th style={{ width: 100 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => (
                                    <tr key={doc.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FileText size={16} style={{ color: 'var(--primary)' }} />
                                                {doc.name}
                                            </div>
                                        </td>
                                        <td>{doc.project.name}</td>
                                        <td>{doc.mimetype.split('/')[1]?.toUpperCase() || 'FILE'}</td>
                                        <td>{formatFileSize(doc.size)}</td>
                                        <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="btn-group">
                                                <a
                                                    href={api.downloadUrl(doc.id)}
                                                    className="btn-icon"
                                                    title="Download"
                                                    download
                                                >
                                                    <Download size={16} />
                                                </a>
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDelete(doc.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
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

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Upload Document</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Project *</label>
                                    <select
                                        className="form-input"
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a project</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Document Name (optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Leave empty to use filename"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">File *</label>
                                    <input
                                        type="file"
                                        className="form-input"
                                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
