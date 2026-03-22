import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, PanelLeftClose, PanelLeft, Bell, LogOut, User, ChevronDown, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const { toggleSidebar, toggleSidebarCollapse, sidebarCollapsed, language, setLanguage } = useUIStore();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/login'),
    } as any);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Mobile: hamburger menu */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        {/* Desktop: collapse/expand toggle */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-2 rounded-md hover:bg-gray-100"
        >
          {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100">
          <Globe size={16} className="text-gray-500" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs font-medium text-gray-600 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="en">EN</option>
            <option value="te">తె</option>
          </select>
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-md hover:bg-gray-100 relative">
          <Bell size={20} className="text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {user?.firstName} {user?.lastName}
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-primary-600 mt-0.5">{user?.role?.displayName}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User size={16} /> {t('header.profile')}
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> {t('header.signOut')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
