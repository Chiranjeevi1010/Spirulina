import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, FlaskConical, ClipboardList, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, DataTable, Modal, Tabs, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { chemicalsApi } from '../services/modules.api';
import { pondsApi } from '../services/ponds.api';

const DEFAULT_MINERALS = [
  // ── Core Macronutrients ────────────────────────────────────────────────
  { name: 'Sodium Bicarbonate (NaHCO3)', category: 'pH-adjuster', unit: 'kg', currentStock: 0, minimumStock: 5, notes: 'Primary carbon source; replenish daily' },
  { name: 'Sodium Carbonate (Na2CO3)', category: 'pH-adjuster', unit: 'kg', currentStock: 0, minimumStock: 2, notes: 'Maintains high pH 9–10.5' },
  { name: 'Sodium Nitrate (NaNO3)', category: 'nutrient', unit: 'kg', currentStock: 0, minimumStock: 2, notes: 'Main nitrogen source (Zarrouk standard)' },
  { name: 'Urea', category: 'nutrient', unit: 'kg', currentStock: 0, minimumStock: 1, notes: 'Budget N source; low dose only to avoid ammonia toxicity' },
  { name: 'Mono Potassium Phosphate (KH2PO4)', category: 'nutrient', unit: 'kg', currentStock: 0, minimumStock: 0.5, notes: 'Phosphorus + potassium source (MKP)' },
  { name: 'Di-Potassium Phosphate (K2HPO4)', category: 'nutrient', unit: 'kg', currentStock: 0, minimumStock: 0.5, notes: 'Standard Zarrouk formula phosphorus source' },
  { name: 'Phosphoric Acid (H3PO4)', category: 'nutrient', unit: 'L', currentStock: 0, minimumStock: 0.5, notes: 'Liquid phosphorus source; also lowers pH' },
  { name: 'Potassium Sulfate (K2SO4)', category: 'mineral', unit: 'kg', currentStock: 0, minimumStock: 1, notes: 'Potassium source; maintains ionic balance' },
  // ── Salinity Control ──────────────────────────────────────────────────
  { name: 'Sodium Chloride (NaCl)', category: 'mineral', unit: 'kg', currentStock: 0, minimumStock: 1, notes: 'Salinity control; target 10–20 ppt' },
  // ── Secondary Minerals ────────────────────────────────────────────────
  { name: 'Magnesium Sulfate (MgSO4·7H2O)', category: 'mineral', unit: 'kg', currentStock: 0, minimumStock: 0.5, notes: 'Chlorophyll formation; skip if Mg already high' },
  { name: 'Calcium Chloride (CaCl2)', category: 'mineral', unit: 'kg', currentStock: 0, minimumStock: 0.2, notes: 'Cell wall stability; excess causes precipitation' },
  { name: 'Sodium Sulfate (Na2SO4)', category: 'mineral', unit: 'kg', currentStock: 0, minimumStock: 0.2, notes: 'Sulfur source; optional if using MgSO4' },
  // ── Micronutrients ────────────────────────────────────────────────────
  { name: 'Ferrous Sulfate (FeSO4)', category: 'mineral', unit: 'kg', currentStock: 0, minimumStock: 0.05, notes: 'Critical iron source for photosynthesis; use with EDTA' },
  { name: 'EDTA (Disodium EDTA)', category: 'other', unit: 'kg', currentStock: 0, minimumStock: 0.1, notes: 'Chelates iron to keep it bioavailable; always pair with FeSO4' },
  { name: 'Manganese Chloride (MnCl2)', category: 'mineral', unit: 'g', currentStock: 0, minimumStock: 5, notes: 'Enzyme activation & O2 evolution; trace only – excess is toxic' },
  { name: 'Zinc Sulfate (ZnSO4)', category: 'mineral', unit: 'g', currentStock: 0, minimumStock: 2, notes: 'Enzyme cofactor, protein synthesis; very small dose' },
  { name: 'Copper Sulfate (CuSO4)', category: 'mineral', unit: 'g', currentStock: 0, minimumStock: 1, notes: 'Electron transport; TOXIC in excess – extreme caution' },
  { name: 'Cobalt Chloride (CoCl2)', category: 'mineral', unit: 'g', currentStock: 0, minimumStock: 0.5, notes: 'Vitamin B12 synthesis; ppb-level dose only' },
  { name: 'Sodium Molybdate (Na2MoO4)', category: 'mineral', unit: 'g', currentStock: 0, minimumStock: 0.1, notes: 'Nitrogen metabolism & nitrate reductase enzyme' },
  { name: 'Boric Acid (H3BO3)', category: 'other', unit: 'g', currentStock: 0, minimumStock: 0.5, notes: 'Cell membrane integrity; trace micronutrient' },
  // ── Optional / Commercial ─────────────────────────────────────────────
  { name: 'Sodium Silicate', category: 'other', unit: 'kg', currentStock: 0, minimumStock: 0.2, notes: 'Improves stress tolerance' },
  { name: 'Humic Acid', category: 'other', unit: 'kg', currentStock: 0, minimumStock: 0.2, notes: 'Growth stimulant at low concentrations' },
];

