import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { GenericListModal } from '@/components/GenericListModal';
import { getUsersByRole, getWorkOrders } from '@/services/api';
import {
  HardHat,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export default function FieldTeam() {
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0]
  );

  // Sync with Header calendar
  useEffect(() => {
    const handleStorage = () => {
      const date = localStorage.getItem('selectedDate');
      if (date) setSelectedDate(date);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [officers, setOfficers] = useState<any[]>([]);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'officers' | 'assigned' | 'pending' | null }>({
    isOpen: false,
    type: null,
  });
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('all');
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [staffData, workOrdersData] = await Promise.all([
          getUsersByRole('FIELD_OFFICER').catch(() => []),
          getWorkOrders().catch(() => [])
        ]);
        
        setWorkOrders(workOrdersData || []);

        // Process staff metrics based on real work orders
        const processedOfficers = (staffData || []).map((staff: any) => {
          const staffWOs = (workOrdersData || []).filter((wo: any) => wo.staff_id === staff.id);
          const totalAssigned = staffWOs.length;
          const completed = staffWOs.filter((wo: any) => wo.status === 'Completed' || wo.status === 'Resolved').length;
          const open = totalAssigned - completed;

          // Calculate SLA compliance (mock logic for demo if dates aren't perfect)
          const slaBreached = staffWOs.filter((wo: any) => {
            if (!wo.sla_deadline || !wo.resolved_at) return false;
            return new Date(wo.resolved_at) > new Date(wo.sla_deadline);
          }).length;

          const compliantCount = completed - slaBreached;
          const slaCompliancePercent = completed > 0
            ? Math.round((compliantCount / completed) * 100)
            : 100;

          // Dynamic average resolution time
          let avgResStr = '-';
          const resolvedWOs = staffWOs.filter((wo: any) => wo.resolved_at && wo.created_at);
          if (resolvedWOs.length > 0) {
            const totalHours = resolvedWOs.reduce((sum: number, wo: any) => {
              const diff = new Date(wo.resolved_at).getTime() - new Date(wo.created_at).getTime();
              return sum + (diff / (1000 * 60 * 60));
            }, 0);
            avgResStr = (totalHours / resolvedWOs.length).toFixed(1) + 'h';
          }

          return {
            id: staff.id,
            name: staff.full_name || staff.username || 'Unknown',
            designation: 'Field Officer',
            status: 'Active', 
            currentWard: staff.ward_number || 'Unassigned',
            phone: staff.mobile_number || staff.username || '-',
            username: staff.username || '',
            mobile_number: staff.mobile_number || '',
            totalAssigned,
            resolvedCount: completed,
            openComplaints: open, 
            inProgress: staffWOs.filter((wo: any) => wo.status === 'In Progress' || wo.status === 'WIP').length,
            avgResolutionTime: avgResStr,
            slaCompliancePercent,
            slaViolated: slaBreached,
          };
        });

        setOfficers(processedOfficers);

      } catch (err) {
        console.error('Failed to fetch field team data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  const activeOfficers = officers.filter((o) => o.status === 'Active');
  const totalAssigned = officers.reduce((sum, o) => sum + o.totalAssigned, 0);
  const totalOpen = officers.reduce((sum, o) => sum + o.openComplaints, 0);
  const avgCompliance = activeOfficers.length > 0
    ? Math.round(activeOfficers.reduce((sum, o) => sum + o.slaCompliancePercent, 0) / activeOfficers.length)
    : 100;

  const officerWorkloadData = activeOfficers.map((o) => ({
    name: o.name.replace('Field ', ''),
    compliance: o.slaCompliancePercent,
    assigned: o.totalAssigned,
    resolved: o.resolvedCount,
  })).sort((a, b) => b.assigned - a.assigned);

  const radarChartData = [...officerWorkloadData];
  while (radarChartData.length > 0 && radarChartData.length < 3) {
    radarChartData.push({
      name: ' ',
      compliance: radarChartData[0].compliance,
      assigned: radarChartData[0].assigned,
      resolved: radarChartData[0].resolved,
    });
  }

  const officerColumns = [
    { key: 'name', header: 'Name' },
    { key: 'currentWard', header: 'Ward' },
    { key: 'status', header: 'Status', render: (o: any) => <StatusBadge status={o.status} /> },
    { key: 'totalAssigned', header: 'Assigned' },
    { key: 'resolvedCount', header: 'Resolved' },
    { key: 'openComplaints', header: 'Not Resolved' },
  ];

  const workOrderColumns = [
    { 
      key: 'serial', 
      header: 'S.No', 
      render: (_w: any, index?: number) => <span className="font-mono text-xs text-slate-500">{(index ?? 0) + 1}</span> 
    },
    { 
      key: 'created_at', 
      header: 'Timestamp', 
      render: (w: any) => {
        if (!w.created_at) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-700">{new Date(w.created_at).toLocaleDateString()}</span>
            <span className="text-xs text-slate-500">{new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      }
    },
    { key: 'work_type', header: 'Work Type' },
    { 
      key: 'staff', 
      header: 'Assigned Officer', 
      render: (w: any) => {
        if (!w.staff_id || w.staff_id === 'SELF') {
          return <span className="text-muted-foreground">Unassigned</span>;
        }
        const officer = officers.find(o => 
          String(o.id) === String(w.staff_id) || 
          String(o.phone) === String(w.staff_id) || 
          String(o.username) === String(w.staff_id) ||
          String(o.mobile_number) === String(w.staff_id)
        );
        
        let displayName = officer?.name || '';
        // If officer name is missing or just raw phone digits, format clearly as Field Officer
        if (!displayName || /^\d+$/.test(displayName)) {
          displayName = `Field Officer (${w.staff_id})`;
        }

        return <span className="font-medium text-slate-700">{displayName}</span>;
      }
    },
    { key: 'status', header: 'Status', render: (w: any) => <StatusBadge status={w.status} /> },
  ];

  const filteredWorkOrders = selectedOfficer === 'all' 
    ? workOrders 
    : workOrders.filter(wo => String(wo.staff_id) === selectedOfficer);

  if (loading) {
    return (
      <DashboardLayout title="Officer">
        <div className="flex h-64 items-center justify-center">Loading team data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Officer">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Active Officers"
          value={activeOfficers.length}
          icon={<HardHat className="h-5 w-5" />}
          onClick={() => setModalState({ isOpen: true, type: 'officers' })}
        />
        <KPICard
          title="Total Assigned"
          value={totalAssigned}
          icon={<Users className="h-5 w-5" />}
          onClick={() => setModalState({ isOpen: true, type: 'assigned' })}
        />
        <KPICard
          title="Pending Tasks"
          value={totalOpen}
          icon={<Clock className="h-5 w-5" />}
          variant={totalOpen > 10 ? 'warning' : 'success'}
          onClick={() => setModalState({ isOpen: true, type: 'pending' })}
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Workload Radar */}
        <div className="chart-container">
          <h4 className="mb-4 font-semibold">Officer Workload Analysis</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart outerRadius={90} data={radarChartData.slice(0, 5)}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
              <Radar
                name="Total Work Assigned"
                dataKey="assigned"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Complaints vs Resolved */}
        <div className="chart-container">
          <h4 className="mb-4 font-semibold">Workload vs Resolution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={officerWorkloadData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                interval={0} 
                angle={-20} 
                textAnchor="end" 
                height={50}
                tick={{ fontSize: 10, fontWeight: 500 }} 
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="assigned" name="Assigned" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Table */}
      <div className="mb-8">
        <h4 className="mb-4 font-semibold">Field Team List</h4>
        <DataTable data={officers} columns={officerColumns} maxHeight="400px" />
      </div>

      {/* Individual Records */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-semibold">Individual Records</h4>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm max-w-xs"
            value={selectedOfficer}
            onChange={(e) => setSelectedOfficer(e.target.value)}
          >
            <option value="all">All Officers</option>
            {officers.map(o => (
              <option key={o.id} value={String(o.id)}>{o.name}</option>
            ))}
          </select>
        </div>
        <DataTable data={filteredWorkOrders} columns={workOrderColumns} maxHeight="400px" />
      </div>

      <GenericListModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: null })}
        title={
          modalState.type === 'officers'
            ? 'Active Field Officers'
            : modalState.type === 'assigned'
            ? 'All Assigned Tasks'
            : 'Pending Tasks'
        }
        data={
          modalState.type === 'officers'
            ? activeOfficers
            : modalState.type === 'assigned'
            ? workOrders
            : workOrders.filter(wo => {
                const s = (wo.status || '').toUpperCase();
                return s === 'PENDING' || s === 'SUBMITTED';
              })
        }
        columns={modalState.type === 'officers' ? officerColumns : workOrderColumns}
      />
    </DashboardLayout>
  );
}
