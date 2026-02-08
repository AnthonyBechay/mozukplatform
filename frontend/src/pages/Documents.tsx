import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { api } from '../lib/api';
import { FileText, Plus, X, Edit2, Trash2 } from 'lucide-react';

interface Document {
    id: string;
    documentId: string | null;
    documentName: string;
    documentDate: string | null;
    documentType: string;
    documentStatus: string;
    amount: number | null;
    paid: boolean | null;
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
    const [editing, setEditing] = useState<Document | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        projectId: '',
        documentId: '',
        documentName: '',
        documentDate: '',
        documentType: 'OTHERS',
        documentStatus: 'NOT_SUBMITTED',
        amount: '',
        paid: '',
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

    const openNew = () => {
        setEditing(null);
        setFormData({
            projectId: '',
            documentId: '',
            documentName: '',
            documentDate: '',
            documentType: 'OTHERS',
            documentStatus: 'NOT_SUBMITTED',
            amount: '',
            paid: '',
        });
        setShowModal(true);
    };

    const openEdit = (doc: Document) => {
        setEditing(doc);
        setFormData({
            projectId: doc.projectId,
            documentId: doc.documentId || '',
            documentName: doc.documentName,
            documentDate: doc.documentDate ? doc.documentDate.split('T')[0] : '',
            documentType: doc.documentType,
            documentStatus: doc.documentStatus,
            amount: doc.amount !== null ? String(doc.amount) : '',
            paid: doc.paid !== null ? String(doc.paid) : '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.projectId || !formData.documentName) {
            alert('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const data: any = {
                projectId: formData.projectId,
                documentName: formData.documentName,
                documentType: formData.documentType,
                documentStatus: formData.documentStatus,
            };

            if (formData.documentId) data.documentId = formData.documentId;
            if (formData.documentDate) data.documentDate = formData.documentDate;

            // Only include invoice fields if type is INVOICE
            if (formData.documentType === 'INVOICE') {
                if (formData.amount) data.amount = formData.amount;
                if (formData.paid) data.paid = formData.paid;
            }

            if (editing) {
                await api.updateDocument(editing.id, data);
            } else {
                await api.createDocument(data);
            }

            await loadData();
            setShowModal(false);
        } catch (error) {
            console.error('Failed to save document:', error);
            alert('Failed to save document');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
        try {
            await api.deleteDocument(id);
            setDocuments(documents.filter((d) => d.id !== id));
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document');
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusBadge = (status: string) => {
        return status === 'SUBMITTED' ? 'badge-active' : 'badge-on-hold';
    };

    const getTypeBadge = (type: string) => {
        if (type === 'INVOICE') return 'badge-active';
        if (type === 'REPORT') return 'badge-completed';
        return 'badge';
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
                <button className="btn btn-primary" onClick={openNew}>
                    <Plus size={18} />
                    Add Document
                </button>
            </div>

            <div className="card">
                {documents.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={48} />
                        <p>No documents yet. Click "Add Document" to create one.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Document ID</th>
                                    <th>Name</th>
                                    <th>Project</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Paid</th>
                                    <th style={{ width: 100 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => (
                                    <tr key={doc.id}>
                                        <td>{doc.documentId || '-'}</td>
                                        <td>{doc.documentName}</td>
                                        <td>{doc.project.name}</td>
                                        <td>
                                            <span className={`badge ${getTypeBadge(doc.documentType)}`}>
                                                {doc.documentType}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(doc.documentStatus)}`}>
                                                {doc.documentStatus.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{formatDate(doc.documentDate)}</td>
                                        <td>{doc.amount !== null ? `$${doc.amount.toFixed(2)}` : '-'}</td>
                                        <td>{doc.paid !== null ? (doc.paid ? 'Yes' : 'No') : '-'}</td>
                                        <td>
                                            <div className="btn-group">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => openEdit(doc)}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDelete(doc.id, doc.documentName)}
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
                            <h2 className="modal-title">{editing ? 'Edit Document' : 'Add Document'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Project *</label>
                                    <select
                                        name="projectId"
                                        className="form-input"
                                        value={formData.projectId}
                                        onChange={handleChange}
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
                                    <label className="form-label">Document ID</label>
                                    <input
                                        type="text"
                                        name="documentId"
                                        className="form-input"
                                        value={formData.documentId}
                                        onChange={handleChange}
                                        placeholder="Optional unique identifier"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Document Name *</label>
                                    <input
                                        type="text"
                                        name="documentName"
                                        className="form-input"
                                        value={formData.documentName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Document Date</label>
                                    <input
                                        type="date"
                                        name="documentDate"
                                        className="form-input"
                                        value={formData.documentDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Document Type *</label>
                                    <select
                                        name="documentType"
                                        className="form-input"
                                        value={formData.documentType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="INVOICE">Invoice</option>
                                        <option value="REPORT">Report</option>
                                        <option value="OTHERS">Others</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Document Status *</label>
                                    <select
                                        name="documentStatus"
                                        className="form-input"
                                        value={formData.documentStatus}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="SUBMITTED">Submitted</option>
                                        <option value="NOT_SUBMITTED">Not Submitted</option>
                                    </select>
                                </div>

                                {formData.documentType === 'INVOICE' && (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Amount</label>
                                            <input
                                                type="number"
                                                name="amount"
                                                className="form-input"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Paid</label>
                                            <select
                                                name="paid"
                                                className="form-input"
                                                value={formData.paid}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select...</option>
                                                <option value="true">Yes</option>
                                                <option value="false">No</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
