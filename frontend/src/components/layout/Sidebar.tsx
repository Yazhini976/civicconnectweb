import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Droplets,
  Activity,
  Lightbulb,
  Trash2,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
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
  'Survey': ['Health', 'Solidwaste survey'],
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

  const searchParams = new URLSearchParams(location.search);
  const activeCategory = searchParams.get('category') || '';
  const activeSubcategory = searchParams.get('sub') || '';

  let userModules: string[] = CIVIC_MODULES;
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.modules) {
        userModules = parsed.modules;
      }
      
      // Auto-inject Street Lighting for ae1 if it's missing (to avoid requiring re-login)
      if (parsed.role === 'ae1' && !userModules.includes('Street Lighting')) {
        userModules.push('Street Lighting');
        parsed.modules = userModules;
        localStorage.setItem('user', JSON.stringify(parsed));
      }

      // Auto-inject Survey for admin and ae2 if it's missing
      if ((parsed.role === 'admin' || parsed.role === 'ae2') && !userModules.includes('Survey')) {
        userModules.push('Survey');
        parsed.modules = userModules;
        localStorage.setItem('user', JSON.stringify(parsed));
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

        {/* Complaints + Office Performance */}
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
            {!collapsed && <span>Office Performance</span>}
          </NavLink>
        </div>

        {/* CIVIC MODULES label */}
        {!collapsed && (
          <div className="px-5 pt-3 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-muted">
              Civic Modules
            </span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-2">
            <div className="h-px w-8 bg-sidebar-border" />
          </div>
        )}

        {/* Module items with subcategories */}
        <div className="px-2 space-y-0.5">
          {allowedModules.map((module) => {
            const Icon = MODULE_ICONS[module];
            const subcategories = MODULE_SUBCATEGORIES[module];
            const isModuleActive = location.pathname === '/citizen' && activeCategory === module;

            return (
              <div key={module} className="group relative">
                {/* Module button */}
                <button
                  onClick={() => handleModuleClick(module)}
                  title={collapsed ? module : ''}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200',
                    isModuleActive
                      ? 'bg-sidebar-accent/60 text-white'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 flex-shrink-0 stroke-[2.5]',
                      isModuleActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-bold truncate flex-1 text-left">{module}</span>
                  )}
                </button>

                {/* Subcategories — expanded when module is active, hover when collapsed */}
                {!collapsed ? (
                  <div
                    className={cn(
                      'ml-8 overflow-hidden transition-all duration-300',
                      isModuleActive ? 'max-h-[500px] mt-1 mb-1' : 'max-h-0 group-hover:max-h-[500px] group-hover:mt-1'
                    )}
                  >
                    {subcategories.map((sub) => {
                      const isSubActive = isModuleActive && activeSubcategory === sub;
                      return (
                        <button
                          key={sub}
                          onClick={() => handleSubcategoryClick(module, sub)}
                          className={cn(
                            'w-full flex items-center gap-3 py-2 px-2 rounded-lg text-left transition-all duration-150',
                            isSubActive
                              ? 'text-cyan-400 font-semibold'
                              : 'text-slate-400 hover:text-cyan-400'
                          )}
                        >
                          <div
                            className={cn(
                              'rounded-full flex-shrink-0 w-2 h-2',
                              isSubActive
                                ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]'
                                : 'bg-slate-600'
                            )}
                          />
                          <span className="text-[13px] leading-tight">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Collapsed: Fly-out tooltip panel */
                  <div className="absolute left-[64px] top-0 w-56 bg-[#1e293b] border border-slate-700 rounded-xl p-3 hidden group-hover:block shadow-2xl z-[60]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1.5 mb-1 border-b border-slate-800">
                      {module}
                    </div>
                    {subcategories.map((sub) => {
                      const isSubActive = isModuleActive && activeSubcategory === sub;
                      return (
                        <button
                          key={sub}
                          onClick={() => handleSubcategoryClick(module, sub)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 text-sm font-medium',
                            isSubActive
                              ? 'bg-slate-800 text-cyan-400'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-400'
                          )}
                        >
                          <div
                            className={cn(
                              'rounded-full flex-shrink-0 w-2 h-2',
                              isSubActive ? 'bg-cyan-400' : 'bg-cyan-500/40'
                            )}
                          />
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom links */}
        <div className="px-2 mt-4 space-y-0.5">
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )
            }
          >
            <BarChart3 className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Reports & Analytics</span>}
          </NavLink>

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
