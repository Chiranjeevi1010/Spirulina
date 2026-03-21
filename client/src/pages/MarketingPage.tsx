import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Sprout, MessageSquareQuote, Star, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, CardTitle, DataTable, Modal, Tabs, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { marketingApi } from '../services/modules.api';

export default function MarketingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [farmPage, setFarmPage] = useState(1);
  const [testPage, setTestPage] = useState(1);
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<any>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);

  const [farmForm, setFarmForm] = useState({
    farmName: '',
    farmerName: '',
    location: '',
    district: '',
    state: '',
    trialStartDate: '',
    trialEndDate: '',
    pondSize: '',
    notes: '',
  });

  const [testimonialForm, setTestimonialForm] = useState({
    customerName: '',
    company: '',
    content: '',
    rating: '5',
    productType: 'powder',
  });

  const { data: farms, isLoading: farmsLoading } = useQuery({
    queryKey: ['demo-farms', { page: farmPage, limit: 20 }],
    queryFn: () => marketingApi.listDemoFarms({ page: farmPage, limit: 20 }),
  });

  const { data: testimonials, isLoading: testimonialsLoading } = useQuery({
    queryKey: ['testimonials', { page: testPage, limit: 20 }],
    queryFn: () => marketingApi.listTestimonials({ page: testPage, limit: 20 }),
  });

  const createFarmMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => marketingApi.createDemoFarm(data),
    onSuccess: () => {
      toast.success('Demo farm added');
      queryClient.invalidateQueries({ queryKey: ['demo-farms'] });
      closeFarmModal();
    },
    onError: () => toast.error('Failed to add demo farm'),
  });

  const updateFarmMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => marketingApi.updateDemoFarm(id, data),
    onSuccess: () => {
      toast.success('Demo farm updated');
      queryClient.invalidateQueries({ queryKey: ['demo-farms'] });
      closeFarmModal();
    },
    onError: () => toast.error('Failed to update demo farm'),
  });

  const deleteFarmMutation = useMutation({
    mutationFn: (id: number) => marketingApi.deleteDemoFarm(id),
    onSuccess: () => {
      toast.success('Demo farm deleted');
      queryClient.invalidateQueries({ queryKey: ['demo-farms'] });
    },
    onError: () => toast.error('Failed to delete demo farm'),
  });

  const createTestimonialMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => marketingApi.createTestimonial(data),
    onSuccess: () => {
      toast.success('Testimonial added');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      closeTestimonialModal();
    },
    onError: () => toast.error('Failed to add testimonial'),
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => marketingApi.updateTestimonial(id, data),
    onSuccess: () => {
      toast.success('Testimonial updated');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      closeTestimonialModal();
    },
    onError: () => toast.error('Failed to update testimonial'),
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: (id: number) => marketingApi.deleteTestimonial(id),
    onSuccess: () => {
      toast.success('Testimonial deleted');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
    onError: () => toast.error('Failed to delete testimonial'),
  });

  const resetFarmForm = () => {
    setFarmForm({ farmName: '', farmerName: '', location: '', district: '', state: '', trialStartDate: '', trialEndDate: '', pondSize: '', notes: '' });
  };

  const resetTestimonialForm = () => {
    setTestimonialForm({ customerName: '', company: '', content: '', rating: '5', productType: 'powder' });
  };

  const closeFarmModal = () => {
    setShowFarmModal(false);
    setEditingFarm(null);
    resetFarmForm();
  };

  const closeTestimonialModal = () => {
    setShowTestimonialModal(false);
    setEditingTestimonial(null);
    resetTestimonialForm();
  };

  const handleEditFarm = (item: any) => {
    setEditingFarm(item);
    setFarmForm({
      farmName: item.farmName || '',
      farmerName: item.farmerName || '',
      location: item.location || '',
      district: item.district || '',
      state: item.state || '',
      trialStartDate: item.trialStartDate ? item.trialStartDate.split('T')[0] : '',
      trialEndDate: item.trialEndDate ? item.trialEndDate.split('T')[0] : '',
      pondSize: item.pondSize != null ? String(item.pondSize) : '',
      notes: item.notes || '',
    });
    setShowFarmModal(true);
  };

  const handleEditTestimonial = (item: any) => {
    setEditingTestimonial(item);
    setTestimonialForm({
      customerName: item.customerName || '',
      company: item.company || '',
      content: item.content || '',
      rating: item.rating != null ? String(item.rating) : '5',
      productType: item.productType || 'powder',
    });
    setShowTestimonialModal(true);
  };

  const handleFarmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...farmForm, pondSize: farmForm.pondSize ? Number(farmForm.pondSize) : undefined };
    if (editingFarm) {
      updateFarmMutation.mutate({ id: editingFarm.id, data: payload });
    } else {
      createFarmMutation.mutate(payload);
    }
  };

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...testimonialForm, rating: Number(testimonialForm.rating) };
    if (editingTestimonial) {
      updateTestimonialMutation.mutate({ id: editingTestimonial.id, data: payload });
    } else {
      createTestimonialMutation.mutate(payload);
    }
  };

  const farmList = farms?.data ?? [];
  const farmPagination = farms?.meta;
  const testimonialList = testimonials?.data ?? [];
  const testimonialPagination = testimonials?.meta;

  const farmColumns = [
    { key: 'farmName', header: 'Farm Name' },
    { key: 'farmerName', header: 'Farmer' },
    { key: 'location', header: 'Location', render: (item: any) => [item.location, item.district, item.state].filter(Boolean).join(', ') || '-' },
    { key: 'trialStartDate', header: 'Trial Start', render: (item: any) => item.trialStartDate ? new Date(item.trialStartDate).toLocaleDateString() : '-' },
    { key: 'trialEndDate', header: 'Trial End', render: (item: any) => item.trialEndDate ? new Date(item.trialEndDate).toLocaleDateString() : '-' },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const v: Record<string, 'success' | 'warning' | 'info' | 'default'> = { active: 'success', completed: 'info', planned: 'warning' };
        return <Badge variant={v[item.status] || 'default'}>{item.status || 'active'}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
            onClick={() => handleEditFarm(item)}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            onClick={() => { if (confirm('Delete this demo farm?')) deleteFarmMutation.mutate(item.id); }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const demoFarmsTab = (
    <div>
      <div className="flex justify-end mb-4">
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowFarmModal(true)}>
          Add Demo Farm
        </Button>
      </div>
      {farmsLoading ? <PageLoader /> : farmList.length === 0 ? (
        <EmptyState icon={<Sprout size={48} />} title="No demo farms" description="Add a demo farm to track field trials" action={<Button onClick={() => setShowFarmModal(true)}>Add Demo Farm</Button>} />
      ) : (
        <>
          <DataTable columns={farmColumns} data={farmList} onRowClick={(item: any) => navigate(`/marketing/demo-farms/${item.id}`)} />
          {farmPagination && farmPagination.totalPages > 1 && (
            <div className="mt-4"><Pagination page={farmPagination.page} totalPages={farmPagination.totalPages} onPageChange={setFarmPage} /></div>
          )}
        </>
      )}
    </div>
  );

  const testimonialsTab = (
    <div>
      <div className="flex justify-end mb-4">
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowTestimonialModal(true)}>
          Add Testimonial
        </Button>
      </div>
      {testimonialsLoading ? <PageLoader /> : testimonialList.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote size={48} />} title="No testimonials" description="Collect testimonials from your customers" action={<Button onClick={() => setShowTestimonialModal(true)}>Add Testimonial</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonialList.map((t: any) => (
              <Card key={t.id}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 font-semibold">{(t.customerName || 'A').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{t.customerName}</p>
                      {t.company && <p className="text-xs text-gray-500">{t.company}</p>}
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} className={i < (t.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        onClick={() => handleEditTestimonial(t)}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        onClick={() => { if (confirm('Delete this testimonial?')) deleteTestimonialMutation.mutate(t.id); }}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 italic">"{t.content}"</p>
                  {t.productType && (
                    <div className="mt-3">
                      <Badge variant="default">{t.productType}</Badge>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
          {testimonialPagination && testimonialPagination.totalPages > 1 && (
            <div className="mt-4"><Pagination page={testimonialPagination.page} totalPages={testimonialPagination.totalPages} onPageChange={setTestPage} /></div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketing & Growth</h1>
        <p className="text-sm text-gray-500 mt-1">Manage demo farms and customer testimonials</p>
      </div>

      <Tabs tabs={[
        { id: 'demo-farms', label: 'Demo Farms', icon: <Sprout size={16} />, content: demoFarmsTab },
        { id: 'testimonials', label: 'Testimonials', icon: <MessageSquareQuote size={16} />, content: testimonialsTab },
      ]} />

      {/* Add/Edit Demo Farm Modal */}
      <Modal isOpen={showFarmModal} onClose={closeFarmModal} title={editingFarm ? 'Edit Demo Farm' : 'Add Demo Farm'} size="lg">
        <form onSubmit={handleFarmSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Farm Name" value={farmForm.farmName} onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })} required />
            <Input label="Farmer Name" value={farmForm.farmerName} onChange={(e) => setFarmForm({ ...farmForm, farmerName: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Location" value={farmForm.location} onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })} />
            <Input label="District" value={farmForm.district} onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })} />
            <Input label="State" value={farmForm.state} onChange={(e) => setFarmForm({ ...farmForm, state: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Trial Start" type="date" value={farmForm.trialStartDate} onChange={(e) => setFarmForm({ ...farmForm, trialStartDate: e.target.value })} />
            <Input label="Trial End" type="date" value={farmForm.trialEndDate} onChange={(e) => setFarmForm({ ...farmForm, trialEndDate: e.target.value })} />
            <Input label="Pond Size (sq ft)" type="number" value={farmForm.pondSize} onChange={(e) => setFarmForm({ ...farmForm, pondSize: e.target.value })} />
          </div>
          <Input label="Notes" value={farmForm.notes} onChange={(e) => setFarmForm({ ...farmForm, notes: e.target.value })} placeholder="Additional notes..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={closeFarmModal}>Cancel</Button>
            <Button type="submit" loading={createFarmMutation.isPending || updateFarmMutation.isPending}>
              {editingFarm ? 'Update Farm' : 'Add Farm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Testimonial Modal */}
      <Modal isOpen={showTestimonialModal} onClose={closeTestimonialModal} title={editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}>
        <form onSubmit={handleTestimonialSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer Name" value={testimonialForm.customerName} onChange={(e) => setTestimonialForm({ ...testimonialForm, customerName: e.target.value })} required />
            <Input label="Company" value={testimonialForm.company} onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Rating" options={[{ value: '5', label: '5 Stars' }, { value: '4', label: '4 Stars' }, { value: '3', label: '3 Stars' }, { value: '2', label: '2 Stars' }, { value: '1', label: '1 Star' }]} value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value })} />
            <Select label="Product Type" options={[{ value: 'powder', label: 'Powder' }, { value: 'tablets', label: 'Tablets' }, { value: 'capsules', label: 'Capsules' }, { value: 'general', label: 'General' }]} value={testimonialForm.productType} onChange={(e) => setTestimonialForm({ ...testimonialForm, productType: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial</label>
            <textarea
              className="input-field min-h-[100px]"
              value={testimonialForm.content}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
              required
              placeholder="Customer's testimonial..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={closeTestimonialModal}>Cancel</Button>
            <Button type="submit" loading={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}>
              {editingTestimonial ? 'Update Testimonial' : 'Add Testimonial'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
