import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Send, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { Button, Input, Card, CardBody, CardTitle, Badge, PageLoader } from '../components/ui';
import { whatsappApi } from '../services/modules.api';

export default function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [showToken, setShowToken] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  const [waConfig, setWaConfig] = useState({
    enabled: false,
    phone_number_id: '',
    access_token: '',
    business_account_id: '',
    default_country_code: '+91',
    template_order_confirmation: 'order_confirmation',
    template_order_shipped: 'order_shipped',
    template_order_delivered: 'order_delivered',
    template_payment_received: 'payment_received',
    template_payment_reminder: 'payment_reminder',
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: whatsappApi.getConfig,
  });

  const { data: logData } = useQuery({
    queryKey: ['whatsapp-log'],
    queryFn: () => whatsappApi.getLog({ limit: 20 }),
  });

  useEffect(() => {
    if (config) {
      setWaConfig((prev) => ({ ...prev, ...config }));
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => whatsappApi.updateConfig(data),
    onSuccess: () => {
      toast.success(t('settings.configSaved'));
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
    onError: () => toast.error(t('settings.configSaveFailed')),
  });

  const testMutation = useMutation({
    mutationFn: (phone: string) => whatsappApi.sendTest(phone),
    onSuccess: (data) => {
      if (data?.success) {
        toast.success(t('settings.testMessageSent'));
      } else {
        toast.error(t('settings.testFailed'));
      }
    },
    onError: () => toast.error(t('settings.testSendFailed')),
  });

  const handleSave = () => {
    saveMutation.mutate(waConfig);
  };

  if (isLoading) return <PageLoader />;

  const logs = (logData as any)?.data || [];

  const messageTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
      order_confirmation: 'info',
      order_shipped: 'warning',
      order_delivered: 'success',
      payment_received: 'success',
      payment_reminder: 'danger',
    };
    return <Badge variant={variants[type] || 'default'}>{type.replace(/_/g, ' ')}</Badge>;
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'danger' | 'default'> = {
      sent: 'success',
      delivered: 'success',
      read: 'success',
      failed: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('settings.title')}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'whatsapp' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('whatsapp')}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          {t('settings.whatsappNotifications')}
        </button>
      </div>

      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          {/* API Configuration */}
          <Card>
            <CardBody>
              <CardTitle>{t('settings.whatsappConfig')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                {t('settings.whatsappConfigDesc')}.{' '}
                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-green-600 underline">
                  {t('settings.metaForDev')}
                </a>
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">{t('settings.enableWhatsapp')}</label>
                  <button
                    type="button"
                    onClick={() => setWaConfig((c) => ({ ...c, enabled: !c.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${waConfig.enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${waConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-sm ${waConfig.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    {waConfig.enabled ? t('settings.enabled') : t('settings.disabled')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('settings.phoneNumberId')}
                    value={waConfig.phone_number_id}
                    onChange={(e) => setWaConfig((c) => ({ ...c, phone_number_id: e.target.value }))}
                    placeholder="e.g., 1234567890"
                  />
                  <Input
                    label={t('settings.businessAccountId')}
                    value={waConfig.business_account_id}
                    onChange={(e) => setWaConfig((c) => ({ ...c, business_account_id: e.target.value }))}
                    placeholder="e.g., 9876543210"
                  />
                </div>

                <div className="relative">
                  <Input
                    label={t('settings.accessToken')}
                    type={showToken ? 'text' : 'password'}
                    value={waConfig.access_token}
                    onChange={(e) => setWaConfig((c) => ({ ...c, access_token: e.target.value }))}
                    placeholder="EAAxxxxxxx..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  label={t('settings.defaultCountryCode')}
                  value={waConfig.default_country_code}
                  onChange={(e) => setWaConfig((c) => ({ ...c, default_country_code: e.target.value }))}
                  placeholder="+91"
                />
              </div>
            </CardBody>
          </Card>

          {/* Template Names */}
          <Card>
            <CardBody>
              <CardTitle>{t('settings.messageTemplates')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                {t('settings.templatesMustMatch')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('settings.orderConfirmationTemplate')}
                  value={waConfig.template_order_confirmation}
                  onChange={(e) => setWaConfig((c) => ({ ...c, template_order_confirmation: e.target.value }))}
                />
                <Input
                  label={t('settings.orderShippedTemplate')}
                  value={waConfig.template_order_shipped}
                  onChange={(e) => setWaConfig((c) => ({ ...c, template_order_shipped: e.target.value }))}
                />
                <Input
                  label={t('settings.orderDeliveredTemplate')}
                  value={waConfig.template_order_delivered}
                  onChange={(e) => setWaConfig((c) => ({ ...c, template_order_delivered: e.target.value }))}
                />
                <Input
                  label={t('settings.paymentReceivedTemplate')}
                  value={waConfig.template_payment_received}
                  onChange={(e) => setWaConfig((c) => ({ ...c, template_payment_received: e.target.value }))}
                />
                <Input
                  label={t('settings.paymentReminderTemplate')}
                  value={waConfig.template_payment_reminder}
                  onChange={(e) => setWaConfig((c) => ({ ...c, template_payment_reminder: e.target.value }))}
                />
              </div>
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              icon={<Save className="w-4 h-4" />}
              onClick={handleSave}
              loading={saveMutation.isPending}
            >
              {t('settings.saveConfig')}
            </Button>
          </div>

          {/* Test Message */}
          <Card>
            <CardBody>
              <CardTitle>{t('settings.sendTestMessage')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                {t('settings.sendTestDesc')}
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder={t('settings.testPhonePlaceholder')}
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1"
                />
                <Button
                  icon={<Send className="w-4 h-4" />}
                  onClick={() => testMutation.mutate(testPhone)}
                  loading={testMutation.isPending}
                  disabled={!testPhone}
                >
                  {t('settings.sendTest')}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Notification Log */}
          <Card>
            <CardBody>
              <CardTitle>{t('settings.recentNotificationLog')}</CardTitle>
              <div className="mt-4 overflow-x-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">{t('settings.noNotificationsSent')}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 pr-4">{t('common.type')}</th>
                        <th className="pb-2 pr-4">{t('common.phone')}</th>
                        <th className="pb-2 pr-4">{t('common.status')}</th>
                        <th className="pb-2 pr-4">Order</th>
                        <th className="pb-2">{t('settings.sentAt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log: any) => (
                        <tr key={log.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4">{messageTypeBadge(log.messageType)}</td>
                          <td className="py-2 pr-4 font-mono text-xs">{log.phoneNumber}</td>
                          <td className="py-2 pr-4">{statusBadge(log.status)}</td>
                          <td className="py-2 pr-4">{log.orderId ? `#${log.orderId}` : '-'}</td>
                          <td className="py-2 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
