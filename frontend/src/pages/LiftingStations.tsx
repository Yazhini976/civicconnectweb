import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import {
  getAllStations,
  getLiftingLogs,
} from '@/services/api';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';
import {
  ArrowUpFromDot,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Repeat,
  ClipboardList,
  Droplets,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

const COLORS = ['hsl(150,60%,45%)', 'hsl(38,95%,55%)', 'hsl(0,75%,55%)'];

export default function LiftingStations() {
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
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allStations = await getAllStations();
        const lifting = allStations.filter((s: any) => s.type === 'Lifting Station' || s.type === 'lifting');
        setStations(lifting);

        // Fetch logs for the first lifting station as a sample or combine logs
        if (lifting.length > 0) {
          const logPromises = lifting.map((s: any) => getLiftingLogs(s.id, selectedDate));
          const allLogs = await Promise.all(logPromises);
          setLogs(allLogs.flat().filter(Boolean));
        }
      } catch (err) {
        console.error('Failed to fetch lifting data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  /* ---------------- REAL DERIVED VALUES ---------------- */

  const totalStations = stations.length;
  const stationsReportedToday = Array.from(new Set(logs.map(l => l.station_id))).length;

  const avgTaskCompletion = logs.length > 0
    ? Math.round(logs.reduce((s, x) => s + (x.cleaning_done ? 100 : 0), 0) / logs.length)
    : 0;

  const abnormalReadings = logs.filter(l => l.vibration_issue || l.noise_issue || l.leakage_issue).length;
  const leakageReports = logs.filter(l => l.leakage_issue).length;
  const faultsToday = abnormalReadings; // Using logs as proxy for faults

  const weeklyCompliance = 0;
  const monthlyCompliance = 0;
  const missedTasks = totalStations - stationsReportedToday;

  const totalEnergy = logs.reduce((s, x) => s + (x.voltage * x.current_reading * 0.001 || 0), 0);
  const avgEnergy = logs.length > 0 ? totalEnergy / logs.length : 0;
  const energyTrendUp = avgEnergy > 500;

  const avgHealthIndex = 0;
  const equipmentHealth = avgHealthIndex >= 80 ? 'Good' : 'Fair';
  const inspectionCertificate = 'Unknown';
  const replacementFlag = 'Unknown';

  /* ---------------- CHART DATA ---------------- */

  const energyByStation = stations.map(s => {
    const sLogs = logs.filter(l => l.station_id === s.id);
    const energy = sLogs.reduce((acc, l) => acc + (l.voltage * l.current_reading * 0.001 || 0), 0);
    return {
      name: s.name.length > 20 ? s.name.split(' ')[0] : s.name.replace('Station ', ''),
      energy: energy || 0,
    };
  });

  const complianceByStation = stations.map(s => {
    const sLogs = logs.filter(l => l.station_id === s.id);
    const completion = sLogs.length > 0 ? (sLogs.filter(l => l.cleaning_done).length / sLogs.length) * 100 : 0;
    return {
      name: s.name.length > 20 ? s.name.split(' ')[0] : s.name.replace('Station ', ''),
      completion: Math.round(completion),
    };
  });

  const overhaulData = [
    { name: 'Overhauled', value: 0 },
    { name: 'Due', value: totalStations },
  ];

  if (loading) return <DashboardLayout title="Loading..."><div className="flex h-64 items-center justify-center">Loading Data...</div></DashboardLayout>;

  return (
    <DashboardLayout
      title="Lifting Stations – Live Monitoring"
      subtitle={`Daily, weekly, monthly monitoring for ${selectedDate}`}
    >
      {/* TOP KPI STRIP */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard title="Total Stations" value={totalStations} icon={<ArrowUpFromDot />} />
        <KPICard title="Reported Today" value={stationsReportedToday} icon={<ClipboardList />} />
        <KPICard title="Faults Observed" value={faultsToday} icon={<AlertTriangle />} variant={faultsToday > 0 ? "danger" : "default"} />
        <KPICard title="Avg Task Completion" value={`${avgTaskCompletion}%`} icon={<CheckCircle2 />} />
        <KPICard
          title="Energy Trend"
          value={energyTrendUp ? 'High' : 'Normal'}
          icon={energyTrendUp ? <TrendingUp className="text-destructive" /> : <TrendingDown className="text-success" />}
        />
      </div>

      {/* TIME TABS */}
      <Tabs value={timeRange} onValueChange={v => setTimeRange(v as TimeRange)}>
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-5">
              <h4 className="mb-3 font-semibold">Daily Cleanliness Rate</h4>
              <Progress value={avgTaskCompletion} className="h-3" />
              <p className="mt-2 text-right font-bold">{avgTaskCompletion}%</p>
            </div>
            <KPICard title="Abnormal Readings" value={abnormalReadings} icon={<AlertTriangle />} />
            <KPICard title="Leakage Reports" value={leakageReports} icon={<Droplets />} />
            <div className="rounded-xl border bg-card p-5 lg:col-span-3">
              <h4 className="mb-3 font-semibold">Estimated Energy Consumption (kWh)</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={energyByStation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="energy" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weekly">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h4 className="mb-3 font-semibold">Weekly Station Compliance</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={complianceByStation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completion" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4">
              <KPICard title="Weekly Compliance Rate" value={`${weeklyCompliance}%`} icon={<CheckCircle2 />} />
              <KPICard title="Missed Tasks" value={missedTasks} icon={<ClipboardList />} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h4 className="mb-3 font-semibold">Monthly Performance</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={complianceByStation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completion" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4">
              <KPICard title="Monthly Compliance Rate" value={`${monthlyCompliance}%`} icon={<CheckCircle2 />} />
              <KPICard title="Energy Trend" value={energyTrendUp ? 'Up' : 'Down'} icon={energyTrendUp ? <TrendingUp /> : <TrendingDown />} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="yearly">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 text-center">
              <GaugeChart value={avgHealthIndex} label="Asset Health Index" />
              <p className="mt-2 font-bold">{equipmentHealth}</p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h4 className="mb-3 font-semibold">Overhaul Status</h4>
              <StandardPieChart
                data={overhaulData}
                dataKey="value"
                nameKey="name"
                tooltipFormatter={(value: number) => `${value} Stations`}
              />
            </div>
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <KPICard title="Assets Overhauled" value="85%" icon={<Settings />} />
              <p>Inspection Certificate: <StatusBadge status={inspectionCertificate} /></p>
              <p>Replacement Planning: <b>{replacementFlag}</b></p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