export default function ChemicalsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [chemPage, setChemPage] = useState(1);
  const [usagePage, setUsagePage] = useState(1);
  const [showChemModal, setShowChemModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [editingChem, setEditingChem] = useState<any>(null);

  const [chemForm, setChemForm] = useState({
    name: '',
    category: 'nutrient',
    unit: 'kg',
    currentStock: '',
    minimumStock: '',
    costPerUnit: '',
    supplier: '',
  });

  const [usageForm, setUsageForm] = useState({
    chemicalId: '',
    pondId: '',
    quantityUsed: '',
    usageDate: new Date().toISOString().split('T')[0],
    purpose: '',
  });

  const { data: chemicals, isLoading: chemsLoading } = useQuery({
    queryKey: ['chemicals', { page: chemPage, limit: 20 }],
    queryFn: () => chemicalsApi.list({ page: chemPage, limit: 20 }),
  });

  const { data: usageLog, isLoading: usageLoading } = useQuery({
    queryKey: ['chemicals-usage', { page: usagePage, limit: 20 }],
    queryFn: () => chemicalsApi.getUsageLog({ page: usagePage, limit: 20 }),
  });

  const { data: ponds } = useQuery({
    queryKey: ['ponds-list'],
    queryFn: () => pondsApi.list({ limit: 100 }),
  });

  const createChemMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => chemicalsApi.create(data),
    onSuccess: () => {
      toast.success(t('chemicals.chemicalAdded'));
      queryClient.invalidateQueries({ queryKey: ['chemicals'] });
      setShowChemModal(false);
      resetChemForm();
    },
    onError: () => toast.error(t('chemicals.chemicalAddFailed')),
  });

  const updateChemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => chemicalsApi.update(id, data),
    onSuccess: () => {
      toast.success(t('chemicals.chemicalUpdated'));
      queryClient.invalidateQueries({ queryKey: ['chemicals'] });
      setShowChemModal(false);
      resetChemForm();
    },
    onError: () => toast.error(t('chemicals.chemicalUpdateFailed')),
  });

  const deleteChemMutation = useMutation({
    mutationFn: (id: number) => chemicalsApi.delete(id),
    onSuccess: () => {
      toast.success(t('chemicals.chemicalDeleted'));
      queryClient.invalidateQueries({ queryKey: ['chemicals'] });
    },
    onError: () => toast.error(t('chemicals.chemicalDeleteFailed')),
  });

  const logUsageMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => chemicalsApi.logUsage(data),
    onSuccess: () => {
      toast.success(t('chemicals.usageLogged'));
      queryClient.invalidateQueries({ queryKey: ['chemicals-usage'] });
      queryClient.invalidateQueries({ queryKey: ['chemicals'] });
      setShowUsageModal(false);
      resetUsageForm();
    },
    onError: () => toast.error(t('chemicals.usageLogFailed')),
  });

  const loadDefaultsMutation = useMutation({
    mutationFn: async () => {
      for (const mineral of DEFAULT_MINERALS) {
        await chemicalsApi.create(mineral);
      }
    },
    onSuccess: () => {
      toast.success(t('chemicals.defaultMineralsLoaded'));
      queryClient.invalidateQueries({ queryKey: ['chemicals'] });
    },
    onError: () => toast.error(t('chemicals.defaultMineralsFailed')),
  });

  const resetChemForm = () => {
    setEditingChem(null);
    setChemForm({ name: '', category: 'nutrient', unit: 'kg', currentStock: '', minimumStock: '', costPerUnit: '', supplier: '' });
  };

  const resetUsageForm = () => {
    setUsageForm({ chemicalId: '', pondId: '', quantityUsed: '', usageDate: new Date().toISOString().split('T')[0], purpose: '' });
  };

  const handleEditChem = (item: any) => {
    setEditingChem(item);
    setChemForm({
      name: item.name || '',
      category: item.category || 'nutrient',
      unit: item.unit || 'kg',
      currentStock: String(item.currentStock || ''),
      minimumStock: String(item.minimumStock || ''),
      costPerUnit: item.costPerUnit ? String(item.costPerUnit) : '',
      supplier: item.supplier || '',
    });
    setShowChemModal(true);
  };

  const handleChemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: chemForm.name,
      category: chemForm.category,
      unit: chemForm.unit,
      currentStock: Number(chemForm.currentStock),
      minimumStock: Number(chemForm.minimumStock),
      costPerUnit: chemForm.costPerUnit ? Number(chemForm.costPerUnit) : undefined,
      supplier: chemForm.supplier || undefined,
    };
    if (editingChem) {
      updateChemMutation.mutate({ id: editingChem.id, data: payload });
    } else {
      createChemMutation.mutate(payload);
    }
  };

  const handleUsageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logUsageMutation.mutate({
      chemicalId: Number(usageForm.chemicalId),
      pondId: Number(usageForm.pondId),
      quantityUsed: Number(usageForm.quantityUsed),
      usageDate: usageForm.usageDate,
      purpose: usageForm.purpose || undefined,
    });
  };

  const chemList = chemicals?.data ?? [];
  const chemPagination = chemicals?.meta;
  const usageList = usageLog?.data ?? [];
  const usagePagination = usageLog?.meta;
  const pondOptions = (ponds?.data ?? []).map((p: any) => ({ value: String(p.id), label: p.name }));
  const chemOptions = chemList.map((c: any) => ({ value: String(c.id), label: c.name }));

  const chemColumns = [
    { key: 'name', header: t('common.name') },
    { key: 'category', header: t('common.category'), render: (item: any) => <span className="capitalize">{item.category}</span> },
    { key: 'unit', header: t('chemicals.unit') },
    {
      key: 'currentStock',
      header: t('chemicals.currentStock'),
      render: (item: any) => {
        const isLow = Number(item.currentStock) <= Number(item.minimumStock);
        return (
          <span className="flex items-center gap-2">
            {Number(item.currentStock).toFixed(1)}
            {isLow && <Badge variant="danger">{t('chemicals.lowStock')}</Badge>}
          </span>
        );
      },
    },
    { key: 'minimumStock', header: t('chemicals.minStock'), render: (item: any) => Number(item.minimumStock).toFixed(1) },
    { key: 'costPerUnit', header: t('chemicals.costPerUnit'), render: (item: any) => item.costPerUnit ? `₹${Number(item.costPerUnit).toFixed(2)}` : '-' },
    { key: 'supplier', header: t('chemicals.supplier'), render: (item: any) => item.supplier || '-' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: any) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" icon={<Pencil className="w-3 h-3" />} onClick={(e) => { e.stopPropagation(); handleEditChem(item); }} />
          <Button size="sm" variant="ghost" icon={<Trash2 className="w-3 h-3 text-red-500" />} onClick={(e) => { e.stopPropagation(); if (confirm(t('chemicals.deleteChemical'))) deleteChemMutation.mutate(item.id); }} />
        </div>
      ),
    },
  ];

  const usageColumns = [
    { key: 'usageDate', header: t('common.date'), render: (item: any) => new Date(item.usageDate || item.createdAt).toLocaleDateString() },
    { key: 'chemical', header: t('chemicals.chemicalsTab'), render: (item: any) => item.chemical?.name || `#${item.chemicalId}` },
    { key: 'pond', header: t('harvest.pond'), render: (item: any) => item.pond?.name || `Pond #${item.pondId}` },
    { key: 'quantityUsed', header: t('inventory.quantity'), render: (item: any) => Number(item.quantityUsed).toFixed(2) },
    { key: 'purpose', header: t('chemicals.purpose'), render: (item: any) => item.purpose || '-' },
  ];

  const chemicalsTab = (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        {chemList.length === 0 && (
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            loading={loadDefaultsMutation.isPending}
            onClick={() => {
              if (confirm(t('chemicals.loadDefaultMinerals'))) {
                loadDefaultsMutation.mutate();
              }
            }}
          >
            {t('chemicals.loadDefaultMinerals')}
          </Button>
        )}
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { resetChemForm(); setShowChemModal(true); }}>
          {t('chemicals.addChemical')}
        </Button>
      </div>
      {chemsLoading ? <PageLoader /> : chemList.length === 0 ? (
        <EmptyState
          icon={<FlaskConical size={48} />}
          title={t('chemicals.noChemicals')}
          description={t('chemicals.noChemicals')}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} loading={loadDefaultsMutation.isPending} onClick={() => loadDefaultsMutation.mutate()}>{t('chemicals.loadDefaultMinerals')}</Button>
              <Button onClick={() => setShowChemModal(true)}>{t('chemicals.addChemical')}</Button>
            </div>
          }
        />
      ) : (
        <>
          <DataTable columns={chemColumns} data={chemList} />
          {chemPagination && chemPagination.totalPages > 1 && (
            <div className="mt-4"><Pagination page={chemPagination.page} totalPages={chemPagination.totalPages} onPageChange={setChemPage} /></div>
          )}
        </>
      )}
    </div>
  );

  const usageTab = (
    <div>
      <div className="flex justify-end mb-4">
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowUsageModal(true)}>
          {t('chemicals.logUsage')}
        </Button>
      </div>
      {usageLoading ? <PageLoader /> : usageList.length === 0 ? (
        <EmptyState icon={<ClipboardList size={48} />} title={t('chemicals.noUsageRecords')} description={t('chemicals.noUsageRecords')} action={<Button onClick={() => setShowUsageModal(true)}>{t('chemicals.logUsage')}</Button>} />
      ) : (
        <>
          <DataTable columns={usageColumns} data={usageList} />
          {usagePagination && usagePagination.totalPages > 1 && (
            <div className="mt-4"><Pagination page={usagePagination.page} totalPages={usagePagination.totalPages} onPageChange={setUsagePage} /></div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('chemicals.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('chemicals.subtitle')}</p>
      </div>

      <Tabs tabs={[
        { id: 'chemicals', label: t('chemicals.chemicalsTab'), icon: <FlaskConical size={16} />, content: chemicalsTab },
        { id: 'usage', label: t('chemicals.usageLog'), icon: <ClipboardList size={16} />, content: usageTab },
      ]} />

      {/* Add Chemical Modal */}
      <Modal isOpen={showChemModal} onClose={() => { setShowChemModal(false); resetChemForm(); }} title={editingChem ? t('chemicals.editChemical') : t('chemicals.addChemical')} size="lg">
        <form onSubmit={handleChemSubmit} className="space-y-4">
          <Input label={t('common.name')} value={chemForm.name} onChange={(e) => setChemForm({ ...chemForm, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('common.category')} options={[
              { value: 'nutrient', label: t('chemicals.nutrient') },
              { value: 'mineral', label: t('chemicals.mineral') },
              { value: 'pH-adjuster', label: t('chemicals.phAdjuster') },
              { value: 'other', label: t('chemicals.other') },
            ]} value={chemForm.category} onChange={(e) => setChemForm({ ...chemForm, category: e.target.value })} />
            <Select label={t('chemicals.unit')} options={[
              { value: 'kg', label: t('chemicals.kilograms') },
              { value: 'g', label: t('chemicals.grams') },
              { value: 'L', label: t('chemicals.liters') },
              { value: 'mL', label: t('chemicals.milliliters') },
            ]} value={chemForm.unit} onChange={(e) => setChemForm({ ...chemForm, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('chemicals.currentStock')} type="number" step="0.1" value={chemForm.currentStock} onChange={(e) => setChemForm({ ...chemForm, currentStock: e.target.value })} required />
            <Input label={t('chemicals.minStock')} type="number" step="0.1" value={chemForm.minimumStock} onChange={(e) => setChemForm({ ...chemForm, minimumStock: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('chemicals.costPerUnit')} type="number" step="0.01" value={chemForm.costPerUnit} onChange={(e) => setChemForm({ ...chemForm, costPerUnit: e.target.value })} />
            <Input label={t('chemicals.supplier')} value={chemForm.supplier} onChange={(e) => setChemForm({ ...chemForm, supplier: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowChemModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={createChemMutation.isPending || updateChemMutation.isPending}>{editingChem ? t('common.update') : t('chemicals.addChemical')}</Button>
          </div>
        </form>
      </Modal>

      {/* Log Usage Modal */}
      <Modal isOpen={showUsageModal} onClose={() => setShowUsageModal(false)} title={t('chemicals.logUsage')}>
        <form onSubmit={handleUsageSubmit} className="space-y-4">
          <Select label={t('chemicals.chemicalSelect')} options={chemOptions} placeholder={t('chemicals.chemicalSelect')} value={usageForm.chemicalId} onChange={(e) => setUsageForm({ ...usageForm, chemicalId: e.target.value })} required />
          <Select label={t('chemicals.pondSelect')} options={pondOptions} placeholder={t('chemicals.pondSelect')} value={usageForm.pondId} onChange={(e) => setUsageForm({ ...usageForm, pondId: e.target.value })} required />
          <Input label={t('chemicals.quantityUsed')} type="number" step="0.01" value={usageForm.quantityUsed} onChange={(e) => setUsageForm({ ...usageForm, quantityUsed: e.target.value })} required />
          <Input label={t('chemicals.usageDate')} type="date" value={usageForm.usageDate} onChange={(e) => setUsageForm({ ...usageForm, usageDate: e.target.value })} required />
          <Input label={t('chemicals.purpose')} value={usageForm.purpose} onChange={(e) => setUsageForm({ ...usageForm, purpose: e.target.value })} placeholder="e.g. pH correction, feeding..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowUsageModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={logUsageMutation.isPending}>{t('chemicals.logUsage')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
