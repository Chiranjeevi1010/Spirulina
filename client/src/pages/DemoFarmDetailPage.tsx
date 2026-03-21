import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, User, Calendar, Ruler, TrendingUp } from 'lucide-react';
import { Button, Card, CardBody, CardTitle, PageLoader, Badge } from '../components/ui';
import { marketingApi } from '../services/modules.api';

export default function DemoFarmDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const farmId = Number(id);

  const { data: farm, isLoading } = useQuery({
    queryKey: ['demo-farm', farmId],
    queryFn: () => marketingApi.getDemoFarm(farmId),
    enabled: !!farmId,
  });

  if (isLoading) return <PageLoader />;
  if (!farm) return <div className="text-center py-12 text-gray-500">Demo farm not found</div>;

  const f = farm as any;

  const trialDays = f.trialStartDate && f.trialEndDate
    ? Math.ceil((new Date(f.trialEndDate).getTime() - new Date(f.trialStartDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/marketing')}>
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{f.farmName}</h1>
          <p className="text-sm text-gray-500">Demo Farm Details</p>
        </div>
        <Badge variant={f.status === 'active' ? 'success' : f.status === 'completed' ? 'info' : 'warning'}>
          {f.status || 'active'}
        </Badge>
      </div>

      {/* Farm Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardBody>
            <CardTitle>Farm Information</CardTitle>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Farmer</p>
                  <p className="font-medium">{f.farmerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">
                    {[f.location, f.district, f.state].filter(Boolean).join(', ') || 'Not specified'}
                  </p>
                </div>
              </div>
              {f.pondSize && (
                <div className="flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Pond Size</p>
                    <p className="font-medium">{f.pondSize} sq ft</p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Trial Period</CardTitle>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{f.trialStartDate ? new Date(f.trialStartDate).toLocaleDateString() : 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{f.trialEndDate ? new Date(f.trialEndDate).toLocaleDateString() : 'Not set'}</p>
                </div>
              </div>
              {trialDays !== null && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Trial Duration</p>
                    <p className="font-medium">{trialDays} days</p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Before/After Data & ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardBody>
            <CardTitle>Before Trial</CardTitle>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Yield</span>
                <span className="font-medium">{f.beforeYield ? `${f.beforeYield} kg` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Income</span>
                <span className="font-medium">{f.beforeIncome ? `₹${Number(f.beforeIncome).toLocaleString()}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quality</span>
                <span className="font-medium">{f.beforeQuality || 'N/A'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>After Trial</CardTitle>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Yield</span>
                <span className="font-medium text-green-600">{f.afterYield ? `${f.afterYield} kg` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Income</span>
                <span className="font-medium text-green-600">{f.afterIncome ? `₹${Number(f.afterIncome).toLocaleString()}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quality</span>
                <span className="font-medium text-green-600">{f.afterQuality || 'N/A'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>ROI Summary</CardTitle>
            <div className="flex flex-col items-center justify-center mt-4">
              <TrendingUp className={`w-12 h-12 ${f.roi ? 'text-green-600' : 'text-gray-300'}`} />
              {f.roi ? (
                <>
                  <p className="text-3xl font-bold text-green-600 mt-2">{f.roi}%</p>
                  <p className="text-sm text-gray-500">Return on Investment</p>
                </>
              ) : (
                <>
                  <p className="text-lg text-gray-400 mt-2">Not calculated</p>
                  <p className="text-sm text-gray-400">Complete trial data to calculate ROI</p>
                </>
              )}
              {f.investmentAmount && (
                <p className="text-xs text-gray-400 mt-2">Investment: ₹{Number(f.investmentAmount).toLocaleString()}</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Notes */}
      {f.notes && (
        <Card>
          <CardBody>
            <CardTitle>Notes</CardTitle>
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{f.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
