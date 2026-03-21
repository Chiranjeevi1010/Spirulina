import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Calculator, Beaker, Droplets, CheckCircle, ClipboardList, Pencil, BookOpen, AlertTriangle, Info } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, CardTitle, DataTable, Pagination, PageLoader, EmptyState, Alert, Badge, Tabs, Modal } from '../components/ui';
import { pondsApi } from '../services/ponds.api';
import { chemicalsApi } from '../services/modules.api';
import api from '../services/api';

// ─── Static Reference Data ────────────────────────────────────────────────────

const GROWTH_PARAMETERS = [
  { parameter: 'pH', idealRange: '9.0 – 10.5', warningBelow: '< 8.5', warningAbove: '> 11.0', notes: 'CO₂ uptake is optimal at pH 9–10; add Na₂CO₃ or NaHCO₃ to raise' },
  { parameter: 'Temperature', idealRange: '30 – 35 °C', warningBelow: '< 20 °C', warningAbove: '> 40 °C', notes: 'Peak growth at 32–35 °C; cultures die above 40 °C' },
  { parameter: 'Salinity', idealRange: '10 – 20 ppt', warningBelow: '< 5 ppt', warningAbove: '> 60 ppt', notes: 'Spirulina tolerates 0–70 ppt; optimal is 10–20 ppt' },
  { parameter: 'Alkalinity (NaHCO₃)', idealRange: '0.15 – 0.20 M', warningBelow: '< 0.10 M', warningAbove: '> 0.35 M', notes: 'Monitor daily; replenish as culture consumes carbon' },
  { parameter: 'Nitrogen (NO₃⁻)', idealRange: '1.0 – 2.5 g/L', warningBelow: '< 0.5 g/L', warningAbove: '> 5.0 g/L', notes: 'Culture yellows when N-deficient; N:P ratio should be ~10:1' },
  { parameter: 'Phosphorus (PO₄³⁻)', idealRange: '0.1 – 0.5 g/L', warningBelow: '< 0.05 g/L', warningAbove: '> 1.0 g/L', notes: 'Deficiency slows growth significantly' },
  { parameter: 'Iron (Fe²⁺ chelated)', idealRange: '2 – 10 mg/L', warningBelow: '< 1 mg/L', warningAbove: '> 20 mg/L', notes: 'Always chelate with EDTA to maintain bioavailability' },
  { parameter: 'Culture Density (OD₅₆₀)', idealRange: '0.6 – 1.2', warningBelow: '< 0.3', warningAbove: '> 1.5 (self-shading)', notes: 'Harvest when OD reaches 0.8–1.2' },
  { parameter: 'Light Intensity', idealRange: '25,000 – 35,000 lux', warningBelow: '< 5,000 lux', warningAbove: '> 60,000 lux', notes: 'Provide shade above 60,000 lux to avoid photobleaching' },
  { parameter: 'Dissolved Oxygen', idealRange: '6 – 12 mg/L', warningBelow: '< 4 mg/L', warningAbove: '> 15 mg/L', notes: 'Maintain good agitation; excess O₂ can be inhibitory' },
];

