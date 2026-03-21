import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, IndianRupee, Package, Calendar, User } from 'lucide-react';
import { Button, Input, Card, CardBody, CardTitle, DataTable, Modal, Select, PageLoader, Badge } from '../components/ui';
import { ordersApi, whatsappApi } from '../services/modules.api';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderId = Number(id);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!orderId,
  });

  const { data: waLogs } = useQuery({
    queryKey: ['whatsapp-log-order', orderId],
    queryFn: () => whatsappApi.getLogByOrder(orderId),
    enabled: !!orderId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const paymentMutation = useMutation({
    mutationFn: (amount: number) => ordersApi.updatePayment(orderId, amount),
    onSuccess: () => {
      toast.success('Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      setShowPaymentModal(false);
      setPaymentAmount('');
    },
    onError: () => toast.error('Failed to record payment'),
  });

  if (isLoading) return <PageLoader />;
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found</div>;

  const o = order as any;

  const statusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
      pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const paymentBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      paid: 'success', partial: 'warning', unpaid: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const itemColumns = [
    { key: 'productType', header: 'Product', render: (item: any) => <span className="capitalize">{item.productType}</span> },
    { key: 'description', header: 'Description', render: (item: any) => item.description || '-' },
    { key: 'quantity', header: 'Quantity', render: (item: any) => Number(item.quantity).toFixed(2) },
    { key: 'unitPrice', header: 'Unit Price', render: (item: any) => `₹${Number(item.unitPrice).toLocaleString()}` },
    { key: 'total', header: 'Total', render: (item: any) => `₹${(Number(item.quantity) * Number(item.unitPrice)).toLocaleString()}` },
  ];

  const totalAmount = Number(o.totalAmount || 0);
  const paymentReceived = Number(o.paymentReceived || 0);
  const balance = totalAmount - paymentReceived;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/orders')}>
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Order {o.orderNumber || `#${o.id}`}
          </h1>
          <p className="text-sm text-gray-500">
            Created {new Date(o.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(o.status)}
          {paymentBadge(o.paymentStatus || 'unpaid')}
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardBody>
            <CardTitle>Order Info</CardTitle>
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Date: {new Date(o.orderDate || o.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span>{o.customer?.contactName || `Customer #${o.customerId}`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-gray-400" />
                <span>Status: </span>
                <select
                  value={o.status}
                  onChange={(e) => statusMutation.mutate(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              {o.notes && (
                <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                  {o.notes}
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <CardTitle>Payment Information</CardTitle>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Received</p>
                <p className="text-xl font-bold text-green-700">₹{paymentReceived.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">Balance</p>
                <p className="text-xl font-bold text-red-700">₹{balance.toLocaleString()}</p>
              </div>
            </div>
            {balance > 0 && (
              <div className="mt-4">
                <Button
                  icon={<IndianRupee className="w-4 h-4" />}
                  onClick={() => setShowPaymentModal(true)}
                >
                  Record Payment
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardBody>
          <CardTitle>Order Items</CardTitle>
          <div className="mt-4">
            <DataTable columns={itemColumns} data={o.items || []} emptyMessage="No items in this order" />
          </div>
        </CardBody>
      </Card>

      {/* WhatsApp Notification History */}
      {waLogs && (waLogs as any[]).length > 0 && (
        <Card className="mt-6">
          <CardBody>
            <CardTitle>WhatsApp Notifications</CardTitle>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {(waLogs as any[]).map((log: any) => (
                    <tr key={log.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        <Badge variant={log.status === 'failed' ? 'danger' : 'success'}>
                          {log.messageType?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">{log.phoneNumber}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={log.status === 'failed' ? 'danger' : 'success'}>{log.status}</Badge>
                      </td>
                      <td className="py-2 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            paymentMutation.mutate(Number(paymentAmount));
          }}
          className="space-y-4"
        >
          <div className="text-sm text-gray-600 mb-2">
            Outstanding balance: <span className="font-semibold">₹{balance.toLocaleString()}</span>
          </div>
          <Input
            label="Payment Amount (₹)"
            type="number"
            step="0.01"
            max={balance}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button type="submit" loading={paymentMutation.isPending}>Record Payment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
