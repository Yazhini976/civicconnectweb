import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { GaugeChart } from '@/components/dashboard/GaugeChart';
import { DataTable } from '@/components/dashboard/DataTable';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';
import { getAllStations, getEquipmentByStation, getFaultsByStation } from '@/services/api';
import {
  Wrench,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Battery,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['hsl(150, 60%, 45%)', 'hsl(38, 95%, 55%)', 'hsl(0, 75%, 55%)'];

interface AssetRow {
  id: string;
  name: string;
  type: string;
  stationName: string;
  status: string;
  details: string;
}

export default function Assets() {
  const [stations, setStations] = useState<any[]>([]);
  const [allEquipment, setAllEquipment] = useState<AssetRow[]>([]);
  const [faultCounts, setFaultCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stationList = await getAllStations();
        setStations(stationList || []);

        // Fetch equipment for all stations
        const eqPromises = (stationList || []).map(async (s: any) => {
          try {
            const eq = await getEquipmentByStation(s.id);
            return (eq || []).map((e: any) => ({
              id: `${s.id}-${e.id}`,
              name: e.name || `Equipment #${e.id}`,
              type: e.type || 'Unknown',
              stationName: s.name,
              status: 'Running', // Default status since equipment table doesn't track runtime status
              details: e.details || '-',
            }));
          } catch {
            return [];
          }
        });

        const eqResults = await Promise.all(eqPromises);
        setAllEquipment(eqResults.flat());

        // Fetch fault counts per station
        const faultMap: Record<number, number> = {};
        await Promise.all(
          (stationList || []).map(async (s: any) => {
            try {
              const faults = await getFaultsByStation(s.id);
              faultMap[s.id] = (faults || []).length;
            } catch {
              faultMap[s.id] = 0;
            }
          })
        );
        setFaultCounts(faultMap);
      } catch (err) {
        console.error('Failed to fetch assets data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalAssets = allEquipment.length;
  const totalStations = stations.length;
  const totalFaults = Object.values(faultCounts).reduce((s, v) => s + v, 0);

  // Derive status distribution from equipment
  const faultyCount = totalFaults;
  const runningCount = totalAssets > 0 ? totalAssets - faultyCount : 0;

  const statusDistribution = [
    { name: 'Running/Standby', value: Math.max(runningCount, 0) },
    { name: 'Faults', value: faultyCount },
  ];

  // Energy by station type
  const energyByType = useMemo(() => {
    const typeMap: Record<string, number> = {};
    stations.forEach(s => {
      const t = s.type || 'Unknown';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    return Object.entries(typeMap).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      stations: count,
      equipmentCount: allEquipment.filter(e =>
        stations.find(s => s.name === e.stationName && s.type === type)
      ).length,
    }));
  }, [stations, allEquipment]);

  const assetColumns = [
    { key: 'id', header: 'Asset ID', render: (a: AssetRow) => <span className="font-mono text-xs">{a.id}</span> },
    { key: 'name', header: 'Equipment Name' },
    { key: 'type', header: 'Type' },
    { key: 'stationName', header: 'Station' },
    { key: 'status', header: 'Status', render: (a: AssetRow) => <StatusBadge status={a.status} /> },
    { key: 'details', header: 'Details' },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Assets & Energy" subtitle="Loading...">
        <div className="flex h-64 items-center justify-center">Loading asset data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Assets & Energy" subtitle="Asset health monitoring and energy consumption">
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total Stations"
          value={totalStations}
          icon={<Wrench className="h-5 w-5" />}
        />
        <KPICard
          title="Total Equipment"
          value={totalAssets}
          icon={<Settings className="h-5 w-5" />}
        />
        <KPICard
          title="Active Faults"
          value={totalFaults}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={totalFaults > 0 ? 'danger' : 'success'}
        />
        <KPICard
          title="Stations w/ Faults"
          value={Object.values(faultCounts).filter(v => v > 0).length}
          icon={<Zap className="h-5 w-5" />}
          variant="warning"
        />
        <KPICard
          title="Equipment Health"
          value={totalAssets > 0 ? `${Math.round(((totalAssets - totalFaults) / totalAssets) * 100)}%` : '100%'}
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Asset Status Distribution */}
        <div className="chart-container">
          <h4 className="mb-4 font-semibold">Asset Status Distribution</h4>
          <StandardPieChart
            data={statusDistribution}
            dataKey="value"
            nameKey="name"
            tooltipFormatter={(value: number) => `${value} Assets`}
          />
        </div>

        {/* Equipment by Station Type */}
        <div className="chart-container">
          <h4 className="mb-4 font-semibold">Equipment by Station Type</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={energyByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="stations" name="Stations" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="equipmentCount" name="Equipment" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Station Health Cards */}
      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        {stations.slice(0, 8).map((station: any) => (
          <div key={station.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-sm truncate">{station.name}</h5>
              <StatusBadge status={faultCounts[station.id] > 0 ? 'Fault' : 'Healthy'} />
            </div>
            <div className="flex justify-center">
              <GaugeChart
                value={0}
                label="Health"
                size="sm"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <p className="font-bold">{faultCounts[station.id] || 0}</p>
                <p className="text-muted-foreground">Faults</p>
              </div>
              <div>
                <p className="font-bold">{station.type}</p>
                <p className="text-muted-foreground">Type</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Table */}
      <div>
        <h4 className="mb-4 font-semibold">All Equipment</h4>
        <DataTable data={allEquipment} columns={assetColumns} maxHeight="400px" />
      </div>
    </DashboardLayout>
  );
}
