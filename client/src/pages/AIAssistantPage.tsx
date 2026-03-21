import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Send, MessageSquare, Bell, Plus, Check, AlertTriangle, Info,
  AlertCircle, Brain, RefreshCw, Zap, Droplets, Factory,
  FlaskConical, Receipt, ShoppingCart, Package, TrendingUp,
} from 'lucide-react';
import { Button, Card, CardBody, CardTitle, Tabs, PageLoader, Badge, EmptyState, Spinner } from '../components/ui';
import { aiApi } from '../services/modules.api';

// ============================================================
// FARM SUMMARY TAB — Agentic AI that reads all modules
// ============================================================
function FarmSummaryTab() {
  const queryClient = useQueryClient();

  // Fetch the raw farm snapshot (no AI, just data)
  const { data: snapshot, isLoading: snapshotLoading } = useQuery({
    queryKey: ['farm-snapshot'],
    queryFn: () => aiApi.getFarmSnapshot(),
    staleTime: 60_000, // 1 min cache
  });

  // Farm summary mutation (calls AI)
  const summaryMutation = useMutation({
    mutationFn: (vars: { provider?: string }) => aiApi.getFarmSummary(vars.provider),
    onError: () => toast.error('Failed to generate AI summary. Check your API key in Settings.'),
  });

  const snap = snapshot as Record<string, any> | undefined;

  const metricCards = snap ? [
    { label: 'Active Ponds', value: snap.ponds?.active ?? 0, icon: <Droplets className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Harvest (Month)', value: `${snap.harvest?.thisMonth?.totalWetKg ?? 0} kg`, icon: <Factory className="w-5 h-5 text-green-600" />, color: 'bg-green-50' },
    { label: 'Production', value: `${snap.production?.thisMonth?.powderKg ?? 0} kg powder`, icon: <TrendingUp className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50' },
    { label: 'Low Stock Chemicals', value: snap.chemicals?.lowStockCount ?? 0, icon: <FlaskConical className="w-5 h-5 text-orange-600" />, color: 'bg-orange-50' },
    { label: 'Revenue (Month)', value: `₹${Number(snap.sales?.revenue?.thisMonth ?? 0).toLocaleString()}`, icon: <ShoppingCart className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50' },
    { label: 'Expenses (Month)', value: `₹${Number(snap.expenses?.thisMonth?.totalExpenses ?? 0).toLocaleString()}`, icon: <Receipt className="w-5 h-5 text-red-600" />, color: 'bg-red-50' },
    { label: 'Pending Orders', value: snap.sales?.pendingOrders?.count ?? 0, icon: <Package className="w-5 h-5 text-indigo-600" />, color: 'bg-indigo-50' },
    { label: 'Unresolved Alerts', value: snap.alerts?.unresolvedCount ?? 0, icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />, color: 'bg-yellow-50' },
  ] : [];

  // Pond health badges
  const healthBreakdown = snap?.ponds?.healthBreakdown as Record<string, number> | undefined;

  // Water readings
  const waterReadings = (snap?.waterParameters?.readings ?? []) as Array<Record<string, any>>;

  return (
    <div className="space-y-6">
      {/* Header + Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-600" />
            Farm Intelligence Dashboard
          </h2>
          <p className="text-sm text-gray-500">Real-time data from all modules. Click "Generate AI Summary" to get actionable recommendations.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['farm-snapshot'] })}
          >
            Refresh Data
          </Button>
          <Button
            icon={<Zap className="w-4 h-4" />}
            onClick={() => summaryMutation.mutate({})}
            loading={summaryMutation.isPending}
            disabled={summaryMutation.isPending}
          >
            {summaryMutation.isPending ? 'Analyzing Farm...' : 'Generate AI Summary'}
          </Button>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      {snapshotLoading ? <PageLoader /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricCards.map((m, idx) => (
            <div key={idx} className={`${m.color} rounded-lg p-4 flex items-center gap-3`}>
              {m.icon}
              <div>
                <p className="text-xs font-medium text-gray-500">{m.label}</p>
                <p className="text-lg font-bold text-gray-900">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pond Health + Water Status */}
      {snap && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pond Health */}
          <Card>
            <CardBody>
              <CardTitle>Pond Health Status</CardTitle>
              <div className="mt-3 space-y-2">
                {healthBreakdown && Object.entries(healthBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status === 'GREEN' ? 'bg-green-500' : status === 'YELLOW' ? 'bg-yellow-500' : status === 'RED' ? 'bg-red-500' : 'bg-gray-400'}`} />
                      <span className="text-sm font-medium">{status}</span>
                    </div>
                    <span className="text-sm font-bold">{count} pond{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {snap.ponds?.ponds?.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-1 border-t border-gray-100">
                    <span className="text-gray-700">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{p.volume}</span>
                      <Badge variant={p.health === 'GREEN' ? 'success' : p.health === 'YELLOW' ? 'warning' : p.health === 'RED' ? 'danger' : 'default'}>
                        {p.health}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Latest Water Parameters */}
          <Card>
            <CardBody>
              <CardTitle>Latest Water Readings</CardTitle>
              <div className="mt-3 space-y-4">
                {waterReadings.length === 0 ? (
                  <p className="text-sm text-gray-400">No water readings recorded yet.</p>
                ) : waterReadings.map((r, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{r.pond}</span>
                      <Badge variant={r.overallRisk === 'GREEN' ? 'success' : r.overallRisk === 'YELLOW' ? 'warning' : 'danger'}>
                        {r.overallRisk}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-gray-500">pH:</span> <span className="font-medium">{r.ph}</span></div>
                      <div><span className="text-gray-500">Temp:</span> <span className="font-medium">{r.temperature}</span></div>
                      <div><span className="text-gray-500">DO:</span> <span className="font-medium">{r.dissolvedOxygen}</span></div>
                      <div><span className="text-gray-500">NH3:</span> <span className="font-medium">{r.ammoniaNh3}</span></div>
                      <div><span className="text-gray-500">TDS:</span> <span className="font-medium">{r.tds}</span></div>
                      <div><span className="text-gray-500">Hardness:</span> <span className="font-medium">{r.totalHardness}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* AI Summary Result */}
      {summaryMutation.isPending && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 py-8 justify-center">
              <Spinner />
              <div>
                <p className="text-sm font-medium text-gray-700">AI is analyzing your entire farm...</p>
                <p className="text-xs text-gray-400">Reading ponds, water params, harvests, production, chemicals, expenses, sales, inventory...</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {summaryMutation.data && !summaryMutation.isPending && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary-600" />
                  AI Farm Analysis
                </span>
              </CardTitle>
              <span className="text-xs text-gray-400">
                Generated: {new Date((summaryMutation.data as any).generatedAt).toLocaleString()}
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {formatMarkdown((summaryMutation.data as any).summary)}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/** Simple markdown-to-JSX renderer for AI output */
function formatMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('## ')) {
      return <h3 key={idx} className="text-base font-bold text-gray-900 mt-5 mb-2 flex items-center gap-1">{line.replace('## ', '')}</h3>;
    }
    if (line.startsWith('### ')) {
      return <h4 key={idx} className="text-sm font-semibold text-gray-800 mt-3 mb-1">{line.replace('### ', '')}</h4>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={idx} className="ml-4 text-sm text-gray-700 list-disc">{line.slice(2)}</li>;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={idx} className="text-sm font-semibold text-gray-900">{line.replace(/\*\*/g, '')}</p>;
    }
    if (line.trim() === '') return <br key={idx} />;
    return <p key={idx} className="text-sm text-gray-700">{line}</p>;
  });
}

// ============================================================
// CHAT TAB — Context-aware chat with farm data injection
// ============================================================
function ChatTab() {
  const queryClient = useQueryClient();
  const [selectedConvo, setSelectedConvo] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convosLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiApi.getConversations(),
  });

  const createConvoMutation = useMutation({
    mutationFn: () => aiApi.createConversation({ title: 'Farm Consultation' }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      setSelectedConvo(data.id);
      setMessages([]);
    },
    onError: () => toast.error('Failed to create conversation'),
  });

  const chatMutation = useMutation({
    mutationFn: ({ id, msg }: { id: number; msg: string }) => aiApi.chat(id, msg),
    onSuccess: (data: any) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content || data.response || data.message || 'Response received.' }]);
    },
    onError: () => {
      toast.error('Failed to get response');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not process that request. Check AI settings.' }]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !selectedConvo) return;
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    chatMutation.mutate({ id: selectedConvo, msg: message });
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const convoList = (conversations as any[]) ?? [];

  // Quick prompt buttons
  const quickPrompts = [
    'What is the current health status of all my ponds?',
    'What chemicals do I need to order this week?',
    'Calculate dosing for all ponds based on current readings',
    'Give me a P&L summary for this month',
    'Which pond has the best productivity?',
    'What should I focus on today?',
  ];

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[400px]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Conversations</h3>
          <Button size="sm" variant="ghost" icon={<Plus className="w-3 h-3" />} onClick={() => createConvoMutation.mutate()} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {convosLoading ? (
            <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
          ) : convoList.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No conversations yet.
              <br />
              <button className="text-primary-600 hover:underline mt-1" onClick={() => createConvoMutation.mutate()}>
                Start one
              </button>
            </div>
          ) : (
            convoList.map((convo: any) => (
              <button
                key={convo.id}
                onClick={() => { setSelectedConvo(convo.id); setMessages(convo.messages || []); }}
                className={`w-full text-left p-3 border-b text-sm hover:bg-gray-50 transition-colors ${selectedConvo === convo.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''}`}
              >
                <p className="font-medium text-gray-900 truncate">{convo.title || 'Conversation'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(convo.updatedAt || convo.createdAt).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 border rounded-lg flex flex-col overflow-hidden">
        {selectedConvo ? (
          <>
            <div className="px-4 py-2 border-b bg-gray-50 text-xs text-gray-500 flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary-500" />
              AI automatically reads all farm data (ponds, water params, harvest, production, chemicals, expenses, sales, inventory) with every message.
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="py-6">
                  <p className="text-center text-gray-400 text-sm mb-4">
                    Ask anything about your farm. The AI has access to all your real-time data.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setMessages([{ role: 'user', content: prompt }]);
                          chatMutation.mutate({ id: selectedConvo, msg: prompt });
                        }}
                        className="text-left text-xs p-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-gray-600"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-400 flex items-center gap-2">
                    <Spinner /> Analyzing farm data and thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about ponds, water quality, dosing, production, expenses..."
                  className="input-field flex-1"
                  disabled={chatMutation.isPending}
                />
                <Button
                  icon={<Send className="w-4 h-4" />}
                  onClick={handleSend}
                  disabled={!message.trim() || chatMutation.isPending}
                  loading={chatMutation.isPending}
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<MessageSquare size={48} />}
              title="Start a Farm Consultation"
              description="Chat with AI that has real-time access to all your farm data — ponds, water quality, harvest, chemicals, expenses, and sales."
              action={<Button onClick={() => createConvoMutation.mutate()}>New Conversation</Button>}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ALERTS TAB
// ============================================================
function AlertsTab() {
  const queryClient = useQueryClient();

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['ai-alerts'],
    queryFn: () => aiApi.getAlerts(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => aiApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-alerts'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => aiApi.resolveAlert(id),
    onSuccess: () => {
      toast.success('Alert resolved');
      queryClient.invalidateQueries({ queryKey: ['ai-alerts'] });
    },
  });

  const alertList = (alerts as any[]) ?? [];

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const severityBadge = (severity: string) => {
    const v: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
      critical: 'danger', warning: 'warning', info: 'info',
    };
    return <Badge variant={v[severity] || 'default'}>{severity}</Badge>;
  };

  return (
    <div>
      {alertsLoading ? <PageLoader /> : alertList.length === 0 ? (
        <EmptyState icon={<Bell size={48} />} title="No alerts" description="AI-generated alerts will appear here when water parameters go out of range or other issues are detected." />
      ) : (
        <div className="space-y-3">
          {alertList.map((alert: any) => (
            <Card key={alert.id} className={alert.isRead ? 'opacity-60' : ''}>
              <CardBody>
                <div className="flex items-start gap-3">
                  {severityIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${alert.isRead ? 'text-gray-500' : 'text-gray-900'}`}>{alert.title || alert.message}</p>
                      {severityBadge(alert.severity)}
                      {alert.pondName && <Badge variant="default">{alert.pondName}</Badge>}
                      {alert.isResolved && <Badge variant="success">Resolved</Badge>}
                    </div>
                    {alert.message && alert.title && <p className="text-sm text-gray-500 mt-1">{alert.message}</p>}
                    {alert.recommendation && <p className="text-sm text-primary-700 bg-primary-50 rounded p-2 mt-2">{alert.recommendation}</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!alert.isRead && (
                      <Button size="sm" variant="ghost" icon={<Check className="w-3 h-3" />} onClick={() => markReadMutation.mutate(alert.id)}>
                        Read
                      </Button>
                    )}
                    {!alert.isResolved && (
                      <Button size="sm" variant="secondary" onClick={() => resolveMutation.mutate(alert.id)}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function AIAssistantPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Agentic AI that reads all your farm data and provides actionable insights
        </p>
      </div>

      <Tabs tabs={[
        { id: 'summary', label: 'Farm Summary', icon: <Brain size={16} />, content: <FarmSummaryTab /> },
        { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} />, content: <ChatTab /> },
        { id: 'alerts', label: 'Alerts', icon: <Bell size={16} />, content: <AlertsTab /> },
      ]} />
    </div>
  );
}
