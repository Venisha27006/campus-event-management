import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { Avatar } from '../ui';
import { cn, getRoleLabel } from '../../utils';
import {
  LayoutDashboard, Calendar, Users, LogOut, Menu,
  BookOpen, Award, BarChart3, MapPin, Tag, ClipboardList, UserCheck, Mic2
} from 'lucide-react';
import NotificationBell from './NotificationBell';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Events', href: '/events', icon: <Calendar className="w-5 h-5" /> },
  { label: 'My Registrations', href: '/my-registrations', icon: <BookOpen className="w-5 h-5" />, roles: ['STUDENT', 'FACULTY_COORDINATOR'] },
  { label: 'Certificates', href: '/certificates', icon: <Award className="w-5 h-5" />, roles: ['STUDENT', 'FACULTY_COORDINATOR'] },
  { label: 'Manage Events', href: '/manage-events', icon: <ClipboardList className="w-5 h-5" />, roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'] },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'] },
  { label: 'Users', href: '/users', icon: <Users className="w-5 h-5" />, roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
  { label: 'Venues', href: '/venues', icon: <MapPin className="w-5 h-5" />, roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
  { label: 'Categories', href: '/categories', icon: <Tag className="w-5 h-5" />, roles: ['SUPER_ADMIN'] },
  { label: 'Speakers', href: '/speakers', icon: <Mic2 className="w-5 h-5" />, roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
  { label: 'Wishlist', href: '/wishlist', icon: <BookOpen className="w-5 h-5" />, roles: ['STUDENT', 'FACULTY_COORDINATOR'] },
  { label: 'Reports', href: '/reports', icon: <BarChart3 className="w-5 h-5" />, roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'FACULTY_COORDINATOR', 'STUDENT_ORGANIZER'] },
  { label: 'Audit Logs', href: '/audit-logs', icon: <UserCheck className="w-5 h-5" />, roles: ['SUPER_ADMIN'] },
];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter((item) => !item.roles || item.roles.includes(user?.role || ''));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Campus Events</p>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname.startsWith(item.href)
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/profile')}>
          <Avatar name={`${user?.firstName} ${user?.lastName}`} src={user?.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500">{getRoleLabel(user?.role || 'STUDENT')}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 lg:flex-none" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden lg:flex items-center gap-2 cursor-pointer" onClick={() => navigate('/profile')}>
              <Avatar name={`${user?.firstName} ${user?.lastName}`} src={user?.avatar} size="sm" />
              <span className="text-sm font-medium text-gray-700">{user?.firstName}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