const ZARROUK_FORMULA = [
  { chemical: 'Sodium Bicarbonate (NaHCO₃)', zarroukQty: '16.8 kg', role: 'Carbon source + alkalinity', category: 'Core Macronutrient', priority: 'critical' },
  { chemical: 'Sodium Carbonate (Na₂CO₃)', zarroukQty: '4.0 kg', role: 'pH maintenance (9–10)', category: 'Core Macronutrient', priority: 'critical' },
  { chemical: 'Sodium Nitrate (NaNO₃)', zarroukQty: '2.5 kg', role: 'Nitrogen source for protein & chlorophyll', category: 'Core Macronutrient', priority: 'critical' },
  { chemical: 'Di-Potassium Phosphate (K₂HPO₄)', zarroukQty: '0.5 kg', role: 'Phosphorus + potassium', category: 'Core Macronutrient', priority: 'critical' },
  { chemical: 'Potassium Sulfate (K₂SO₄)', zarroukQty: '1.0 kg', role: 'Potassium + ionic balance', category: 'Core Macronutrient', priority: 'critical' },
  { chemical: 'Sodium Chloride (NaCl)', zarroukQty: '1.0 kg', role: 'Salinity control', category: 'Salinity', priority: 'high' },
  { chemical: 'Magnesium Sulfate (MgSO₄·7H₂O)', zarroukQty: '0.20 kg', role: 'Chlorophyll formation, enzyme activation', category: 'Secondary Mineral', priority: 'medium' },
  { chemical: 'Calcium Chloride (CaCl₂)', zarroukQty: '0.04 kg', role: 'Cell wall stability', category: 'Secondary Mineral', priority: 'medium' },
  { chemical: 'Ferrous Sulfate (FeSO₄)', zarroukQty: '0.010 kg', role: 'Iron – photosynthesis & enzyme function', category: 'Micronutrient', priority: 'critical' },
  { chemical: 'EDTA (Disodium EDTA)', zarroukQty: '0.080 kg', role: 'Chelates iron for bioavailability', category: 'Micronutrient', priority: 'high' },
  { chemical: 'Manganese Chloride (MnCl₂)', zarroukQty: '0.0008 kg', role: 'Enzyme activation, O₂ evolution', category: 'Micronutrient', priority: 'medium' },
  { chemical: 'Zinc Sulfate (ZnSO₄)', zarroukQty: '0.00022 kg', role: 'Enzyme cofactor, protein synthesis', category: 'Micronutrient', priority: 'medium' },
  { chemical: 'Copper Sulfate (CuSO₄)', zarroukQty: '0.000080 kg', role: 'Electron transport chain', category: 'Micronutrient', priority: 'low' },
  { chemical: 'Cobalt Chloride (CoCl₂)', zarroukQty: '0.000040 kg', role: 'Vitamin B12 synthesis', category: 'Micronutrient', priority: 'low' },
  { chemical: 'Sodium Molybdate (Na₂MoO₄)', zarroukQty: '0.000008 kg', role: 'Nitrate reductase enzyme', category: 'Micronutrient', priority: 'low' },
  { chemical: 'Boric Acid (H₃BO₃)', zarroukQty: '0.000003 kg', role: 'Cell membrane integrity', category: 'Micronutrient', priority: 'low' },
];

