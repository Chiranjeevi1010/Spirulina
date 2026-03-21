import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, CardTitle, DataTable, Modal, Tabs, PageLoader, Badge } from '../components/ui';
import { customersApi } from '../services/modules.api';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const customerId = Number(id);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersApi.getById(customerId),
    enabled: !!customerId,
  });

  const { data: orders } = useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: () => customersApi.getOrderHistory(customerId),
    enabled: !!customerId,
  });

  const [editForm, setEditForm] = useState({
    contactName: '',
    companyName: '',
    customerType: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    creditLimitAmount: '',
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => customersApi.update(customerId, data),
    onSuccess: () => {
      toast.success('Customer updated');
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      setShowEditModal(false);
    },
    onError: () => toast.error('Failed to update customer'),
  });

  const openEditModal = () => {
    if (customer) {
      const c = customer as any;
      setEditForm({
        contactName: c.contactName || '',
        companyName: c.companyName || '',
        customerType: c.customerType || 'retail',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        gstNumber: c.gstNumber || '',
        creditLimitAmount: c.creditLimitAmount ? String(c.creditLimitAmount) : '',
      });
    }
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      contactName: editForm.contactName,
      companyName: editForm.companyName || undefined,
      customerType: editForm.customerType,
      email: editForm.email || undefined,
      phone: editForm.phone || undefined,
      address: editForm.address || undefined,
      gstNumber: editForm.gstNumber || undefined,
      creditLimitAmount: editForm.creditLimitAmount ? Number(editForm.creditLimitAmount) : undefined,
    });
  };

  if (isLoading) return <PageLoader />;
  if (!customer) return <div className="text-center py-12 text-gray-500">Customer not found</div>;

  const c = customer as any;

  const orderColumns = [
    { key: 'orderNumber', header: 'Order #', render: (item: any) => item.orderNumber || `#${item.id}` },
    { key: 'orderDate', header: 'Date', render: (item: any) => new Date(item.orderDate || item.createdAt).toLocaleDateString() },
    { key: 'totalAmount', header: 'Amount', render: (item: any) => `₹${Number(item.totalAmount || 0).toLocaleString()}` },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (item: any) => {
        const v: Record<string, 'success' | 'warning' | 'danger' | 'default'> = { paid: 'success', partial: 'warning', unpaid: 'danger' };
        return <Badge variant={v[item.paymentStatus] || 'default'}>{item.paymentStatus || 'unpaid'}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <Badge variant={item.status === 'delivered' ? 'success' : item.status === 'cancelled' ? 'danger' : 'info'}>{item.status}</Badge>,
    },
  ];

  const ordersTab = (
    <DataTable
      columns={orderColumns}
      data={(orders as any[]) ?? []}
      emptyMessage="No orders found for this customer"
      onRowClick={(item: any) => navigate(`/orders/${item.id}`)}
    />
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/customers')}>
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{c.contactName}</h1>
          {c.companyName && <p className="text-sm text-gray-500">{c.companyName}</p>}
        </div>
        <Button variant="secondary" icon={<Edit className="w-4 h-4" />} onClick={openEditModal}>
          Edit
        </Button>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardBody>
            <CardTitle>Contact Information</CardTitle>
            <div className="space-y-3 mt-4">
              {c.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{c.email}</span>
                </div>
              )}
              {c.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{c.phone}</span>
                </div>
              )}
              {c.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{c.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-gray-400" />
                <Badge variant="info">{c.customerType}</Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Credit Information</CardTitle>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Credit Limit</span>
                <span className="font-medium">₹{Number(c.creditLimitAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Outstanding</span>
                <span className={`font-medium ${Number(c.outstandingAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Number(c.outstandingAmount || 0).toLocaleString()}
                </span>
              </div>
              {c.gstNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST Number</span>
                  <span className="font-medium">{c.gstNumber}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Status</CardTitle>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge variant={c.status === 'active' ? 'success' : 'default'}>{c.status || 'active'}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-medium">{(orders as any[])?.length ?? 0}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Orders Tab */}
      <Tabs tabs={[
        { id: 'orders', label: 'Orders', content: ordersTab },
      ]} />

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Customer" size="lg">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={editForm.contactName} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} required />
            <Input label="Company Name" value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} />
          </div>
          <Select
            label="Customer Type"
            options={[
              { value: 'retail', label: 'Retail' },
              { value: 'wholesale', label: 'Wholesale' },
              { value: 'distributor', label: 'Distributor' },
              { value: 'institutional', label: 'Institutional' },
            ]}
            value={editForm.customerType}
            onChange={(e) => setEditForm({ ...editForm, customerType: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </div>
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="GST Number" value={editForm.gstNumber} onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })} />
            <Input label="Credit Limit (₹)" type="number" value={editForm.creditLimitAmount} onChange={(e) => setEditForm({ ...editForm, creditLimitAmount: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
