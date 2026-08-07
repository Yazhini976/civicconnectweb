import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import { getAllStations, getSTPLogs } from '@/services/api';
import {
  Factory,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Zap,
  FlaskConical,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export default function STP() {
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
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [latestLog, setLatestLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allStations = await getAllStations();
        const stps = allStations.filter((s: any) => s.type === 'STP' || s.type === 'stp' || s.name.includes('STP'));
        setStations(stps);

        if (stps.length > 0) {
          const currentId = selectedStationId || stps[0].id;
          if (!selectedStationId) setSelectedStationId(currentId);

          const logs = await getSTPLogs(currentId, selectedDate);
          if (logs && logs.length > 0) {
            setLatestLog(logs[logs.length - 1]);
          } else {
            setLatestLog(null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch STP data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate, selectedStationId]);

  const stpStation = useMemo(() =>
    stations.find(s => s.id === selectedStationId) || stations[0],
    [stations, selectedStationId]
  );

  // Fallback / Default Data if no log exists
  const stpData = useMemo(() => {
    return {
      name: stpStation?.name || 'Main STP',
      dischargeLocation: 'River Yamuna',
      capacity: 45, // MLD
      installedCapacity: 50,
      currentLoad: latestLog?.inlet_flow_rate || 0,
      compliancePercent: latestLog ? (latestLog.outlet_bod <= 30 && latestLog.outlet_cod <= 100 ? 100 : 50) : 100,
      faultCount: 0, // Need to implement fault fetching for STP if needed
      escalations: 0,
      energy: {
        cost: (latestLog?.power_kwh || 0) * 8, // Approx cost
        consumption: latestLog?.power_kwh || 0
      },
      inlet: {
        bod: latestLog?.inlet_bod || 0,
        cod: latestLog?.inlet_cod || 0,
        tss: latestLog?.inlet_tss || 0,
        ph: latestLog?.inlet_ph || 7.0
      },
      outlet: {
        bod: latestLog?.outlet_bod || 0,
        cod: latestLog?.outlet_cod || 0,
        tss: latestLog?.outlet_tss || 0,
        ph: latestLog?.outlet_ph || 7.0,
        compliance: latestLog ? (latestLog.outlet_bod <= 30 && latestLog.outlet_bod <= 100) : true
      },
      processParameters: {
        aerationTime: 14.5, // Mock constant for now
        sludgeAge: 18,     // Mock constant for now
        mlss: latestLog?.mlss || 0
      },
      sludge: {
        generated: latestLog?.sludge_generated || 0,
        disposed: (latestLog?.sludge_generated || 0) * 0.9,
        pending: (latestLog?.sludge_generated || 0) * 0.1
      },
      chemicals: {
        chlorine: latestLog?.chlorine_usage || 0,
        polymer: latestLog?.polymer_usage || 0
      },
      pollutionRisk: 'Low',
      legalRisk: 'Low',
      environmentalRisk: 'Low'
    };
  }, [stpStation, latestLog]);

  const bodRemovalEfficiency = stpData.inlet.bod > 0
    ? Math.round(((stpData.inlet.bod - stpData.outlet.bod) / stpData.inlet.bod) * 100)
    : 0;
  const codRemovalEfficiency = stpData.inlet.cod > 0
    ? Math.round(((stpData.inlet.cod - stpData.outlet.cod) / stpData.inlet.cod) * 100)
    : 0;
  const tssRemovalEfficiency = stpData.inlet.tss > 0
    ? Math.round(((stpData.inlet.tss - stpData.outlet.tss) / stpData.inlet.tss) * 100)
    : 0;

  const trendData = [
    { day: 'Mon', bod: 18, cod: 85, tss: 22 },
    { day: 'Tue', bod: 16, cod: 82, tss: 20 },
    { day: 'Wed', bod: 20, cod: 90, tss: 25 },
    { day: 'Thu', bod: 15, cod: 78, tss: 18 },
    { day: 'Fri', bod: 17, cod: 88, tss: 21 },
    { day: 'Sat', bod: 19, cod: 86, tss: 23 },
    { day: 'Today', bod: stpData.outlet.bod, cod: stpData.outlet.cod, tss: stpData.outlet.tss },
  ];

  if (loading) return <DashboardLayout title="Loading..."><div className="flex h-64 items-center justify-center">Loading STP Data...</div></DashboardLayout>;

  return (
    <DashboardLayout
      title="STP Dashboard"
      subtitle={`${stpData.name} • Discharge: ${stpData.dischargeLocation}`}
      headerActions={
        stations.length > 1 && (
          <select
            className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={selectedStationId || ''}
            onChange={(e) => setSelectedStationId(e.target.value)}
          >
            {stations.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )
      }
    >
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KPICard
          title="Operating Capacity"
          value={`${stpData.capacity} MLD`}
          subtitle={`Installed: ${stpData.installedCapacity} MLD`}
          icon={<Factory className="h-5 w-5" />}
        />

        <KPICard
          title="Current Load"
          value={`${stpData.currentLoad} MLD`}
          subtitle={`${Math.round((stpData.currentLoad / stpData.capacity) * 100)}% utilized`}
          icon={<Droplets className="h-5 w-5" />}
          variant="accent"
        />
        <KPICard
          title="Compliance"
          value={`${stpData.compliancePercent}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          title="Faults"
          value={stpData.faultCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={stpData.faultCount > 0 ? 'warning' : 'success'}
        />
        <KPICard
          title="Energy Cost"
          value={`₹${stpData.energy.cost.toLocaleString()}`}
          subtitle={`${stpData.energy.consumption} kWh`}
          icon={<Zap className="h-5 w-5" />}
        />
        <KPICard
          title="Escalations"
          value={stpData.escalations}
          icon={<ShieldAlert className="h-5 w-5" />}
          variant={stpData.escalations > 0 ? 'warning' : 'success'}
        />
      </div>

      <Tabs defaultValue="quality">
        <TabsList>
          <TabsTrigger value="quality">Water Quality</TabsTrigger>
          <TabsTrigger value="process">Process Parameters</TabsTrigger>
          <TabsTrigger value="sludge">Sludge & Chemicals</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="quality" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Inlet Quality */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 flex items-center gap-2 font-semibold text-destructive">
                <Droplets className="h-5 w-5" />
                Inlet Quality
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>BOD</span>
                    <span className="font-bold">{stpData.inlet.bod} mg/L</span>
                  </div>
                  <Progress value={(stpData.inlet.bod / 250) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>COD</span>
                    <span className="font-bold">{stpData.inlet.cod} mg/L</span>
                  </div>
                  <Progress value={(stpData.inlet.cod / 500) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>TSS</span>
                    <span className="font-bold">{stpData.inlet.tss} mg/L</span>
                  </div>
                  <Progress value={(stpData.inlet.tss / 300) * 100} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>pH</span>
                  <span className="font-bold">{stpData.inlet.ph.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Treatment Efficiency */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 font-semibold">Treatment Efficiency</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <GaugeChart value={bodRemovalEfficiency} label="BOD" size="sm" variant="success" />
                </div>
                <div className="text-center">
                  <GaugeChart value={codRemovalEfficiency} label="COD" size="sm" variant="success" />
                </div>
                <div className="text-center">
                  <GaugeChart value={tssRemovalEfficiency} label="TSS" size="sm" variant="success" />
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Overall Removal Efficiency</p>
                <p className="text-3xl font-bold text-gradient-primary">
                  {Math.round((bodRemovalEfficiency + codRemovalEfficiency + tssRemovalEfficiency) / 3)}%
                </p>
              </div>
            </div>

            {/* Outlet Quality */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 className="h-5 w-5" />
                Outlet Quality
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>BOD (Limit: 30)</span>
                    <span className={`font-bold ${stpData.outlet.bod <= 30 ? 'text-success' : 'text-destructive'}`}>
                      {stpData.outlet.bod} mg/L
                    </span>
                  </div>
                  <Progress value={(stpData.outlet.bod / 30) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>COD (Limit: 100)</span>
                    <span className={`font-bold ${stpData.outlet.cod <= 100 ? 'text-success' : 'text-destructive'}`}>
                      {stpData.outlet.cod} mg/L
                    </span>
                  </div>
                  <Progress value={(stpData.outlet.cod / 100) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>TSS (Limit: 30)</span>
                    <span className={`font-bold ${stpData.outlet.tss <= 30 ? 'text-success' : 'text-destructive'}`}>
                      {stpData.outlet.tss} mg/L
                    </span>
                  </div>
                  <Progress value={(stpData.outlet.tss / 30) * 100} className="h-2" />
                </div>
                <div className="flex justify-between text-sm">
                  <span>pH</span>
                  <span className="font-bold">{stpData.outlet.ph.toFixed(1)}</span>
                </div>
                <div className="mt-4 text-center">
                  <StatusBadge status={stpData.outlet.compliance ? 'Compliant' : 'Non-Compliant'} />
                </div>
              </div>
            </div>
          </div>

          {/* Quality Trend */}
          <div className="mt-6 chart-container">
            <h4 className="mb-4 font-semibold">Outlet Quality Trend (Last 7 Days)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="bod" name="BOD" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                <Line type="monotone" dataKey="cod" name="COD" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                <Line type="monotone" dataKey="tss" name="TSS" stroke="hsl(var(--chart-3))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="process" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 font-semibold">Aeration</h4>
              <div className="text-center">
                <GaugeChart
                  value={Math.round((stpData.processParameters.aerationTime / 10) * 100)}
                  label="Aeration Time"
                  size="lg"
                />
                <p className="mt-2 text-2xl font-bold">{stpData.processParameters.aerationTime.toFixed(1)} hrs</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 font-semibold">Sludge Age</h4>
              <div className="text-center">
                <GaugeChart
                  value={Math.round((stpData.processParameters.sludgeAge / 25) * 100)}
                  label="Days"
                  size="lg"
                />
                <p className="mt-2 text-2xl font-bold">{stpData.processParameters.sludgeAge} days</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 font-semibold">MLSS</h4>
              <div className="text-center">
                <GaugeChart
                  value={Math.round((stpData.processParameters.mlss / 4000) * 100)}
                  label="mg/L"
                  size="lg"
                />
                <p className="mt-2 text-2xl font-bold">{stpData.processParameters.mlss} mg/L</p>
                <p className="text-sm text-muted-foreground">Target: 3000-4000 mg/L</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sludge" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sludge Management */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 flex items-center gap-2 font-semibold">
                <Trash2 className="h-5 w-5" />
                Sludge Management
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-2xl font-bold text-primary">{stpData.sludge.generated.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Generated (m³)</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-2xl font-bold text-success">{stpData.sludge.disposed.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Disposed (m³)</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-2xl font-bold text-warning">{stpData.sludge.pending.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Pending (m³)</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disposal Progress</span>
                    <span className="font-medium">
                      {Math.round((stpData.sludge.disposed / stpData.sludge.generated) * 100)}%
                    </span>
                  </div>
                  <Progress value={(stpData.sludge.disposed / stpData.sludge.generated) * 100} className="h-2" />
                </div>
              </div>
            </div>

            {/* Chemicals */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-4 flex items-center gap-2 font-semibold">
                <FlaskConical className="h-5 w-5" />
                Chemical Usage
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <GaugeChart
                    value={Math.round((stpData.chemicals.chlorine / 50) * 100)}
                    label="Chlorine"
                    size="md"
                  />
                  <p className="mt-2 text-xl font-bold">{stpData.chemicals.chlorine} kg</p>
                </div>
                <div className="text-center">
                  <GaugeChart
                    value={Math.round((stpData.chemicals.polymer / 20) * 100)}
                    label="Polymer"
                    size="md"
                  />
                  <p className="mt-2 text-xl font-bold">{stpData.chemicals.polymer} kg</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <ShieldAlert className={`mx-auto h-12 w-12 ${stpData.pollutionRisk === 'Low' ? 'text-success' : stpData.pollutionRisk === 'Medium' ? 'text-warning' : 'text-destructive'}`} />
              <h4 className="mt-4 font-semibold">Pollution Risk</h4>
              <div className="mt-2">
                <StatusBadge status={stpData.pollutionRisk} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Current discharge quality is within permissible limits
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <AlertTriangle className={`mx-auto h-12 w-12 ${stpData.legalRisk === 'Low' ? 'text-success' : stpData.legalRisk === 'Medium' ? 'text-warning' : 'text-destructive'}`} />
              <h4 className="mt-4 font-semibold">Legal Risk</h4>
              <div className="mt-2">
                <StatusBadge status={stpData.legalRisk} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                All regulatory compliances are met
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 text-center">
              <Factory className={`mx-auto h-12 w-12 ${stpData.environmentalRisk === 'Low' ? 'text-success' : stpData.environmentalRisk === 'Medium' ? 'text-warning' : 'text-destructive'}`} />
              <h4 className="mt-4 font-semibold">Environmental Risk</h4>
              <div className="mt-2">
                <StatusBadge status={stpData.environmentalRisk} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Discharge to {stpData.dischargeLocation} is safe
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
