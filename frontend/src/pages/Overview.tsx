import { useMemo, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';
import { ComplaintListModal } from '@/components/ComplaintListModal';
import {
  getComplaintStats,
  getComplaintTypeStats,
  getAllStations,
  getPendingFaults,
  getStationCounts,
  getSLATrend,
  getEnergyTrend,
  getOfficerStats,
} from '@/services/api';
import {
  generateSTPData,
  CONFIG,
} from '@/data/mockData';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Droplets,
  Factory,
  HardHat,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = [
  'hsl(215, 80%, 45%)',
  'hsl(175, 60%, 45%)',
  'hsl(38, 95%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(280, 60%, 55%)', // Purple for Others
];

export default function Overview() {
  /* =======================
     DATE HANDLING (NEW)
     ======================= */
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem('selectedDate') ||
    new Date().toISOString().split('T')[0]
  );

  // Sync with Header changes
  useEffect(() => {
    const handleStorage = () => {
      const date = localStorage.getItem('selectedDate');
      if (date) setSelectedDate(date);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /* =======================
     REAL DATA STATE
     ======================= */
  const [complaintStats, setComplaintStats] = useState<Record<string, number>>({});
  const [complaintTypeStats, setComplaintTypeStats] = useState<Record<string, number>>({});
  const [stations, setStations] = useState<any[]>([]);
  const [stationCounts, setStationCounts] = useState<{ lifting: number, pumping: number, stp: number } | null>(null);
  const [pendingFaultsList, setPendingFaultsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [slaTrend, setSlaTrend] = useState<any[]>([]);
  const [energyTrend, setEnergyTrend] = useState<any[]>([]);
  const [officerStats, setOfficerStats] = useState<any[]>([]);



  const [allTimeStats, setAllTimeStats] = useState<{ complaints: number, faults: number }>({ complaints: 0, faults: 0 });
  const [allTimeStatsObj, setAllTimeStatsObj] = useState<Record<string, number>>({});

  /* =======================
     MODAL STATE
     ======================= */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTimeRange, setModalTimeRange] = useState<'all-time'|'today'>('all-time');
  const [modalStatus, setModalStatus] = useState<'all' | 'Resolved' | 'In Progress' | 'Submitted'>('all');

  const openModal = (title: string, timeRange: 'all-time'|'today', status: 'all' | 'Resolved' | 'In Progress' | 'Submitted') => {
    setModalTitle(title);
    setModalTimeRange(timeRange);
    setModalStatus(status);
    setIsModalOpen(true);
  };

  /* =======================
     FETCH DATA (DATE AWARE)
     ======================= */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          statsData,
          typeData,
          stationsData,
          faultsData,
          countsData,
          allTimeComplaints,
          allTimeFaults,
          slaData,
          energyData,
          officerData
        ] = await Promise.all([
          getComplaintStats(selectedDate),
          getComplaintTypeStats(selectedDate),
          getAllStations(),
          getPendingFaults(selectedDate),
          getStationCounts(),
          getComplaintStats(), // No date = all time
          getPendingFaults(),  // No date = all time
          getSLATrend(selectedDate),
          getEnergyTrend(selectedDate),
          getOfficerStats(),
        ]);

        setComplaintStats(statsData || {});
        setComplaintTypeStats(typeData || {});
        setStations(stationsData || []);
        setPendingFaultsList(faultsData || []);
        setStationCounts(countsData);
        setSlaTrend(slaData || []);
        setEnergyTrend(energyData || []);
        setOfficerStats(officerData || []);

        // Calculate all-time totals from the untyped status object
        const totalAll = Object.values(allTimeComplaints || {}).reduce((a: any, b: any) => a + b, 0);
        setAllTimeStatsObj(allTimeComplaints || {});
        setAllTimeStats({
          complaints: Number(totalAll) || 0,
          faults: (allTimeFaults || []).length
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  /* =======================
     DERIVED DATA
     ======================= */
  const totalComplaints = Object.values(complaintStats).reduce((a, b) => a + b, 0);
  const resolvedCount = complaintStats['Resolved'] || 0;
  const pendingCount = totalComplaints - resolvedCount;

  const liftingStations = stations.filter((s) => s.type === 'Lifting Station' || s.type === 'lifting');
  const pumpingStations = stations.filter((s) => s.type === 'Pumping Station' || s.type === 'pumping');
  const stpStations = stations.filter((s) => s.type === 'STP' || s.type === 'stp');

  const complaintsByStatus = useMemo(() => {
    const statuses = ['Submitted', 'In Progress', 'Resolved', 'Rejected'];
    const map: Record<string, number> = {};
    statuses.forEach(s => map[s] = 0);
    Object.entries(complaintStats).forEach(([status, count]) => {
      map[status] = count;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [complaintStats]);

  /* =======================
     COMPLAINT TYPE (REAL)
     ======================= */
  const complaintsByType = useMemo(() => {
    return Object.entries(complaintTypeStats).map(([type, count]) => ({
      type,
      count
    })).sort((a, b) => b.count - a.count);
  }, [complaintTypeStats]);

  const complaintsByTypeDisplay = useMemo(() => {
    if (complaintsByType.length <= 5) return complaintsByType;
    
    const top5 = complaintsByType.slice(0, 5);
    const othersCount = complaintsByType.slice(5).reduce((sum, item) => sum + item.count, 0);
    
    return [
      ...top5,
      { type: 'Others', count: othersCount }
    ];
  }, [complaintsByType]);

  const avgSlaCompliance = useMemo(() => {
    if (officerStats.length === 0) return 100;
    return Math.round(
      officerStats.reduce((sum, f) => sum + f.sla_compliance_percent, 0) / officerStats.length
    );
  }, [officerStats]);

  const escalatedCount = pendingFaultsList.filter(
    (f) => f.escalation_required
  ).length;

  if (loading) {
    return <div className="p-8 text-center">Loading Dashboard Data...</div>;
  }

  return (
    <DashboardLayout
      title="Civic Connect Admin Dashboard"
      subtitle={`Dashboard data for ${selectedDate}`}
    >
      {/* System Overview Strip */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl bg-gradient-hero p-4 text-primary-foreground">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-80">Total Wards:</span>
          <span className="font-bold">{CONFIG.totalWards}</span>
        </div>
      </div>      {/* =======================
          KPI CARDS (OVERALL)
          ======================= */}
      <h2 className="mb-4 text-xl font-bold tracking-tight">Overall Complaints</h2>
      <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Complaints"
          value={allTimeStats.complaints}
          icon={<Users className="h-6 w-6" />}
          onClick={() => openModal('Total Complaints', 'all-time', 'all')}
        />
        <KPICard
          title="Resolved"
          value={allTimeStatsObj['Resolved'] || 0}
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="success"
          onClick={() => openModal('Resolved Complaints', 'all-time', 'Resolved')}
        />
        <KPICard
          title="Pending"
          value={allTimeStatsObj['Submitted'] || 0}
          icon={<Clock className="h-6 w-6" />}
          variant="warning"
          onClick={() => openModal('Pending Complaints', 'all-time', 'Submitted')}
        />
        <KPICard
          title="In Progress"
          value={allTimeStatsObj['In Progress'] || 0}
          icon={<Zap className="h-6 w-6" />}
          variant="info"
          onClick={() => openModal('In Progress Complaints', 'all-time', 'In Progress')}
        />
      </div>

      {/* =======================
          KPI CARDS (TODAY)
          ======================= */}
      <h2 className="mb-4 text-xl font-bold tracking-tight">Today's Complaints</h2>
      <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Complaints Made Today"
          value={totalComplaints}
          icon={<Users className="h-6 w-6" />}
          onClick={() => openModal("Today's Complaints", 'today', 'all')}
        />
        <KPICard
          title="Resolved Today"
          value={resolvedCount}
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="success"
          onClick={() => openModal('Resolved Today', 'today', 'Resolved')}
        />
        <KPICard
          title="Pending Today"
          value={complaintStats['Submitted'] || 0}
          icon={<Clock className="h-6 w-6" />}
          variant="warning"
          onClick={() => openModal('Pending Today', 'today', 'Submitted')}
        />
        <KPICard
          title="In Progress Today"
          value={complaintStats['In Progress'] || 0}
          icon={<Zap className="h-6 w-6" />}
          variant="info"
          onClick={() => openModal('In Progress Today', 'today', 'In Progress')}
        />
      </div>

      {/* =======================
          CHARTS ROW 1
          ======================= */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="chart-container">
          <h3 className="mb-4 text-lg font-semibold">Complaints by Type</h3>
          <StandardPieChart
            data={complaintsByTypeDisplay}
            dataKey="count"
            nameKey="type"
            tooltipFormatter={(value: number) => `${value} Complaints`}
          />
        </div>

        <div className="chart-container">
          <h3 className="mb-4 text-lg font-semibold">Complaints by Status</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={complaintsByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="status"
                tick={{ fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                contentStyle={{
                  fontSize: '14px',
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">2 pending faults</span>
            <span className="font-medium text-primary">87% Active</span>
          </div>
        </div>
      </div>

      <ComplaintListModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        timeRange={modalTimeRange}
        selectedDate={selectedDate}
        statusFilter={modalStatus}
      />
    </DashboardLayout>
  );
}
