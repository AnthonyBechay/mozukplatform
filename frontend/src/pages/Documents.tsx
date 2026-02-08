import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { FileText, Download, Trash2 } from 'lucide-react';

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

export function Documents() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const data = await api.getDocuments();
            setDocuments(data);
        } catch (error) {
            console.error('Failed to load documents:', error);
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
            </div>

            <div className="card">
                {documents.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No documents yet. Upload files from project pages.</p>
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
        </div>
    );
}
