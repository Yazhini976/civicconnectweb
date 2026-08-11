import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Droplets,
  Activity,
  Lightbulb,
  Trash2,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Users,
  HardHat,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ---- Subcategory config per module ---- */
const MODULE_SUBCATEGORIES: Record<string, string[]> = {
  'Water Utility': ['Leakage', 'No Water Supply', 'Contaminated Water', 'Others'],
  'UGSS': ['Manhole Missing', 'Clogged Drain', 'Sewage Overflow', 'Pipe Blockage', 'Foul Smell', 'Others'],
  'Street Lighting': ['Street Light Not Working', 'Light Flickering', 'Damaged Pole', 'Light On During Day', 'Others'],
  'Solid Waste': [
    'No Collection',
    'Mixed Collection',
    'Drainage Block',
    'Road Sweep',
    'Garbage Vulnerable Point (GVP)',
    'Hazardous Incineration',
    'Worker Issue',
    'Others',
  ],
  'Survey': ['Health', 'Solidwaste survey', 'Indicators', 'Records'],
};

const MODULE_ICONS: Record<string, any> = {
  'Water Utility': Droplets,
  'UGSS': Activity,
  'Street Lighting': Lightbulb,
  'Solid Waste': Trash2,
  'Survey': ClipboardList,
};

const CIVIC_MODULES = ['Water Utility', 'UGSS', 'Street Lighting', 'Solid Waste', 'Survey'];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportsExpanded, setReportsExpanded] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const activeCategory = searchParams.get('category') || '';
  const activeSubcategory = searchParams.get('sub') || '';

  let userModules: string[] = CIVIC_MODULES;
  try {
    const userData = localStorage.getItem('user') || '';
    const parsed = userData.startsWith('{') ? JSON.parse(userData) : {};
    const currentRole = (parsed.role || '').toLowerCase();

    // Use modules from DB login response if present
    if (parsed.modules && Array.isArray(parsed.modules) && parsed.modules.length > 0) {
      userModules = parsed.modules;
    } else {
      // Fallback: infer from role
      if (currentRole === 'ae1') {
        userModules = ['Water Utility', 'UGSS', 'Street Lighting'];
      } else if (currentRole === 'ae2') {
        userModules = ['Solid Waste', 'Survey'];
      } else if (currentRole === 'ae3' || currentRole === 'ae4' || currentRole === 'admin') {
        userModules = ['Water Utility', 'UGSS', 'Street Lighting', 'Solid Waste', 'Survey'];
      }
    }
  } catch (e) {
    // ignore
  }

  const allowedModules = CIVIC_MODULES.filter(m => userModules.includes(m));

  const handleModuleClick = (module: string) => {
    navigate(`/citizen?category=${encodeURIComponent(module)}`);
  };

  const handleSubcategoryClick = (module: string, sub: string) => {
    const isSameActive = activeCategory === module && activeSubcategory === sub;
    if (isSameActive) {
      navigate(`/citizen?category=${encodeURIComponent(module)}`);
    } else {
      navigate(`/citizen?category=${encodeURIComponent(module)}&sub=${encodeURIComponent(sub)}`);
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="h-9 w-9 rounded-full object-cover border border-sidebar-border" alt="Civic Connect" />
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">Civic Connect</h1>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <img src="/logo.png" className="h-9 w-9 rounded-full object-cover border border-sidebar-border" alt="Civic Connect" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {/* Overview */}
        <div className="px-2 mb-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )
            }
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Overview</span>}
          </NavLink>
        </div>

        {/* Complaints + Officer */}
        <div className="px-2 mb-2">
          <NavLink
            to="/citizen"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive && !activeCategory
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )
            }
          >
            <Users className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Complaints</span>}
          </NavLink>
          <NavLink
            to="/field-team"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )
            }
          >
            <HardHat className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Officer</span>}
          </NavLink>
        </div>

        {/* CIVIC MODULES label */}
        {!collapsed && (
          <div className="px-5 pt-3 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
              Civic Modules
            </span>
          </div>
        )}

        <div className="px-2 space-y-1">
          {allowedModules.map((moduleName) => {
            const isModuleActive = activeCategory === moduleName;
            const Icon = MODULE_ICONS[moduleName] || Droplets;
            const subs = MODULE_SUBCATEGORIES[moduleName] || [];

            return (
              <div key={moduleName} className="flex flex-col">
                <button
                  onClick={() => {
                    if (isModuleActive) {
                      navigate('/citizen');
                    } else if (moduleName === 'Survey') {
                      navigate(`/citizen?category=Survey&sub=Health`);
                    } else {
                      navigate(`/citizen?category=${encodeURIComponent(moduleName)}`);
                    }
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isModuleActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{moduleName}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          isModuleActive ? 'rotate-180' : ''
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Subcategories */}
                {!collapsed && isModuleActive && (
                  <div className="mt-1 ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
                    {subs.map((sub: string) => {
                      const isSubActive = activeSubcategory === sub;
                      return (
                        <button
                          key={sub}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/citizen?category=${encodeURIComponent(moduleName)}&sub=${encodeURIComponent(sub)}`);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-all duration-150',
                            isSubActive
                              ? 'font-semibold text-primary'
                              : 'text-sidebar-foreground/70 hover:text-primary'
                          )}
                        >
                          <div
                            className={cn(
                              'h-1.5 w-1.5 flex-shrink-0 rounded-full',
                              isSubActive ? 'bg-primary' : 'bg-sidebar-border'
                            )}
                          />
                          <span className="truncate leading-tight">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reports & Analytics */}
        <div className="px-2 mt-4 space-y-0.5">
          <button
            onClick={() => {
              if (!collapsed) setReportsExpanded(prev => !prev);
              navigate('/reports');
            }}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              location.pathname === '/reports'
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
            )}
          >
            <BarChart3 className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Reports &amp; Analytics</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    reportsExpanded ? 'rotate-180' : ''
                  )}
                />
              </>
            )}
          </button>

          {/* Report categories dropdown under Reports & Analytics */}
          {!collapsed && reportsExpanded && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
              {[
                { label: 'Citizen Satisfaction', tab: 'satisfaction' },
                { label: 'Complaint Details',    tab: 'details' },
                { label: 'Officer',              tab: 'officers' },
              ].map(({ label, tab }) => {
                const isActive = location.pathname === '/reports' && location.hash === `#${tab}`;
                return (
                  <button
                    key={tab}
                    onClick={() => navigate(`/reports#${tab}`)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150 text-sm',
                      isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-cyan-400'
                    )}
                  >
                    <div className={cn('rounded-full flex-shrink-0 w-2 h-2', isActive ? 'bg-cyan-400' : 'bg-slate-600')} />
                    <span className="text-[13px] leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer with collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
