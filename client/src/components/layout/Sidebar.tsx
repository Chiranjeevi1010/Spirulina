import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Waves, Droplets, Scissors, Factory,
  FlaskConical, Calculator, Receipt, Users, UserPlus,
  ShoppingCart, Package, Boxes, Landmark, MessageSquareQuote,
  Bot, BarChart3, Settings, X, Target, Search, Mail, Phone,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { cn } from '../../lib/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  resource?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUIStore();
  const permissions = (user?.role?.permissions ?? {}) as Record<string, string[]>;

  const navSections: NavSection[] = [
    {
      title: '',
      items: [
        { label: t('sidebar.items.dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      ],
    },
    {
      title: t('sidebar.sections.pondManagement'),
      items: [
        { label: t('sidebar.items.allPonds'), path: '/ponds', icon: <Waves size={20} />, resource: 'ponds' },
        { label: t('sidebar.items.waterParameters'), path: '/water-parameters', icon: <Droplets size={20} />, resource: 'water_params' },
      ],
    },
    {
      title: t('sidebar.sections.harvestProduction'),
      items: [
        { label: t('sidebar.items.dailyHarvest'), path: '/harvest', icon: <Scissors size={20} />, resource: 'harvest' },
        { label: t('sidebar.items.production'), path: '/production', icon: <Factory size={20} />, resource: 'harvest' },
      ],
    },
    {
      title: t('sidebar.sections.chemicals'),
      items: [
        { label: t('sidebar.items.chemInventory'), path: '/chemicals', icon: <FlaskConical size={20} />, resource: 'chemicals' },
        { label: t('sidebar.items.dosingCalculator'), path: '/chemicals/dosing', icon: <Calculator size={20} />, resource: 'chemicals' },
      ],
    },
    {
      title: t('sidebar.sections.finance'),
      items: [
        { label: t('sidebar.items.expenses'), path: '/expenses', icon: <Receipt size={20} />, resource: 'expenses' },
      ],
    },
    {
      title: t('sidebar.sections.salesCrm'),
      items: [
        { label: t('sidebar.items.crmDashboard'), path: '/crm', icon: <Target size={20} />, resource: 'leads' },
        { label: t('sidebar.items.customers'), path: '/customers', icon: <Users size={20} />, resource: 'customers' },
        { label: t('sidebar.items.leads'), path: '/leads', icon: <UserPlus size={20} />, resource: 'leads' },
        { label: t('sidebar.items.extractedLeads'), path: '/crm/extracted-leads', icon: <Search size={20} />, resource: 'leads' },
        { label: t('sidebar.items.emailOutreach'), path: '/crm/email', icon: <Mail size={20} />, resource: 'leads' },
        { label: t('sidebar.items.callTracker'), path: '/crm/call-tracker', icon: <Phone size={20} />, resource: 'leads' },
        { label: t('sidebar.items.orders'), path: '/orders', icon: <ShoppingCart size={20} />, resource: 'orders' },
      ],
    },
    {
      title: t('sidebar.sections.inventory'),
      items: [
        { label: t('sidebar.items.stockOverview'), path: '/inventory', icon: <Package size={20} />, resource: 'inventory' },
        { label: t('sidebar.items.batches'), path: '/batches', icon: <Boxes size={20} />, resource: 'inventory' },
      ],
    },
    {
      title: t('sidebar.sections.marketing'),
      items: [
        { label: t('sidebar.items.demoFarms'), path: '/marketing', icon: <Landmark size={20} />, resource: 'marketing' },
        { label: t('sidebar.items.testimonials'), path: '/marketing/testimonials', icon: <MessageSquareQuote size={20} />, resource: 'marketing' },
      ],
    },
    {
      title: t('sidebar.sections.aiReports'),
      items: [
        { label: t('sidebar.items.aiAssistant'), path: '/ai-assistant', icon: <Bot size={20} />, resource: 'ai' },
        { label: t('sidebar.items.reports'), path: '/reports', icon: <BarChart3 size={20} />, resource: 'reports' },
      ],
    },
    {
      title: t('sidebar.sections.system'),
      items: [
        { label: t('sidebar.items.settings'), path: '/settings', icon: <Settings size={20} />, resource: 'settings' },
      ],
    },
  ];

  const hasAccess = (resource?: string) => {
    if (!resource) return true;
    return permissions[resource]?.includes('read') ?? false;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Waves size={18} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-gray-900">{t('login.title')}</span>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => hasAccess(item.resource));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="mb-2">
              {section.title && (
                <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {!sidebarCollapsed && section.title}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )
                  }
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User info */}
      {user && !sidebarCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.role?.displayName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col bg-white border-r border-gray-200 transition-all',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
