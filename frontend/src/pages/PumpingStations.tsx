import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import { getAllStations, getPumpingLogs } from '@/services/api';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';
import {
  Droplets,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Activity,
  Gauge,
  TrendingUp,
  TrendingDown,
  Repeat,
  ClipboardList,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'recharts';

/* ---------------- TYPES ---------------- */
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
const COLORS = ['hsl(150,60%,45%)', 'hsl(38,95%,55%)', 'hsl(0,75%,55%)'];

export default function PumpingStations() {
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0]
  );

  // Sync with Header
  useEffect(() => {
    const handleStorage = () => {
      const date = localStorage.getItem('selectedDate');
      if (date) setSelectedDate(date);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [stations, setStations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allStations = await getAllStations();
        const pumping = allStations.filter((s: any) => s.type === 'Pumping Station' || s.type === 'pumping');
        setStations(pumping);

        if (pumping.length > 0) {
          const logPromises = pumping.map((s: any) => getPumpingLogs(s.id, selectedDate));
          const allLogs = await Promise.all(logPromises);
          setLogs(allLogs.flat().filter(Boolean));
        }
      } catch (err) {
        console.error('Failed to fetch pumping data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  /* ================= ADMIN DERIVED METRICS ================= */

  const totalStations = stations.length;
  const stationsReportingToday = Array.from(new Set(logs.map(l => l.station_id))).length;

  // Placeholder logic until full history is available
  const avgDailyTaskCompletion = logs.length > 0 ? Math.round(logs.filter(l => l.status === 'Completed').length / logs.length * 100) : 0;


  const highSumpAlerts = logs.filter(l => (l.inlet_level_status === 'High' || l.inlet_level_status === 'Critical')).length;
  const abnormalElectricalReadings = logs.filter(l => l.voltage < 200 || l.voltage > 250).length;
  const faultsToday = logs.filter(l => l.vibration_issue || l.noise_issue || l.leakage_issue).length;

  // WEEKLY / MONTHLY PLACEHOLDERS
  const weeklyCompliance = 0;
  const monthlyCompliance = 0;
  const missedMaintenanceTasks = 0;
  const standbyPumpFailureRate = 0;


  // Efficiency Calculation (Proxy via Flow/Energy if available, else mock)
  const avgEfficiency = 0;
  const energyTrendImproving = false;


  // YEARLY
  const avgHealthIndex = 0;
  const assetHealth = avgHealthIndex >= 80 ? 'Good' : avgHealthIndex >= 60 ? 'Fair' : 'Poor';
  const repeatBreakdowns = 0;
  const overhaulDueCount = totalStations;
  const certificateStatus = 'Unknown';
  const replacementFlag = 'Unknown';


  /* ================= CHART DATA ================= */

  // Use logs to generate chart data
  const sumpChartData = stations.map(s => {
    const log = logs.find(l => l.station_id === s.id);
    // Mock level 0-100 if no detailed level reading exists in log (using status as proxy)
    let level = 40;
    if (log?.inlet_level_status === 'High') level = 85;
    if (log?.inlet_level_status === 'Low') level = 20;
    return {
      name: s.name.length > 20 ? s.name.split(' ')[0] : s.name.replace('Station ', ''),
      level: level,
    };
  });

  const efficiencyChartData = stations.map(s => ({
    name: s.name.length > 20 ? s.name.split(' ')[0] : s.name.replace('Station ', ''),
    efficiency: 0,
  }));


  const weeklyTrendData: any[] = [];


  const overhaulPieData = [
    { name: 'Overhaul Due', value: overhaulDueCount },
    { name: 'Healthy', value: totalStations - overhaulDueCount },
  ];

  if (loading) return <DashboardLayout title="Loading..."><div className="flex h-64 items-center justify-center">Loading Data...</div></DashboardLayout>;

  return (
    <DashboardLayout
      title="Pumping Stations Dashboard"
      subtitle={`Operational, compliance and asset planning view for ${selectedDate}`}
    >
      {/* ================= ADMIN DASHBOARD ================= */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        {/* ---------- DAILY ---------- */}
        <TabsContent value="daily">
          <div className="grid gap-4 lg:grid-cols-5">
            <KPICard title="Stations Reporting" value={stationsReportingToday} icon={<ClipboardList />} />
            <KPICard title="Task Completion" value={`${avgDailyTaskCompletion}%`} icon={<CheckCircle2 />} />
            <KPICard title="High Sump Alerts" value={highSumpAlerts} icon={<Droplets />} />
            <KPICard title="Electrical Alerts" value={abnormalElectricalReadings} icon={<Zap />} />
            <KPICard title="Faults Today" value={faultsToday} icon={<AlertTriangle />} variant={faultsToday > 0 ? "danger" : "default"} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="chart-container">
              <h4 className="mb-3 font-semibold">Sump Level Proxy (%)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sumpChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="level" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h4 className="mb-3 font-semibold">Energy Efficiency (%)</h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={efficiencyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="efficiency" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ---------- WEEKLY ---------- */}
        <TabsContent value="weekly">
          <div className="grid gap-4 lg:grid-cols-4">
            <KPICard title="Weekly Compliance" value={`${weeklyCompliance}%`} icon={<CheckCircle2 />} />
            <KPICard title="Missed Maintenance" value={missedMaintenanceTasks} icon={<Settings />} />
            <KPICard title="Standby Failure Rate" value={`${standbyPumpFailureRate}%`} icon={<AlertTriangle />} />
            <KPICard
              title="Energy Trend"
              value={energyTrendImproving ? 'Improving' : 'Declining'}
              icon={energyTrendImproving ? <TrendingUp /> : <TrendingDown />}
            />
          </div>

          <div className="mt-6 chart-container">
            <h4 className="mb-3 font-semibold">Weekly Compliance Trend</h4>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* ---------- MONTHLY ---------- */}
        <TabsContent value="monthly">
          <div className="grid gap-4 lg:grid-cols-4">
            <KPICard title="Monthly Compliance" value={`${monthlyCompliance}%`} icon={<CheckCircle2 />} />
            <KPICard title="Repeat Breakdowns" value={repeatBreakdowns} icon={<Repeat />} />
            <KPICard title="Missed Maintenance" value={missedMaintenanceTasks} icon={<Settings />} />
            <KPICard title="Avg Efficiency" value={`${avgEfficiency}%`} icon={<Gauge />} />
          </div>

          <div className="mt-6 chart-container">
            <h4 className="mb-3 font-semibold">Energy Efficiency Comparison</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={efficiencyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="efficiency" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* ---------- YEARLY ---------- */}
        <TabsContent value="yearly">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 text-center">
              <GaugeChart value={avgHealthIndex} label="Asset Health Index" />
              <p className="mt-2 font-bold">{assetHealth}</p>
            </div>

            <div className="chart-container">
              <h4 className="mb-3 font-semibold">Overhaul Planning</h4>
              <StandardPieChart
                data={overhaulPieData}
                dataKey="value"
                nameKey="name"
                tooltipFormatter={(value: number) => `${value} Stations`}
              />
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3">
              <p>Certificate Status: <StatusBadge status={certificateStatus} /></p>
              <p>Replacement Planning: <b>{replacementFlag}</b></p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Overview Cards below... (Optional extensions) */}
    </DashboardLayout>
  );
}
