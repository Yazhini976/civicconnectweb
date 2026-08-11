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
  getWards,
  getComplaints,
} from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [rawComplaints, setRawComplaints] = useState<any[]>([]);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    getWards().then((res) => {
      if (res && Array.isArray(res.wards)) {
        setWards(res.wards);
      }
    }).catch(() => {});
  }, []);

  /* =======================
     MODAL STATE
     ======================= */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTimeRange, setModalTimeRange] = useState<'all-time'|'today'>('all-time');
  const [modalStatus, setModalStatus] = useState<'all' | 'Resolved' | 'In Progress' | 'Submitted' | 'Pending' | 'Rejected'>('all');

  const openModal = (title: string, timeRange: 'all-time'|'today', status: 'all' | 'Resolved' | 'In Progress' | 'Submitted' | 'Pending' | 'Rejected') => {
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
          officerData,
          complaintsData,
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
          getComplaints(),     // All complaints for ward filtering
        ]);

        setComplaintStats(statsData || {});
        setComplaintTypeStats(typeData || {});
        setStations(stationsData || []);
        setPendingFaultsList(faultsData || []);
        setStationCounts(countsData);
        setSlaTrend(slaData || []);
        setEnergyTrend(energyData || []);
        setOfficerStats(officerData || []);
        setRawComplaints(Array.isArray(complaintsData) ? complaintsData : []);

        // Calculate all-time totals from the untyped status object
        const safeAllTimeComplaints = (allTimeComplaints && typeof allTimeComplaints === 'object' && !('error' in allTimeComplaints)) ? allTimeComplaints : {};
        const totalAll = Object.values(safeAllTimeComplaints).reduce((acc: number, val: any) => acc + (typeof val === 'number' ? val : 0), 0);
        setAllTimeStatsObj(safeAllTimeComplaints);
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
     WARD FILTERED COMPLAINTS
     ======================= */
  const wardFilteredComplaints = useMemo(() => {
    if (selectedWard === null) return rawComplaints;
    return rawComplaints.filter(c =>
      String(c.ward_number) === String(selectedWard) ||
      Number(c.ward_number) === selectedWard
    );
  }, [rawComplaints, selectedWard]);

  /* =======================
     DERIVED KPI COUNTS (WARD-AWARE)
     ======================= */
  const wardTotalComplaints = wardFilteredComplaints.length;
  const wardResolvedCount = wardFilteredComplaints.filter(c => {
    const s = (c.status || '').toUpperCase();
    return s === 'RESOLVED' || s === 'COMPLETED';
  }).length;
  const wardPendingCount = wardFilteredComplaints.filter(c => {
    const s = (c.status || '').toUpperCase();
    return s === 'SUBMITTED' || s === 'PENDING' || s === 'ASSIGNED';
  }).length;
  const wardInProgressCount = wardFilteredComplaints.filter(c => {
    const s = (c.status || '').toUpperCase();
    return s === 'IN PROGRESS' || s === 'IN_PROGRESS' || s === 'WIP';
  }).length;

  /* =======================
     CHART DATA (WARD-AWARE)
     ======================= */
  const wardComplaintsByStatus = useMemo(() => {
    const statuses = ['Submitted', 'In Progress', 'Resolved', 'Rejected'];
    const map: Record<string, number> = {};
    statuses.forEach(s => map[s] = 0);
    wardFilteredComplaints.forEach(c => {
      const s = c.status || 'Submitted';
      if (map[s] !== undefined) map[s]++;
      else map['Submitted']++;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [wardFilteredComplaints]);

  const wardComplaintsByType = useMemo(() => {
    const map: Record<string, number> = {};
    wardFilteredComplaints.forEach(c => {
      const t = c.type || c.category || 'Other';
      map[t] = (map[t] || 0) + 1;
    });
    const sorted = Object.entries(map).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
    if (sorted.length <= 5) return sorted;
    const top5 = sorted.slice(0, 5);
    const othersCount = sorted.slice(5).reduce((sum, item) => sum + item.count, 0);
    return [...top5, { type: 'Others', count: othersCount }];
  }, [wardFilteredComplaints]);

  const safeComplaintStats = (complaintStats && typeof complaintStats === 'object' && !('error' in complaintStats)) ? complaintStats : {};
  const totalComplaints = Object.values(safeComplaintStats).reduce((acc: number, val: any) => acc + (typeof val === 'number' ? val : 0), 0);
  const resolvedCount = typeof safeComplaintStats['Resolved'] === 'number' ? safeComplaintStats['Resolved'] : 0;
  const pendingCount = Math.max(0, totalComplaints - resolvedCount);


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
      subtitle="Real-time Command Center Dashboard"
    >
      {/* System Overview Strip */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gradient-hero p-4 text-primary-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium opacity-90">Total Wards:</span>
          <span className="font-bold text-lg">{wards.length || CONFIG.totalWards || 42}</span>
        </div>

        {/* Filter Controls (Ward Select) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <span className="text-xs font-medium text-white/90">Filter Ward:</span>
            <Select 
              value={selectedWard === null ? 'all' : String(selectedWard)} 
              onValueChange={(val) => setSelectedWard(val === 'all' ? null : Number(val))}
            >
              <SelectTrigger className="h-7 w-[140px] text-xs font-semibold bg-white text-slate-800 border-none">
                <SelectValue placeholder="All Wards" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Wards ({wards.length || 42})</SelectItem>
                {(wards.length > 0 ? wards : Array.from({ length: 42 }, (_, i) => ({ ward_no: i + 1, ward_name: `Ward ${i + 1}` }))).map((w) => (
                  <SelectItem key={w.ward_no} value={String(w.ward_no)}>
                    Ward {w.ward_no}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>      {/* =======================
          KPI CARDS (OVERALL)
          ======================= */}
      <h2 className="mb-4 text-xl font-bold tracking-tight">
        {selectedWard ? `Ward ${selectedWard} Complaints` : 'Overall Complaints'}
      </h2>
      <div className="mb-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Complaints"
          value={selectedWard !== null ? wardTotalComplaints : allTimeStats.complaints}
          icon={<Users className="h-6 w-6" />}
          onClick={() => openModal('Total Complaints', 'all-time', 'all')}
        />
        <KPICard
          title="Resolved"
          value={selectedWard !== null ? wardResolvedCount : (allTimeStatsObj['Resolved'] || 0)}
          icon={<CheckCircle2 className="h-6 w-6" />}
          variant="success"
          onClick={() => openModal('Resolved Complaints', 'all-time', 'Resolved')}
        />
        <KPICard
          title="Pending"
          value={selectedWard !== null ? wardPendingCount : (allTimeStatsObj['Submitted'] || 0)}
          icon={<Clock className="h-6 w-6" />}
          variant="warning"
          onClick={() => openModal('Pending Complaints', 'all-time', 'Pending')}
        />
        <KPICard
          title="In Progress"
          value={selectedWard !== null ? wardInProgressCount : (allTimeStatsObj['In Progress'] || 0)}
          icon={<Zap className="h-6 w-6" />}
          variant="info"
          onClick={() => openModal('In Progress Complaints', 'all-time', 'In Progress')}
        />
      </div>


      {/* =======================
          CHARTS ROW 1
          ======================= */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="chart-container">
          <h3 className="mb-4 text-lg font-semibold">Complaints by Type{selectedWard ? ` – Ward ${selectedWard}` : ''}</h3>
          <StandardPieChart
            data={wardComplaintsByType}
            dataKey="count"
            nameKey="type"
            tooltipFormatter={(value: number) => `${value} Complaints`}
          />
        </div>

        <div className="chart-container">
          <h3 className="mb-4 text-lg font-semibold">Complaints by Status{selectedWard ? ` – Ward ${selectedWard}` : ''}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={wardComplaintsByStatus} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
        </div>
      </div>

      <ComplaintListModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        timeRange={modalTimeRange}
        selectedDate={selectedDate}
        statusFilter={modalStatus}
        complaintsList={selectedWard !== null ? wardFilteredComplaints : undefined}
      />
    </DashboardLayout>
  );
}
