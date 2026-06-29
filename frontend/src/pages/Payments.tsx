import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Plus, Trash2, Tag, DollarSign } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  totalPayments: number;
  paymentsCount: number;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'payments' | 'categories'>('payments');
  
  // Payment Form State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    categoryId: '',
  });

  // Category Form State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  // Delete State
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const loadData = async () => {
    try {
      const [paymentsData, categoriesData] = await Promise.all([
        api.getPayments(),
        api.getPaymentCategories(),
      ]);
      setPayments(paymentsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load payments data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPayment = async () => {
    if (!paymentForm.amount || !paymentForm.categoryId) return;
    try {
      await api.createPayment(paymentForm);
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        categoryId: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) return;
    try {
      await api.createPaymentCategory({ name: categoryName });
      setShowCategoryModal(false);
      setCategoryName('');
      loadData();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;
    try {
      await api.deletePayment(deletingPayment.id);
      setDeletingPayment(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete payment:', error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await api.deletePaymentCategory(deletingCategory.id);
      setDeletingCategory(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalPaymentsSum = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Track and manage outgoing business payments</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
            <Plus size={16} /> New Category
          </button>
          <button className="btn btn-primary" onClick={() => {
            setPaymentForm(prev => ({
              ...prev,
              categoryId: categories.length > 0 ? categories[0].id : ''
            }));
            setShowPaymentModal(true);
          }}>
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="stat-label">Total Outgoing</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{formatCurrency(totalPaymentsSum)}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Across {payments.length} transactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{categories.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Active payment purposes</div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #2a2a2a', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'payments' ? '#04a89a' : '#64748b',
            borderBottom: activeTab === 'payments' ? '2px solid #04a89a' : 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          Payments Log
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'categories' ? '#04a89a' : '#64748b',
            borderBottom: activeTab === 'categories' ? '2px solid #04a89a' : 'none',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          Categories & Breakdown
        </button>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'payments' ? (
          payments.length === 0 ? (
            <div className="empty-state">
              <DollarSign size={48} />
              <p>No payments recorded yet. Record your first payment to get started.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={{ color: '#64748b' }}>{new Date(p.date).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#2a2a2a',
                          color: '#04a89a',
                          border: '1px solid rgba(4, 168, 154, 0.2)'
                        }}>
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td>{p.description || '—'}</td>
                      <td style={{ color: '#ef4444', fontWeight: 500 }}>-{formatCurrency(p.amount)}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn-icon danger" onClick={() => setDeletingPayment(p)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          categories.length === 0 ? (
            <div className="empty-state">
              <Tag size={48} />
              <p>No categories added yet. Add a category to classify payments.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Number of Payments</th>
                    <th>Total Payments</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td>{c.paymentsCount}</td>
                      <td style={{ color: c.totalPayments > 0 ? '#ef4444' : '#64748b', fontWeight: 500 }}>
                        {c.totalPayments > 0 ? `-${formatCurrency(c.totalPayments)}` : '—'}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button className="btn-icon danger" onClick={() => setDeletingCategory(c)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <Modal
          title="Record Payment"
          onClose={() => setShowPaymentModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddPayment} disabled={categories.length === 0}>Save</button>
            </>
          }
        >
          {categories.length === 0 ? (
            <div style={{ color: '#ef4444', padding: '8px 0', fontSize: '14px' }}>
              * You need to create at least one category before recording a payment.
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-input"
                  value={paymentForm.categoryId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, categoryId: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount ($) *</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  className="form-input"
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  placeholder="What is this payment for?"
                />
              </div>
            </>
          )}
        </Modal>
      )}

      {/* New Category Modal */}
      {showCategoryModal && (
        <Modal
          title="New Payment Category"
          onClose={() => setShowCategoryModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddCategory}>Add Category</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              className="form-input"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Rent, Office Supplies, Advertising"
              required
            />
          </div>
        </Modal>
      )}

      {/* Delete Payment Confirm Dialog */}
      {deletingPayment && (
        <ConfirmDialog
          title="Delete Payment Record"
          message={`Are you sure you want to delete this payment of ${formatCurrency(deletingPayment.amount)} under "${deletingPayment.category?.name}"?`}
          onConfirm={handleDeletePayment}
          onCancel={() => setDeletingPayment(null)}
        />
      )}

      {/* Delete Category Confirm Dialog */}
      {deletingCategory && (
        <ConfirmDialog
          title="Delete Payment Category"
          message={`Are you sure you want to delete the category "${deletingCategory.name}"? This will also delete all associated payments in this category.`}
          onConfirm={handleDeleteCategory}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}