const FULL_REFERENCE = [
  // Core Macronutrients
  { chemical: 'Sodium Bicarbonate (NaHCO₃)', category: 'Core Macronutrient', role: 'Primary carbon + alkalinity buffer', idealConc: '0.15–0.20 M', replenishFreq: 'Daily', priority: 'critical', notes: 'Most consumed chemical; monitor culture colour & pH daily' },
  { chemical: 'Sodium Carbonate (Na₂CO₃)', category: 'Core Macronutrient', role: 'pH elevation & buffering', idealConc: 'As needed', replenishFreq: 'Weekly or when pH < 9', priority: 'critical', notes: 'Add when pH drops; use alongside NaHCO₃' },
  { chemical: 'Sodium Nitrate (NaNO₃)', category: 'Core Macronutrient', role: 'Nitrogen for protein & pigment', idealConc: '2.5 g/L', replenishFreq: 'Weekly', priority: 'critical', notes: 'Standard Zarrouk N source; check with nitrate test kit' },
  { chemical: 'Urea', category: 'Core Macronutrient', role: 'Budget nitrogen source', idealConc: '0.3–0.5 g/L', replenishFreq: 'Weekly (low dose)', priority: 'high', notes: '⚠ Excess causes ammonia spike & culture crash; max 0.5 g/L' },
  { chemical: 'Mono Potassium Phosphate (KH₂PO₄)', category: 'Core Macronutrient', role: 'Phosphorus + potassium', idealConc: '0.5 g/L', replenishFreq: 'Weekly', priority: 'critical', notes: 'Preferred in many farms as single P+K source (MKP)' },
  { chemical: 'Di-Potassium Phosphate (K₂HPO₄)', category: 'Core Macronutrient', role: 'Phosphorus + potassium', idealConc: '0.5 g/L', replenishFreq: 'Weekly', priority: 'critical', notes: 'Standard Zarrouk formula; slightly higher pH than MKP' },
  { chemical: 'Phosphoric Acid (H₃PO₄)', category: 'Core Macronutrient', role: 'Phosphorus + pH reduction', idealConc: 'Variable', replenishFreq: 'As needed', priority: 'high', notes: 'Use to lower pH and add P simultaneously; handle with care' },
  { chemical: 'Potassium Sulfate (K₂SO₄)', category: 'Core Macronutrient', role: 'Potassium + sulfur source', idealConc: '1.0 g/L', replenishFreq: 'Weekly', priority: 'critical', notes: 'Maintains ionic balance; do not exceed 2 g/L' },
  // Salinity
  { chemical: 'Sodium Chloride (NaCl)', category: 'Salinity Control', role: 'Osmotic balance & salinity', idealConc: '10–20 ppt', replenishFreq: 'As needed', priority: 'high', notes: 'Spirulina grows best 10–20 ppt; add back after water changes' },
  // Secondary Minerals
  { chemical: 'Magnesium Sulfate (MgSO₄·7H₂O)', category: 'Secondary Mineral', role: 'Chlorophyll Mg centre, enzyme activator', idealConc: '0.2 g/L', replenishFreq: 'Biweekly', priority: 'medium', notes: '⚠ Skip or reduce if local water already has high Mg' },
  { chemical: 'Calcium Chloride (CaCl₂)', category: 'Secondary Mineral', role: 'Cell wall structural stability', idealConc: '40 mg/L', replenishFreq: 'Monthly', priority: 'medium', notes: 'Excess causes white precipitate; maintain < 80 mg/L' },
  { chemical: 'Sodium Sulfate (Na₂SO₄)', category: 'Secondary Mineral', role: 'Sulfur source', idealConc: '0.1 g/L', replenishFreq: 'Monthly', priority: 'low', notes: 'Optional when MgSO₄ is already used as S source' },
  // Micronutrients
  { chemical: 'Ferrous Sulfate (FeSO₄)', category: 'Micronutrient', role: 'Iron – photosynthesis, cytochromes, enzymes', idealConc: '10 mg/L', replenishFreq: 'Weekly', priority: 'critical', notes: 'Culture turns yellowish without Fe; always use with EDTA' },
  { chemical: 'EDTA (Disodium EDTA)', category: 'Micronutrient', role: 'Iron chelation agent', idealConc: '80 mg/L', replenishFreq: 'Weekly', priority: 'high', notes: 'Without EDTA, Fe₂⁺ precipitates and becomes unavailable' },
  { chemical: 'Manganese Chloride (MnCl₂)', category: 'Micronutrient', role: 'O₂ evolution, enzyme activation', idealConc: '0.5 mg/L', replenishFreq: 'Monthly', priority: 'medium', notes: 'Trace only; toxic at > 5 mg/L' },
  { chemical: 'Zinc Sulfate (ZnSO₄)', category: 'Micronutrient', role: 'Enzyme cofactor, carbohydrate metabolism', idealConc: '0.2 mg/L', replenishFreq: 'Monthly', priority: 'medium', notes: 'Very small quantity; excess inhibits growth' },
  { chemical: 'Copper Sulfate (CuSO₄)', category: 'Micronutrient', role: 'Electron transport (plastocyanin)', idealConc: '0.08 mg/L', replenishFreq: 'Monthly', priority: 'low', notes: '⚠ Highly toxic above 0.3 mg/L – weigh precisely' },
  { chemical: 'Cobalt Chloride (CoCl₂)', category: 'Micronutrient', role: 'Vitamin B12 synthesis', idealConc: '0.04 mg/L', replenishFreq: 'Monthly', priority: 'low', notes: 'ppb-level dose; use pre-diluted stock solution' },
  { chemical: 'Sodium Molybdate (Na₂MoO₄)', category: 'Micronutrient', role: 'Nitrate reductase, N metabolism', idealConc: '0.008 mg/L', replenishFreq: 'Monthly', priority: 'low', notes: 'Trace element; prepare stock and add drops' },
  { chemical: 'Boric Acid (H₃BO₃)', category: 'Micronutrient', role: 'Cell membrane & polysaccharide synthesis', idealConc: '0.003 mg/L', replenishFreq: 'Monthly', priority: 'low', notes: 'Ultra-trace; prepare as diluted stock solution' },
  // Optional
  { chemical: 'Sodium Silicate', category: 'Optional', role: 'Abiotic stress tolerance', idealConc: 'Variable', replenishFreq: 'As needed', priority: 'optional', notes: 'Improves resilience under heat / salt stress' },
  { chemical: 'Humic Acid', category: 'Optional', role: 'Growth stimulant', idealConc: '< 50 mg/L', replenishFreq: 'Monthly', priority: 'optional', notes: 'Low dose can improve cell growth; excess may darken culture' },
];

