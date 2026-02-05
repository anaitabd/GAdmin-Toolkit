'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Mail,
  Send,
  BarChart3,
  Globe,
  Menu,
  X,
  Activity,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const menuItems = [
  { text: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { text: 'Sender Accounts', icon: Mail, path: '/dashboard/accounts' },
  { text: 'Campaigns', icon: Send, path: '/dashboard/campaigns' },
  { text: 'Email Queue', icon: Menu, path: '/dashboard/queue' },
  { text: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
  { text: 'Tracking', icon: Activity, path: '/dashboard/tracking' },
  { text: 'G Suite', icon: Globe, path: '/dashboard/gsuite/domains' },
  { text: 'Settings', icon: Settings, path: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">GAdmin Toolkit</span>
          </div>
        )}
        {collapsed && <Mail className="h-6 w-6 text-primary mx-auto" />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.text}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </div>
  );
}
