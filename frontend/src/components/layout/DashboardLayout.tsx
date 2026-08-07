import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

export function DashboardLayout({ children, title, subtitle, headerActions }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const handleToggle = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className={cn("transition-all duration-300", collapsed ? "ml-16" : "ml-16 lg:ml-64")}>
        <Header title={title} subtitle={subtitle}>{headerActions}</Header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