const PRIORITY_STYLES: Record<string, { badge: string; row: string }> = {
  critical: { badge: 'bg-red-100 text-red-800 border border-red-200', row: '' },
  high:     { badge: 'bg-orange-100 text-orange-800 border border-orange-200', row: '' },
  medium:   { badge: 'bg-blue-100 text-blue-800 border border-blue-200', row: '' },
  low:      { badge: 'bg-gray-100 text-gray-700 border border-gray-200', row: '' },
  optional: { badge: 'bg-purple-100 text-purple-700 border border-purple-200', row: '' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DosingPage() {
  const queryClient = useQueryClient();

  // Calculator state
  const [pondId, setPondId] = useState('');
  const [mineral, setMineral] = useState(''); // stores chemical ID from DB
  const [currentValue, setCurrentValue] = useState('');
  const [waterVolumeLiters, setWaterVolumeLiters] = useState('');
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  // Apply dosing state
  const [applyChemicalId, setApplyChemicalId] = useState('');
  const [applyQuantity, setApplyQuantity] = useState('');
  const [applyNotes, setApplyNotes] = useState('');
  const [applyDate, setApplyDate] = useState(new Date().toISOString().split('T')[0]);

  // History state
  const [historyPage, setHistoryPage] = useState(1);

  // Edit history state
  const [editingUsage, setEditingUsage] = useState<any>(null);
  const [editForm, setEditForm] = useState({ usageDate: '', quantityUsed: '', purpose: '', notes: '' });

  const { data: ponds } = useQuery({
    queryKey: ['ponds-list'],
    queryFn: () => pondsApi.list({ limit: 100 }),
  });

  const { data: chemicalsData } = useQuery({
    queryKey: ['chemicals-all'],
    queryFn: () => chemicalsApi.list({ limit: 200 }),
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['dosing-history', { page: historyPage, limit: 15 }],
    queryFn: () => chemicalsApi.getUsageLog({ page: historyPage, limit: 15 }),
  });

  const applyDosingMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => chemicalsApi.logUsage(data),
    onSuccess: () => {
      toast.success('Dosing applied! Chemical inventory updated.');
      queryClient.invalidateQueries({ queryKey: ['chemicals'] });
      queryClient.invalidateQueries({ queryKey: ['chemicals-all'] });
      queryClient.invalidateQueries({ queryKey: ['dosing-history'] });
      setApplyChemicalId('');
      setApplyQuantity('');
      setApplyNotes('');
      setApplyDate(new Date().toISOString().split('T')[0]);
    },
    onError: () => toast.error('Failed to apply dosing'),
  });

  const editUsageMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      chemicalsApi.updateUsage(id, data),
    onSuccess: () => {
      toast.success('Dosing record updated');
      queryClient.invalidateQueries({ queryKey: ['dosing-history'] });
      queryClient.invalidateQueries({ queryKey: ['chemicals-all'] });
      setEditingUsage(null);
    },
    onError: () => toast.error('Failed to update dosing record'),
  });

  const pondOptions = (ponds?.data ?? []).map((p: any) => ({ value: String(p.id), label: p.name }));
  const chemicalsList: any[] = chemicalsData?.data ?? [];

  // Mineral options from inventory
  const mineralOptions = chemicalsList.map((c: any) => ({ value: String(c.id), label: c.name }));
  const chemicalOptions = chemicalsList.map((c: any) => ({
    value: String(c.id),
    label: `${c.name} (Stock: ${Number(c.currentStock).toFixed(1)} ${c.unit})`,
  }));

  const selectedMineralObj = chemicalsList.find((c: any) => String(c.id) === mineral);
  const mineralNameForAI = selectedMineralObj?.name?.toLowerCase().replace(/\s+/g, '_') || mineral;

  const handleMineralChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setMineral(id);
    setApplyChemicalId(id);
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pondId || !mineral) { toast.error('Please select a pond and mineral'); return; }
    setCalculating(true);
    try {
      const res = await api.post('/ai/dosing-calculate', {
        pondId: Number(pondId),
        mineral: mineralNameForAI,
        currentValue: currentValue ? Number(currentValue) : undefined,
        waterVolumeLiters: waterVolumeLiters ? Number(waterVolumeLiters) : undefined,
      });
      setResult(res.data.data);
      if (res.data.data?.recommendedDoseKg) setApplyQuantity(String(Number(res.data.data.recommendedDoseKg).toFixed(3)));
      toast.success('Dosing calculated');
    } catch {
      const volume = waterVolumeLiters ? Number(waterVolumeLiters) : 10000;
      const dose = volume * 0.001 * 0.5;
      setResult({ mineral: mineralNameForAI, recommendedDoseKg: dose.toFixed(3), notes: 'Approximate estimate. Configure AI service for precise dosing.', waterVolumeLiters: volume });
      setApplyQuantity(dose.toFixed(3));
    } finally { setCalculating(false); }
  };

  const handleApplyDosing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pondId) { toast.error('Please select a pond first (in the calculator above)'); return; }
    if (!applyChemicalId || !applyQuantity) { toast.error('Please select a chemical and enter quantity'); return; }
    const selectedChem = chemicalsList.find((c: any) => String(c.id) === applyChemicalId);
    const qty = Number(applyQuantity);
    if (selectedChem && qty > Number(selectedChem.currentStock)) {
      toast.error(`Insufficient stock! Available: ${Number(selectedChem.currentStock).toFixed(2)} ${selectedChem.unit}`);
      return;
    }
    applyDosingMutation.mutate({
      chemicalId: Number(applyChemicalId),
      pondId: Number(pondId),
      usageDate: applyDate,
      quantityUsed: qty,
      unit: selectedChem?.unit || 'kg',
      purpose: `Dosing: ${selectedMineralObj?.name || chemicalsList.find((c: any) => String(c.id) === applyChemicalId)?.name || 'manual'}`,
      aiRecommended: !!result,
      recommendedQty: result ? Number(result.recommendedDoseKg) : undefined,
      notes: applyNotes || undefined,
    });
  };

  const handleEditHistory = (item: any) => {
    setEditingUsage(item);
    setEditForm({ usageDate: item.usageDate || new Date().toISOString().split('T')[0], quantityUsed: String(Number(item.quantityUsed).toFixed(3)), purpose: item.purpose || '', notes: item.notes || '' });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editUsageMutation.mutate({ id: editingUsage.id, data: { usageDate: editForm.usageDate, quantityUsed: Number(editForm.quantityUsed), purpose: editForm.purpose || undefined, notes: editForm.notes || undefined } });
  };

  const usageList = usageData?.data ?? [];
  const usagePagination = usageData?.meta;

  const historyColumns = [
    { key: 'usageDate', header: 'Date', render: (item: any) => new Date(item.usageDate || item.createdAt).toLocaleDateString() },
    { key: 'chemicalName', header: 'Chemical', render: (item: any) => item.chemicalName || `#${item.chemicalId}` },
    { key: 'pondName', header: 'Pond', render: (item: any) => item.pondName || `Pond #${item.pondId}` },
    { key: 'quantityUsed', header: 'Quantity', render: (item: any) => `${Number(item.quantityUsed).toFixed(3)} ${item.unit || 'kg'}` },
    { key: 'aiRecommended', header: 'Source', render: (item: any) => item.aiRecommended ? <Badge variant="info">AI Recommended</Badge> : <Badge variant="default">Manual</Badge> },
    { key: 'recommendedQty', header: 'AI Rec. Qty', render: (item: any) => item.recommendedQty ? `${Number(item.recommendedQty).toFixed(3)} kg` : '-' },
    { key: 'purpose', header: 'Purpose', render: (item: any) => item.purpose || '-' },
    { key: 'actions', header: '', render: (item: any) => <Button size="sm" variant="ghost" icon={<Pencil className="w-3 h-3" />} onClick={(e) => { e.stopPropagation(); handleEditHistory(item); }} /> },
  ];

  // ─── Calculator + Apply Tab ───────────────────────────────────────────────
  const calculatorTab = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Calculator */}
      <Card>
        <CardBody>
          <CardTitle>Dosing Parameters</CardTitle>
          <form onSubmit={handleCalculate} className="space-y-4 mt-4">
            <Select label="Pond" options={pondOptions} placeholder="Select pond" value={pondId} onChange={(e) => setPondId(e.target.value)} required />
            <Select
              label="Mineral / Nutrient"
              options={mineralOptions}
              placeholder={mineralOptions.length === 0 ? 'No chemicals in inventory — add from Chemicals page' : 'Select mineral to dose'}
              value={mineral}
              onChange={handleMineralChange}
              required
            />
            {mineralOptions.length === 0 && (
              <Alert variant="warning">No chemicals found in inventory. Go to the Chemicals &amp; Nutrient Management page and click "Load Default Minerals".</Alert>
            )}
            <Input label="Current Value (ppm / mg/L)" type="number" step="0.01" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} placeholder="Current measured concentration" />
            <Input label="Water Volume (Liters)" type="number" value={waterVolumeLiters} onChange={(e) => setWaterVolumeLiters(e.target.value)} placeholder="Pond water volume" />
            <Button type="submit" loading={calculating} icon={<Calculator className="w-4 h-4" />} className="w-full">Calculate Dosing</Button>
          </form>
        </CardBody>
      </Card>

      {/* Right: Result + Apply */}
      <div className="space-y-6">
        <Card>
          <CardBody>
            <CardTitle>Dosing Recommendation</CardTitle>
            {result ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Beaker className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Recommended Dose</span>
                  </div>
                  <p className="text-3xl font-bold text-green-900">{Number(result.recommendedDoseKg).toFixed(3)} kg</p>
                  <p className="text-sm text-green-700 mt-1">({(Number(result.recommendedDoseKg) * 1000).toFixed(1)} grams)</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Mineral</span><span className="font-medium capitalize">{result.mineral?.replace(/_/g, ' ')}</span></div>
                  {result.currentValue !== undefined && <div className="flex justify-between text-sm"><span className="text-gray-500">Current Value</span><span className="font-medium">{result.currentValue} ppm</span></div>}
                  {result.targetValue !== undefined && <div className="flex justify-between text-sm"><span className="text-gray-500">Target Value</span><span className="font-medium">{result.targetValue} ppm</span></div>}
                  {result.waterVolumeLiters && <div className="flex justify-between text-sm"><span className="text-gray-500">Water Volume</span><span className="font-medium">{Number(result.waterVolumeLiters).toLocaleString()} L</span></div>}
                </div>
                {result.notes && <Alert variant="info">{result.notes}</Alert>}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Droplets size={48} className="mb-3" />
                <p className="text-sm">Fill in the parameters and click Calculate</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Apply Dosing</CardTitle>
            <p className="text-sm text-gray-500 mt-1 mb-4">Record actual dosing. Chemical inventory is automatically deducted.</p>
            <form onSubmit={handleApplyDosing} className="space-y-4">
              <Input label="Dosing Date" type="date" value={applyDate} onChange={(e) => setApplyDate(e.target.value)} required />
              <Select label="Chemical from Inventory" options={chemicalOptions} placeholder="Select chemical used" value={applyChemicalId} onChange={(e) => setApplyChemicalId(e.target.value)} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Actual Quantity (kg)" type="number" step="0.001" value={applyQuantity} onChange={(e) => setApplyQuantity(e.target.value)} required />
                <div className="flex items-end">
                  {applyChemicalId && (() => {
                    const chem = chemicalsList.find((c: any) => String(c.id) === applyChemicalId);
                    if (!chem) return null;
                    const stock = Number(chem.currentStock);
                    const qty = applyQuantity ? Number(applyQuantity) : 0;
                    const remaining = stock - qty;
                    return (
                      <div className="text-sm pb-2">
                        <div className="text-gray-500">Stock: <span className="font-medium text-gray-900">{stock.toFixed(2)} {chem.unit}</span></div>
                        {qty > 0 && <div className={remaining < 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>After: <span className="font-medium">{remaining.toFixed(2)} {chem.unit}</span>{remaining < 0 && ' ⚠'}</div>}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <Input label="Notes" value={applyNotes} onChange={(e) => setApplyNotes(e.target.value)} placeholder="e.g. Added to morning feed..." />
              {!pondId && <Alert variant="warning">Please select a pond in the calculator above first.</Alert>}
              <Button type="submit" loading={applyDosingMutation.isPending} icon={<CheckCircle className="w-4 h-4" />} className="w-full" disabled={!pondId}>
                Apply Dosing &amp; Update Inventory
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  // ─── History Tab ──────────────────────────────────────────────────────────
  const historyTab = (
    <div>
      {usageLoading ? <PageLoader /> : usageList.length === 0 ? (
        <EmptyState icon={<ClipboardList size={48} />} title="No dosing history" description="Apply your first dosing to see records here" />
      ) : (
        <>
          <DataTable columns={historyColumns} data={usageList} />
          {usagePagination && usagePagination.totalPages > 1 && (
            <div className="mt-4"><Pagination page={usagePagination.page} totalPages={usagePagination.totalPages} onPageChange={setHistoryPage} /></div>
          )}
        </>
      )}
    </div>
  );

  // ─── Reference Tab ────────────────────────────────────────────────────────
  const referenceTab = (
    <div className="space-y-8">

      {/* Growth Parameters */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <CardTitle>Ideal Growth Parameters for Spirulina</CardTitle>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-left">
                  <th className="px-3 py-2 font-semibold text-blue-900 rounded-tl-lg">Parameter</th>
                  <th className="px-3 py-2 font-semibold text-blue-900">✅ Ideal Range</th>
                  <th className="px-3 py-2 font-semibold text-blue-900">⚠ Warning Below</th>
                  <th className="px-3 py-2 font-semibold text-blue-900">⚠ Warning Above</th>
                  <th className="px-3 py-2 font-semibold text-blue-900 rounded-tr-lg">Notes</th>
                </tr>
              </thead>
              <tbody>
                {GROWTH_PARAMETERS.map((p, i) => (
                  <tr key={p.parameter} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-medium text-gray-900">{p.parameter}</td>
                    <td className="px-3 py-2 text-green-700 font-semibold">{p.idealRange}</td>
                    <td className="px-3 py-2 text-orange-600">{p.warningBelow}</td>
                    <td className="px-3 py-2 text-orange-600">{p.warningAbove}</td>
                    <td className="px-3 py-2 text-gray-500">{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Zarrouk Formula */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-1">
            <Beaker className="w-5 h-5 text-green-600" />
            <CardTitle>Standard Zarrouk Medium — Per 1,000 Litres</CardTitle>
          </div>
          <p className="text-sm text-gray-500 mb-4">The internationally recognised research formula for optimal Spirulina cultivation.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-50 text-left">
                  <th className="px-3 py-2 font-semibold text-green-900 rounded-tl-lg">Chemical</th>
                  <th className="px-3 py-2 font-semibold text-green-900">Amount / 1000 L</th>
                  <th className="px-3 py-2 font-semibold text-green-900">Category</th>
                  <th className="px-3 py-2 font-semibold text-green-900">Priority</th>
                  <th className="px-3 py-2 font-semibold text-green-900 rounded-tr-lg">Role</th>
                </tr>
              </thead>
              <tbody>
                {ZARROUK_FORMULA.map((row, i) => (
                  <tr key={row.chemical} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-medium text-gray-900">{row.chemical}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-gray-800">{row.zarroukQty}</td>
                    <td className="px-3 py-2 text-gray-600">{row.category}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[row.priority]?.badge ?? ''}`}>
                        {row.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Full Chemical Reference */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle>Complete Chemical Reference &amp; Dosing Guide</CardTitle>
          </div>
          <p className="text-sm text-gray-500 mb-4">All chemicals grouped by category with ideal concentrations and replenishment frequency.</p>

          {(['Core Macronutrient', 'Salinity Control', 'Secondary Mineral', 'Micronutrient', 'Optional'] as const).map((category) => {
            const rows = FULL_REFERENCE.filter(r => r.category === category);
            const catColors: Record<string, string> = {
              'Core Macronutrient': 'bg-red-50 text-red-900',
              'Salinity Control': 'bg-blue-50 text-blue-900',
              'Secondary Mineral': 'bg-yellow-50 text-yellow-900',
              'Micronutrient': 'bg-purple-50 text-purple-900',
              'Optional': 'bg-gray-50 text-gray-700',
            };
            return (
              <div key={category} className="mb-6">
                <h3 className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md inline-block mb-2 ${catColors[category]}`}>
                  {category === 'Core Macronutrient' && '🧪 '}
                  {category === 'Salinity Control' && '🧂 '}
                  {category === 'Secondary Mineral' && '🧲 '}
                  {category === 'Micronutrient' && '🔬 '}
                  {category === 'Optional' && '🌞 '}
                  {category}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="px-3 py-2 font-medium">Chemical</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="px-3 py-2 font-medium">Ideal Concentration</th>
                        <th className="px-3 py-2 font-medium">Replenish</th>
                        <th className="px-3 py-2 font-medium">Priority</th>
                        <th className="px-3 py-2 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.chemical} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{row.chemical}</td>
                          <td className="px-3 py-2 text-gray-600">{row.role}</td>
                          <td className="px-3 py-2 font-mono text-green-700 font-semibold whitespace-nowrap">{row.idealConc}</td>
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.replenishFreq}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[row.priority]?.badge ?? ''}`}>
                              {row.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs max-w-xs">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dosing Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">Calculate dosing, apply it, and track history. Inventory auto-adjusts on dosing.</p>
      </div>

      <Tabs tabs={[
        { id: 'calculator', label: 'Calculate & Apply', icon: <Calculator size={16} />, content: calculatorTab },
        { id: 'history', label: 'Dosing History', icon: <ClipboardList size={16} />, content: historyTab },
        { id: 'reference', label: 'Dosing Reference', icon: <BookOpen size={16} />, content: referenceTab },
      ]} />

      {/* Edit Dosing History Modal */}
      <Modal isOpen={!!editingUsage} onClose={() => setEditingUsage(null)} title="Edit Dosing Record" size="lg">
        {editingUsage && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Chemical</span><span className="font-medium">{editingUsage.chemicalName || `#${editingUsage.chemicalId}`}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pond</span><span className="font-medium">{editingUsage.pondName || `Pond #${editingUsage.pondId}`}</span></div>
            </div>
            <Input label="Date" type="date" value={editForm.usageDate} onChange={(e) => setEditForm({ ...editForm, usageDate: e.target.value })} required />
            <Input label="Quantity Used (kg)" type="number" step="0.001" value={editForm.quantityUsed} onChange={(e) => setEditForm({ ...editForm, quantityUsed: e.target.value })} required />
            <Alert variant="warning">Changing the quantity will automatically adjust the chemical stock balance.</Alert>
            <Input label="Purpose" value={editForm.purpose} onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })} />
            <Input label="Notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setEditingUsage(null)}>Cancel</Button>
              <Button type="submit" loading={editUsageMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
