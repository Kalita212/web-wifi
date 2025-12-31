import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  TrendingDown, 
  FileBarChart, 
  Settings,
  LogOut,
  Wifi
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Pelanggan', href: '/customers', icon: Users },
  { name: 'Pembayaran', href: '/payments', icon: CreditCard },
  { name: 'Modal WiFi', href: '/expenses', icon: TrendingDown },
  { name: 'Laporan', href: '/reports', icon: FileBarChart },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { signOut } = useAuth();

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 fixed left-0 top-0 z-30">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WiFi Manager</h1>
            <p className="text-xs text-gray-500">Business Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon 
                className={`w-5 h-5 transition-colors duration-200 group-hover:scale-110`} 
              />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="px-4 py-4 border-t border-gray-200">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}