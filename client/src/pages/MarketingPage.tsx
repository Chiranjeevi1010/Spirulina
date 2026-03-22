import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Sprout, MessageSquareQuote, Star, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, CardTitle, DataTable, Modal, Tabs, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { marketingApi } from '../services/modules.api';

export default function MarketingPage() {
  const { t } = useTranslation();
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
      toast.success(t('marketing.demoFarmAdded'));
      queryClient.invalidateQueries({ queryKey: ['demo-farms'] });
      closeFarmModal();
    },
    onError: () => toast.error(t('marketing.demoFarmAddFailed')),
  });

  const updateFarmMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => marketingApi.updateDemoFarm(id, data),
    onSuccess: () => {
      toast.success(t('marketing.demoFarmUpdated'));
      queryClient.invalidateQueries({ queryKey: ['demo-farms'] });
      closeFarmModal();
    },
    onError: () => toast.error(t('marketing.demoFarmUpdateFailed')),
  });

  const deleteFarmMutation = useMutation({
    mutationFn: (id: number) => marketingApi.deleteDemoFarm(id),
    onSuccess: () => {
      toast.success(t('marketing.demoFarmDeleted'));
      queryClient.invalidateQueries({ queryKey: ['demo-farms'] });
    },
    onError: () => toast.error(t('marketing.demoFarmDeleteFailed')),
  });

  const createTestimonialMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => marketingApi.createTestimonial(data),
    onSuccess: () => {
      toast.success(t('marketing.testimonialAdded'));
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      closeTestimonialModal();
    },
    onError: () => toast.error(t('marketing.testimonialAddFailed')),
  });

  const updateTestimonialMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => marketingApi.updateTestimonial(id, data),
    onSuccess: () => {
      toast.success(t('marketing.testimonialUpdated'));
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      closeTestimonialModal();
    },
    onError: () => toast.error(t('marketing.testimonialUpdateFailed')),
  });

  const deleteTestimonialMutation = useMutation({
    mutationFn: (id: number) => marketingApi.deleteTestimonial(id),
    onSuccess: () => {
      toast.success(t('marketing.testimonialDeleted'));
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
    onError: () => toast.error(t('marketing.testimonialDeleteFailed')),
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
    { key: 'farmName', header: t('marketing.farmName') },
    { key: 'farmerName', header: t('marketing.farmer') },
    { key: 'location', header: t('ponds.location'), render: (item: any) => [item.location, item.district, item.state].filter(Boolean).join(', ') || '-' },
    { key: 'trialStartDate', header: t('marketing.trialStart'), render: (item: any) => item.trialStartDate ? new Date(item.trialStartDate).toLocaleDateString() : '-' },
    { key: 'trialEndDate', header: t('marketing.trialEnd'), render: (item: any) => item.trialEndDate ? new Date(item.trialEndDate).toLocaleDateString() : '-' },
    {
      key: 'status',
      header: t('common.status'),
      render: (item: any) => {
        const v: Record<string, 'success' | 'warning' | 'info' | 'default'> = { active: 'success', completed: 'info', planned: 'warning' };
        return <Badge variant={v[item.status] || 'default'}>{item.status || 'active'}</Badge>;
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
            onClick={() => handleEditFarm(item)}
            title={t('common.edit')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            onClick={() => { if (confirm(t('marketing.deleteDemoFarm'))) deleteFarmMutation.mutate(item.id); }}
            title={t('common.delete')}
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
          {t('marketing.addDemoFarm')}
        </Button>
      </div>
      {farmsLoading ? <PageLoader /> : farmList.length === 0 ? (
        <EmptyState icon={<Sprout size={48} />} title={t('marketing.noDemoFarms')} description={t('marketing.addDemoFarmHelp')} action={<Button onClick={() => setShowFarmModal(true)}>{t('marketing.addDemoFarm')}</Button>} />
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
          {t('marketing.addTestimonial')}
        </Button>
      </div>
      {testimonialsLoading ? <PageLoader /> : testimonialList.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote size={48} />} title={t('marketing.noTestimonials')} description={t('marketing.collectTestimonials')} action={<Button onClick={() => setShowTestimonialModal(true)}>{t('marketing.addTestimonial')}</Button>} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonialList.map((tItem: any) => (
              <Card key={tItem.id}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 font-semibold">{(tItem.customerName || 'A').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{tItem.customerName}</p>
                      {tItem.company && <p className="text-xs text-gray-500">{tItem.company}</p>}
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} className={i < (tItem.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        onClick={() => handleEditTestimonial(tItem)}
                        title={t('common.edit')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        onClick={() => { if (confirm(t('marketing.deleteTestimonial'))) deleteTestimonialMutation.mutate(tItem.id); }}
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 italic">"{tItem.content}"</p>
                  {tItem.productType && (
                    <div className="mt-3">
                      <Badge variant="default">{tItem.productType}</Badge>
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
        <h1 className="text-2xl font-bold text-gray-900">{t('marketing.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('marketing.subtitle')}</p>
      </div>

      <Tabs tabs={[
        { id: 'demo-farms', label: t('marketing.demoFarmsTab'), icon: <Sprout size={16} />, content: demoFarmsTab },
        { id: 'testimonials', label: t('marketing.testimonialsTab'), icon: <MessageSquareQuote size={16} />, content: testimonialsTab },
      ]} />

      {/* Add/Edit Demo Farm Modal */}
      <Modal isOpen={showFarmModal} onClose={closeFarmModal} title={editingFarm ? t('marketing.editDemoFarm') : t('marketing.addDemoFarm')} size="lg">
        <form onSubmit={handleFarmSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('marketing.farmName')} value={farmForm.farmName} onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })} required />
            <Input label={t('marketing.farmerName')} value={farmForm.farmerName} onChange={(e) => setFarmForm({ ...farmForm, farmerName: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('ponds.location')} value={farmForm.location} onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })} />
            <Input label={t('marketing.district')} value={farmForm.district} onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })} />
            <Input label={t('marketing.state')} value={farmForm.state} onChange={(e) => setFarmForm({ ...farmForm, state: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('marketing.trialStart')} type="date" value={farmForm.trialStartDate} onChange={(e) => setFarmForm({ ...farmForm, trialStartDate: e.target.value })} />
            <Input label={t('marketing.trialEnd')} type="date" value={farmForm.trialEndDate} onChange={(e) => setFarmForm({ ...farmForm, trialEndDate: e.target.value })} />
            <Input label={t('marketing.pondSize')} type="number" value={farmForm.pondSize} onChange={(e) => setFarmForm({ ...farmForm, pondSize: e.target.value })} />
          </div>
          <Input label={t('common.notes')} value={farmForm.notes} onChange={(e) => setFarmForm({ ...farmForm, notes: e.target.value })} placeholder={t('leads.additionalNotes')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={closeFarmModal}>{t('common.cancel')}</Button>
            <Button type="submit" loading={createFarmMutation.isPending || updateFarmMutation.isPending}>
              {editingFarm ? t('common.update') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Testimonial Modal */}
      <Modal isOpen={showTestimonialModal} onClose={closeTestimonialModal} title={editingTestimonial ? t('marketing.editTestimonial') : t('marketing.addTestimonial')}>
        <form onSubmit={handleTestimonialSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('marketing.customerName')} value={testimonialForm.customerName} onChange={(e) => setTestimonialForm({ ...testimonialForm, customerName: e.target.value })} required />
            <Input label={t('customers.company')} value={testimonialForm.company} onChange={(e) => setTestimonialForm({ ...testimonialForm, company: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('marketing.rating')} options={[{ value: '5', label: `5 ${t('marketing.stars')}` }, { value: '4', label: `4 ${t('marketing.stars')}` }, { value: '3', label: `3 ${t('marketing.stars')}` }, { value: '2', label: `2 ${t('marketing.stars')}` }, { value: '1', label: `1 ${t('marketing.stars')}` }]} value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value })} />
            <Select label={t('inventory.productType')} options={[{ value: 'powder', label: t('inventory.powderProduct') }, { value: 'tablets', label: t('inventory.tablets') }, { value: 'capsules', label: t('inventory.capsules') }, { value: 'general', label: 'General' }]} value={testimonialForm.productType} onChange={(e) => setTestimonialForm({ ...testimonialForm, productType: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('marketing.testimonialText')}</label>
            <textarea
              className="input-field min-h-[100px]"
              value={testimonialForm.content}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
              required
              placeholder={t('marketing.testimonialText')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={closeTestimonialModal}>{t('common.cancel')}</Button>
            <Button type="submit" loading={createTestimonialMutation.isPending || updateTestimonialMutation.isPending}>
              {editingTestimonial ? t('common.update') : t('common.add')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
