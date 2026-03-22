import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Send, Eye, EyeOff, MessageSquare, Mail, CheckCircle, XCircle, Wifi } from 'lucide-react';
import { Button, Input, Card, CardBody, CardTitle, Badge, PageLoader } from '../components/ui';
import { whatsappApi, emailApi } from '../services/modules.api';

export default function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('email');
  const [showToken, setShowToken] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');

  // WhatsApp config state
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

  // Email/SMTP config state
  const [emailConfig, setEmailConfig] = useState({
    enabled: true,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    from_name: 'Spirulina ERP',
    daily_limit: 20,
  });

  // WhatsApp queries
  const { data: waConfigData, isLoading: waLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: whatsappApi.getConfig,
  });

  const { data: logData } = useQuery({
    queryKey: ['whatsapp-log'],
    queryFn: () => whatsappApi.getLog({ limit: 20 }),
  });

  // Email queries
  const { data: emailConfigData, isLoading: emailLoading } = useQuery({
    queryKey: ['email-config'],
    queryFn: emailApi.getConfig,
  });

  useEffect(() => {
    if (waConfigData) {
      setWaConfig((prev) => ({ ...prev, ...waConfigData }));
    }
  }, [waConfigData]);

  useEffect(() => {
    if (emailConfigData) {
      setEmailConfig((prev) => ({ ...prev, ...(emailConfigData as any) }));
    }
  }, [emailConfigData]);

  // WhatsApp mutations
  const waSaveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => whatsappApi.updateConfig(data),
    onSuccess: () => {
      toast.success(t('settings.configSaved'));
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    },
    onError: () => toast.error(t('settings.configSaveFailed')),
  });

  const waTestMutation = useMutation({
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

  // Email mutations
  const emailSaveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => emailApi.updateConfig(data),
    onSuccess: () => {
      toast.success(t('settings.configSaved'));
      queryClient.invalidateQueries({ queryKey: ['email-config'] });
    },
    onError: () => toast.error(t('settings.configSaveFailed')),
  });

  const emailTestMutation = useMutation({
    mutationFn: async () => emailApi.testConnection(),
    onSuccess: (data: any) => {
      if (data?.success) {
        toast.success('SMTP connection successful!');
      } else {
        toast.error(`Connection failed: ${data?.error || 'Unknown error'}`);
      }
    },
    onError: () => toast.error('Failed to test SMTP connection'),
  });

  const emailSendTestMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => emailApi.send(data),
    onSuccess: () => toast.success('Test email sent successfully!'),
    onError: () => toast.error('Failed to send test email'),
  });

  if (waLoading || emailLoading) return <PageLoader />;

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
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'email' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('email')}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Email / SMTP
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${activeTab === 'whatsapp' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('whatsapp')}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          {t('settings.whatsappNotifications')}
        </button>
      </div>

      {/* ========== EMAIL TAB ========== */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* SMTP Configuration */}
          <Card>
            <CardBody>
              <CardTitle>
                <Mail className="w-5 h-5 inline mr-2 text-blue-600" />
                Email SMTP Configuration
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Configure your SMTP settings to send emails from Spirulina ERP. For Gmail, use an{' '}
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  App Password
                </a>.
              </p>

              <div className="space-y-4">
                {/* Enable toggle */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Enable Email Sending</label>
                  <button
                    type="button"
                    onClick={() => setEmailConfig((c) => ({ ...c, enabled: !c.enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailConfig.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailConfig.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-sm ${emailConfig.enabled ? 'text-blue-600' : 'text-gray-400'}`}>
                    {emailConfig.enabled ? t('settings.enabled') : t('settings.disabled')}
                  </span>
                </div>

                {/* SMTP Host & Port */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="SMTP Host"
                      value={emailConfig.smtp_host}
                      onChange={(e) => setEmailConfig((c) => ({ ...c, smtp_host: e.target.value }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <Input
                    label="SMTP Port"
                    type="number"
                    value={emailConfig.smtp_port}
                    onChange={(e) => setEmailConfig((c) => ({ ...c, smtp_port: parseInt(e.target.value) || 587 }))}
                    placeholder="587"
                  />
                </div>

                {/* SMTP User & Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="SMTP Username (Email)"
                    value={emailConfig.smtp_user}
                    onChange={(e) => setEmailConfig((c) => ({ ...c, smtp_user: e.target.value }))}
                    placeholder="your-email@gmail.com"
                  />
                  <div className="relative">
                    <Input
                      label="SMTP Password / App Password"
                      type={showSmtpPass ? 'text' : 'password'}
                      value={emailConfig.smtp_password}
                      onChange={(e) => setEmailConfig((c) => ({ ...c, smtp_password: e.target.value }))}
                      placeholder="App password (16 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    >
                      {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* From Email & Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="From Email"
                    value={emailConfig.from_email}
                    onChange={(e) => setEmailConfig((c) => ({ ...c, from_email: e.target.value }))}
                    placeholder="your-email@gmail.com"
                  />
                  <Input
                    label="From Name"
                    value={emailConfig.from_name}
                    onChange={(e) => setEmailConfig((c) => ({ ...c, from_name: e.target.value }))}
                    placeholder="Spirulina ERP"
                  />
                </div>

                {/* Daily Limit */}
                <Input
                  label="Daily Email Limit"
                  type="number"
                  value={emailConfig.daily_limit}
                  onChange={(e) => setEmailConfig((c) => ({ ...c, daily_limit: parseInt(e.target.value) || 20 }))}
                  placeholder="20"
                />
              </div>
            </CardBody>
          </Card>

          {/* Gmail Setup Guide */}
          <Card>
            <CardBody>
              <CardTitle>Gmail Setup Guide</CardTitle>
              <div className="mt-3 space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <p className="font-medium text-gray-900">Enable 2-Step Verification</p>
                    <p>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Account Security</a> and enable 2-Step Verification.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <p className="font-medium text-gray-900">Generate App Password</p>
                    <p>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">App Passwords</a>, name it "Spirulina ERP", and copy the 16-character password.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <p className="font-medium text-gray-900">Fill in above fields</p>
                    <p>Host: <code className="bg-gray-100 px-1 rounded">smtp.gmail.com</code>, Port: <code className="bg-gray-100 px-1 rounded">587</code>, Username: your Gmail, Password: the app password.</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Save & Test */}
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              variant="secondary"
              icon={<Wifi className="w-4 h-4" />}
              onClick={() => emailTestMutation.mutate()}
              loading={emailTestMutation.isPending}
            >
              Test SMTP Connection
            </Button>
            <Button
              icon={<Save className="w-4 h-4" />}
              onClick={() => emailSaveMutation.mutate(emailConfig as any)}
              loading={emailSaveMutation.isPending}
            >
              {t('settings.saveConfig')}
            </Button>
          </div>

          {/* Send Test Email */}
          <Card>
            <CardBody>
              <CardTitle>Send Test Email</CardTitle>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Send a test email to verify your SMTP configuration works.
              </p>
              <div className="flex gap-3">
                <Input
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  icon={<Send className="w-4 h-4" />}
                  onClick={() => emailSendTestMutation.mutate({
                    to: testEmail,
                    subject: 'Test Email from Spirulina ERP',
                    body: '<h2>Hello from Spirulina ERP!</h2><p>Your email configuration is working correctly.</p>',
                  })}
                  loading={emailSendTestMutation.isPending}
                  disabled={!testEmail}
                >
                  Send Test
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ========== WHATSAPP TAB ========== */}
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
              onClick={() => waSaveMutation.mutate(waConfig)}
              loading={waSaveMutation.isPending}
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
                  onClick={() => waTestMutation.mutate(testPhone)}
                  loading={waTestMutation.isPending}
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
