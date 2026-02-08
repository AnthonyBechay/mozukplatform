import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ChevronRight, Edit2, Trash2, ExternalLink, FileText } from 'lucide-react';

interface Document {
  id: string;
  documentId: string | null;
  documentName: string;
  documentDate: string | null;
  documentType: string;
  documentStatus: string;
  documentLink: string | null;
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
  description: string | null;
  status: string;
  client: { id: string; name: string };
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      const [projectData, docsData] = await Promise.all([
        api.getProject(id),
        api.getDocuments(),
      ]);
      setProject(projectData);
      // Filter documents for this project
      const projectDocs = docsData.filter((doc: Document) => doc.projectId === id);
      setDocuments(projectDocs);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  const statusBadge = (status: string) => {
    const cls = status === 'SUBMITTED' ? 'badge-active' : 'badge-pending';
    return <span className={`badge ${cls}`}>{status.replace('_', ' ')}</span>;
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      INVOICE: 'badge-active',
      REPORT: 'badge-pending',
      OTHERS: 'badge-on-hold',
    };
    return <span className={`badge ${colors[type] || 'badge-on-hold'}`}>{type}</span>;
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
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.description || 'No description'}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          Documents ({documents.length})
        </div>
        {documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No documents found for this project.</p>
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
                  <th>Link</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 500 }}>{doc.documentId || '-'}</td>
                    <td>{doc.documentName}</td>
                    <td>{doc.project.name}</td>
                    <td>{typeBadge(doc.documentType)}</td>
                    <td>{statusBadge(doc.documentStatus)}</td>
                    <td>{doc.documentDate ? new Date(doc.documentDate).toLocaleDateString() : '-'}</td>
                    <td>
                      {doc.documentLink ? (
                        <a
                          href={doc.documentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-icon"
                          title="Open link"
                        >
                          <ExternalLink size={16} />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{doc.amount ? `$${doc.amount.toFixed(2)}` : '-'}</td>
                    <td>{doc.paid === null ? '-' : doc.paid ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn-icon"
                          onClick={() => {/* Edit functionality */ }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => {/* Delete functionality */ }}
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
