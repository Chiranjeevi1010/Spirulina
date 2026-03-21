import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, FlaskConical, Package, Calendar } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, CardTitle, DataTable, Modal, PageLoader, Badge } from '../components/ui';
import { batchesApi } from '../services/modules.api';

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const batchId = Number(id);
  const [showTestModal, setShowTestModal] = useState(false);

  const [testForm, setTestForm] = useState({
    testType: 'protein',
    testDate: new Date().toISOString().split('T')[0],
    result: '',
    unit: '%',
    method: '',
    testedBy: '',
    notes: '',
  });

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => batchesApi.getById(batchId),
    enabled: !!batchId,
  });

  const { data: tests, isLoading: testsLoading } = useQuery({
    queryKey: ['batch-tests', batchId],
    queryFn: () => batchesApi.getTests(batchId),
    enabled: !!batchId,
  });

  const addTestMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => batchesApi.addTest(batchId, data),
    onSuccess: () => {
      toast.success('Test result added');
      queryClient.invalidateQueries({ queryKey: ['batch-tests', batchId] });
      setShowTestModal(false);
      resetTestForm();
    },
    onError: () => toast.error('Failed to add test result'),
  });

  const resetTestForm = () => {
    setTestForm({ testType: 'protein', testDate: new Date().toISOString().split('T')[0], result: '', unit: '%', method: '', testedBy: '', notes: '' });
  };

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTestMutation.mutate({
      testType: testForm.testType,
      testDate: testForm.testDate,
      result: testForm.result,
      unit: testForm.unit,
      method: testForm.method || undefined,
      testedBy: testForm.testedBy || undefined,
      notes: testForm.notes || undefined,
    });
  };

  if (isLoading) return <PageLoader />;
  if (!batch) return <div className="text-center py-12 text-gray-500">Batch not found</div>;

  const b = batch as any;
  const testList = (tests as any[]) ?? [];
  const daysLeft = b.expiryDate ? Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const testColumns = [
    { key: 'testType', header: 'Test', render: (item: any) => <span className="capitalize">{item.testType}</span> },
    { key: 'testDate', header: 'Date', render: (item: any) => new Date(item.testDate || item.createdAt).toLocaleDateString() },
    { key: 'result', header: 'Result', render: (item: any) => `${item.result} ${item.unit || ''}` },
    { key: 'method', header: 'Method', render: (item: any) => item.method || '-' },
    { key: 'testedBy', header: 'Tested By', render: (item: any) => item.testedBy || '-' },
    {
      key: 'pass',
      header: 'Status',
      render: (item: any) => item.pass !== undefined
        ? <Badge variant={item.pass ? 'success' : 'danger'}>{item.pass ? 'Pass' : 'Fail'}</Badge>
        : <Badge variant="default">N/A</Badge>,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/inventory')}>
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Batch {b.batchNumber}</h1>
          <p className="text-sm text-gray-500 capitalize">{b.productType}</p>
        </div>
        <Badge variant={b.status === 'available' ? 'success' : b.status === 'expired' ? 'danger' : 'default'}>
          {b.status || 'available'}
        </Badge>
      </div>

      {/* Batch Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="text-xl font-bold">{Number(b.quantity).toFixed(2)} kg</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Production Date</p>
                <p className="text-xl font-bold">{new Date(b.productionDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="text-xl font-bold">{b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        {daysLeft !== null && (
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <FlaskConical className={`w-8 h-8 ${daysLeft <= 30 ? 'text-red-600' : 'text-green-600'}`} />
                <div>
                  <p className="text-sm text-gray-500">Days Left</p>
                  <p className={`text-xl font-bold ${daysLeft <= 30 ? 'text-red-600' : 'text-green-600'}`}>
                    {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {b.notes && (
        <Card className="mb-6">
          <CardBody>
            <CardTitle>Notes</CardTitle>
            <p className="text-sm text-gray-600 mt-2">{b.notes}</p>
          </CardBody>
        </Card>
      )}

      {/* Quality Tests */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Quality Test Results</CardTitle>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowTestModal(true)}>
              Add Test
            </Button>
          </div>
          {testsLoading ? (
            <PageLoader />
          ) : (
            <DataTable columns={testColumns} data={testList} emptyMessage="No test results yet" />
          )}
        </CardBody>
      </Card>

      {/* Add Test Modal */}
      <Modal isOpen={showTestModal} onClose={() => setShowTestModal(false)} title="Add Test Result" size="lg">
        <form onSubmit={handleTestSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Test Type"
              options={[
                { value: 'protein', label: 'Protein Content' },
                { value: 'moisture', label: 'Moisture' },
                { value: 'phycocyanin', label: 'Phycocyanin' },
                { value: 'heavy_metals', label: 'Heavy Metals' },
                { value: 'microbial', label: 'Microbial Count' },
                { value: 'chlorophyll', label: 'Chlorophyll' },
                { value: 'ash', label: 'Ash Content' },
                { value: 'other', label: 'Other' },
              ]}
              value={testForm.testType}
              onChange={(e) => setTestForm({ ...testForm, testType: e.target.value })}
            />
            <Input label="Test Date" type="date" value={testForm.testDate} onChange={(e) => setTestForm({ ...testForm, testDate: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Result" value={testForm.result} onChange={(e) => setTestForm({ ...testForm, result: e.target.value })} required />
            <Select
              label="Unit"
              options={[
                { value: '%', label: '%' },
                { value: 'ppm', label: 'ppm' },
                { value: 'mg/g', label: 'mg/g' },
                { value: 'CFU/g', label: 'CFU/g' },
                { value: 'pass/fail', label: 'Pass/Fail' },
              ]}
              value={testForm.unit}
              onChange={(e) => setTestForm({ ...testForm, unit: e.target.value })}
            />
          </div>
          <Input label="Method" value={testForm.method} onChange={(e) => setTestForm({ ...testForm, method: e.target.value })} placeholder="e.g. AOAC, Kjeldahl..." />
          <Input label="Tested By" value={testForm.testedBy} onChange={(e) => setTestForm({ ...testForm, testedBy: e.target.value })} />
          <Input label="Notes" value={testForm.notes} onChange={(e) => setTestForm({ ...testForm, notes: e.target.value })} placeholder="Optional notes..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowTestModal(false)}>Cancel</Button>
            <Button type="submit" loading={addTestMutation.isPending}>Add Result</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
