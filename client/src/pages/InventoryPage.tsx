import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Package, AlertTriangle, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, CardTitle, DataTable, Modal, Tabs, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { inventoryApi, batchesApi } from '../services/modules.api';

export default function InventoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [batchPage, setBatchPage] = useState(1);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [batchForm, setBatchForm] = useState({
    batchNumber: '',
    productType: 'powder',
    quantity: '',
    productionDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  });

  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.list(),
  });

  const { data: batchesData, isLoading: batchesLoading } = useQuery({
    queryKey: ['batches', { page: batchPage, limit: 20 }],
    queryFn: () => batchesApi.list({ page: batchPage, limit: 20 }),
  });

  const { data: expiring, isLoading: expiringLoading } = useQuery({
    queryKey: ['batches-expiring'],
    queryFn: () => batchesApi.getExpiring(30),
  });

  const createBatchMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => batchesApi.create(data),
    onSuccess: () => {
      toast.success('Batch created');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowBatchModal(false);
      resetBatchForm();
    },
    onError: () => toast.error('Failed to create batch'),
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => batchesApi.update(id, data),
    onSuccess: () => {
      toast.success('Batch updated');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['batches-expiring'] });
      setShowBatchModal(false);
      setEditingItem(null);
      resetBatchForm();
    },
    onError: () => toast.error('Failed to update batch'),
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id: number) => batchesApi.delete(id),
    onSuccess: () => {
      toast.success('Batch deleted');
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['batches-expiring'] });
    },
    onError: () => toast.error('Failed to delete batch'),
  });

  const resetBatchForm = () => {
    setBatchForm({ batchNumber: '', productType: 'powder', quantity: '', productionDate: new Date().toISOString().split('T')[0], expiryDate: '', notes: '' });
  };

  const handleEditBatch = (item: any) => {
    setEditingItem(item);
    setBatchForm({
      batchNumber: item.batchNumber || '',
      productType: item.productType || 'powder',
      quantity: item.quantity ? String(item.quantity) : '',
      productionDate: item.productionDate ? new Date(item.productionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      notes: item.notes || '',
    });
    setShowBatchModal(true);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      batchNumber: batchForm.batchNumber,
      productType: batchForm.productType,
      quantity: Number(batchForm.quantity),
      productionDate: batchForm.productionDate,
      expiryDate: batchForm.expiryDate || undefined,
      notes: batchForm.notes || undefined,
    };
    if (editingItem) {
      updateBatchMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createBatchMutation.mutate(payload);
    }
  };

  const batches = batchesData?.data ?? [];
  const batchPagination = batchesData?.meta;
  const inventoryList = (inventory as any[]) ?? [];
  const expiringList = (expiring as any[]) ?? [];

  const batchColumns = [
    { key: 'batchNumber', header: 'Batch #' },
    { key: 'productType', header: 'Product', render: (item: any) => <span className="capitalize">{item.productType}</span> },
    { key: 'quantity', header: 'Quantity (kg)', render: (item: any) => Number(item.quantity).toFixed(2) },
    { key: 'productionDate', header: 'Production Date', render: (item: any) => new Date(item.productionDate).toLocaleDateString() },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      render: (item: any) => {
        if (!item.expiryDate) return '-';
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <span className={daysLeft <= 30 ? 'text-red-600 font-medium' : ''}>
            {expiry.toLocaleDateString()}
            {daysLeft <= 30 && daysLeft > 0 && ` (${daysLeft}d)`}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const v: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
          available: 'success', reserved: 'warning', sold: 'info' as any, expired: 'danger',
        };
        return <Badge variant={v[item.status] || 'default'}>{item.status || 'available'}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEditBatch(item); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this batch?')) deleteBatchMutation.mutate(item.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const inventoryTab = (
    <div>
      {invLoading ? <PageLoader /> : inventoryList.length === 0 ? (
        <EmptyState icon={<Package size={48} />} title="No inventory data" description="Inventory will populate as batches are created" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventoryList.map((item: any, idx: number) => (
            <Card key={idx}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 capitalize">{item.productType || item.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{Number(item.quantity || item.totalQuantity || 0).toFixed(1)} kg</p>
                  </div>
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
                {item.batchCount !== undefined && (
                  <p className="text-xs text-gray-400 mt-2">{item.batchCount} batches</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const batchesTab = (
    <div>
      <div className="flex justify-end mb-4">
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowBatchModal(true)}>
          Add Batch
        </Button>
      </div>
      {batchesLoading ? <PageLoader /> : batches.length === 0 ? (
        <EmptyState icon={<Package size={48} />} title="No batches" description="Create your first batch" action={<Button onClick={() => setShowBatchModal(true)}>Add Batch</Button>} />
      ) : (
        <>
          <DataTable
            columns={batchColumns}
            data={batches}
            onRowClick={(item: any) => navigate(`/batches/${item.id}`)}
          />
          {batchPagination && batchPagination.totalPages > 1 && (
            <div className="mt-4"><Pagination page={batchPagination.page} totalPages={batchPagination.totalPages} onPageChange={setBatchPage} /></div>
          )}
        </>
      )}
    </div>
  );

  const expiringTab = (
    <div>
      {expiringLoading ? <PageLoader /> : expiringList.length === 0 ? (
        <EmptyState icon={<Clock size={48} />} title="No expiring batches" description="No batches expiring within 30 days" />
      ) : (
        <div className="space-y-3">
          {expiringList.map((batch: any) => {
            const daysLeft = Math.ceil((new Date(batch.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <Card key={batch.id} onClick={() => navigate(`/batches/${batch.id}`)}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{batch.batchNumber}</p>
                      <p className="text-sm text-gray-500 capitalize">{batch.productType} - {Number(batch.quantity).toFixed(1)} kg</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={daysLeft <= 7 ? 'danger' : 'warning'}>
                        {daysLeft <= 0 ? 'Expired' : `${daysLeft} days left`}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        Expires: {new Date(batch.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory & Batch Management</h1>
        <p className="text-sm text-gray-500 mt-1">Track products, batches, and expiry dates</p>
      </div>

      <Tabs tabs={[
        { id: 'inventory', label: 'Inventory', icon: <Package size={16} />, content: inventoryTab },
        { id: 'batches', label: 'Batches', icon: <Package size={16} />, content: batchesTab },
        { id: 'expiring', label: 'Expiring', icon: <AlertTriangle size={16} />, content: expiringTab },
      ]} />

      {/* Add/Edit Batch Modal */}
      <Modal isOpen={showBatchModal} onClose={() => { setShowBatchModal(false); setEditingItem(null); resetBatchForm(); }} title={editingItem ? 'Edit Batch' : 'Add Batch'}>
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          <Input label="Batch Number" value={batchForm.batchNumber} onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })} required />
          <Select
            label="Product Type"
            options={[
              { value: 'powder', label: 'Powder' },
              { value: 'tablets', label: 'Tablets' },
              { value: 'capsules', label: 'Capsules' },
              { value: 'flakes', label: 'Flakes' },
              { value: 'extract', label: 'Extract' },
            ]}
            value={batchForm.productType}
            onChange={(e) => setBatchForm({ ...batchForm, productType: e.target.value })}
          />
          <Input label="Quantity (kg)" type="number" step="0.01" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} required />
          <Input label="Production Date" type="date" value={batchForm.productionDate} onChange={(e) => setBatchForm({ ...batchForm, productionDate: e.target.value })} required />
          <Input label="Expiry Date" type="date" value={batchForm.expiryDate} onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })} />
          <Input label="Notes" value={batchForm.notes} onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })} placeholder="Optional notes..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => { setShowBatchModal(false); setEditingItem(null); resetBatchForm(); }}>Cancel</Button>
            <Button type="submit" loading={createBatchMutation.isPending || updateBatchMutation.isPending}>{editingItem ? 'Update Batch' : 'Create Batch'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
