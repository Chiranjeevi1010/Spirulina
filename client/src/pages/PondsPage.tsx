import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button, Input, Select, Pagination, PageLoader, EmptyState } from '../components/ui';
import { PondCard, PondForm } from '../components/ponds';
import { usePonds, useDeletePond } from '../hooks/usePonds';
import type { Pond } from '@spirulina/shared';

export default function PondsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPond, setEditingPond] = useState<Pond | null>(null);

  const deletePondMutation = useDeletePond();

  const { data, isLoading } = usePonds({
    page,
    limit: 12,
    search: search || undefined,
    status: statusFilter || undefined,
    healthStatus: healthFilter || undefined,
  });

  const ponds = data?.data ?? [];
  const pagination = data?.meta;

  const handleEdit = (pond: Pond) => {
    setEditingPond(pond);
    setShowForm(true);
  };

  const handleDelete = (pond: Pond) => {
    if (confirm('Delete this pond?')) {
      deletePondMutation.mutate(pond.id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPond(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ponds</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your spirulina cultivation ponds</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>
          Add Pond
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ponds..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select
          value={healthFilter}
          onChange={e => { setHealthFilter(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-40"
        >
          <option value="">All Health</option>
          <option value="GREEN">Green</option>
          <option value="YELLOW">Yellow</option>
          <option value="RED">Red</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader />
      ) : ponds.length === 0 ? (
        <EmptyState
          title="No ponds found"
          description={search || statusFilter || healthFilter ? 'Try adjusting your filters' : 'Get started by adding your first pond'}
          action={
            !search && !statusFilter && !healthFilter ? (
              <Button onClick={() => setShowForm(true)}>Add First Pond</Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ponds.map(pond => (
              <PondCard
                key={pond.id}
                pond={pond}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      <PondForm isOpen={showForm} onClose={handleCloseForm} pond={editingPond} />
    </div>
  );
}
