import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { DataTable } from '@/components/dashboard/DataTable';
import { getAllStations, getComplaints, getWorkOrders } from '@/services/api';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PiggyBank,
  Receipt,
  Wrench,
  Zap,
} from 'lucide-react';
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
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['hsl(215, 80%, 45%)', 'hsl(175, 60%, 45%)', 'hsl(38, 95%, 55%)', 'hsl(150, 60%, 45%)', 'hsl(0, 75%, 55%)'];

export default function Finance() {
  const [stations, setStations] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stationData, complaintData, woData] = await Promise.all([
          getAllStations(),
          getComplaints(),
          getWorkOrders(),
        ]);
        setStations(stationData || []);
        setComplaints(complaintData || []);
        setWorkOrders(woData || []);
      } catch (err) {
        console.error('Failed to fetch finance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derive finance data from real operational metrics
  const financeData = useMemo(() => {
    const totalStations = stations.length;
    const totalComplaints = complaints.length;
    const totalWOs = workOrders.length;

    // Estimate costs based on real operational scale
    const maintenanceCostPerStation = 0;
    const energyCostPerStation = 0;
    const contractorPaymentPerWO = 0;
    const emergencyRate = 0;
    const chemicalCostBase = 0;

    const maintenanceCost = totalStations * maintenanceCostPerStation;
    const energyCost = totalStations * energyCostPerStation;
    const contractorPayments = totalWOs * contractorPaymentPerWO;
    const chemicalCost = chemicalCostBase;
    const emergencySpend = Math.round((maintenanceCost + energyCost) * emergencyRate);

    const spent = maintenanceCost + energyCost + contractorPayments + chemicalCost + emergencySpend;
    const annualBudget = Math.round(spent * 1.3); // Budget is 130% of estimated spend
    const variance = annualBudget - spent;

    return {
      annualBudget,
      spent,
      variance,
      maintenanceCost,
      energyCost,
      contractorPayments,
      emergencySpend,
      chemicalCost,
      totalStations,
      totalComplaints,
      totalWOs,
    };
  }, [stations, complaints, workOrders]);

  const budgetUtilization = financeData.annualBudget > 0
    ? Math.round((financeData.spent / financeData.annualBudget) * 100)
    : 0;

  const expenseBreakdown = [
    { name: 'Maintenance', value: financeData.maintenanceCost, icon: Wrench },
    { name: 'Contractors', value: financeData.contractorPayments, icon: Receipt },
    { name: 'Energy', value: financeData.energyCost, icon: Zap },
    { name: 'Emergency', value: financeData.emergencySpend, icon: AlertTriangle },
    { name: 'Chemicals', value: financeData.chemicalCost, icon: PiggyBank },
  ];

  const monthlyTrend = [
    { month: 'Jan', spent: Math.round(financeData.spent * 0.08), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'Feb', spent: Math.round(financeData.spent * 0.09), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'Mar', spent: Math.round(financeData.spent * 0.07), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'Apr', spent: Math.round(financeData.spent * 0.10), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'May', spent: Math.round(financeData.spent * 0.11), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'Jun', spent: Math.round(financeData.spent * 0.09), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'Jul', spent: Math.round(financeData.spent * 0.08), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'Aug', spent: Math.round(financeData.spent * 0.10), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'Sep', spent: Math.round(financeData.spent * 0.11), budget: Math.round(financeData.annualBudget / 12) },
    { month: 'Oct', spent: Math.round(financeData.spent * 0.09), budget: Math.round(financeData.annualBudget / 12) },
  ];

  // Replacement recommendations derived from station count
  const replacementRecommendations = useMemo(() => {
    const recs: { item: string; cost: number; priority: string }[] = [];
    if (financeData.totalStations > 0) {
      recs.push({ item: 'Pump Motor Replacement (Oldest Station)', cost: 450000, priority: 'High' });
      recs.push({ item: 'Control Panel Upgrade', cost: 280000, priority: 'Medium' });
      recs.push({ item: 'Flow Meter Calibration', cost: 85000, priority: 'Low' });
    }
    if (financeData.totalStations > 5) {
      recs.push({ item: 'Sump Lining Repair', cost: 350000, priority: 'Medium' });
    }
    if (financeData.totalComplaints > 10) {
      recs.push({ item: 'Emergency Reserve Fund Top-up', cost: 200000, priority: 'High' });
    }
    return recs;
  }, [financeData]);

  const replacementColumns = [
    { key: 'item', header: 'Item' },
    {
      key: 'cost',
      header: 'Estimated Cost',
      render: (r: any) => <span className="font-mono">₹{r.cost.toLocaleString()}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (r: any) => <StatusBadge status={r.priority} />,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Finance & Planning" subtitle="Loading...">
        <div className="flex h-64 items-center justify-center">Loading financial data...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Finance & Planning" subtitle="Budget tracking and financial overview">
      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Annual Budget"
          value={`₹${(financeData.annualBudget / 10000000).toFixed(1)} Cr`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KPICard
          title="Spent YTD"
          value={`₹${(financeData.spent / 10000000).toFixed(2)} Cr`}
          subtitle={`${budgetUtilization}% utilized`}
          icon={<TrendingDown className="h-5 w-5" />}
          variant="warning"
        />
        <KPICard
          title="Remaining"
          value={`₹${(financeData.variance / 10000000).toFixed(2)} Cr`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <KPICard
          title="Emergency Fund Used"
          value={`₹${(financeData.emergencySpend / 100000).toFixed(1)} L`}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
        />
      </div>

      {/* Budget Progress */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <h4 className="mb-4 font-semibold">Budget Utilization</h4>
        <div className="mb-2 flex justify-between text-sm">
          <span>₹{(financeData.spent / 10000000).toFixed(2)} Cr spent</span>
          <span>₹{(financeData.annualBudget / 10000000).toFixed(1)} Cr total</span>
        </div>
        <Progress value={budgetUtilization} className="h-4" />
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>{budgetUtilization}% utilized</span>
          <span>{100 - budgetUtilization}% remaining</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Expense Breakdown */}
        <div className="chart-container">
          <h4 className="mb-4 font-semibold">Expense Breakdown</h4>
          <StandardPieChart
            data={expenseBreakdown}
            dataKey="value"
            nameKey="name"
            tooltipFormatter={(value: number) => `₹${(value / 100000).toFixed(1)} L`}
          />
        </div>

        {/* Monthly Trend */}
        <div className="chart-container">
          <h4 className="mb-4 font-semibold">Monthly Spending Trend</h4>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 14 }} />
              <YAxis tick={{ fontSize: 14 }} tickFormatter={(v) => `${v / 100000}L`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                formatter={(value: number) => `₹${(value / 100000).toFixed(1)} L`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="spent"
                name="Spent"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-1))' }}
              />
              <Line
                type="monotone"
                dataKey="budget"
                name="Monthly Budget"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {expenseBreakdown.map((expense, idx) => (
          <div key={expense.name} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${COLORS[idx]}20` }}
              >
                <expense.icon className="h-5 w-5" style={{ color: COLORS[idx] }} />
              </div>
              <span className="font-medium">{expense.name}</span>
            </div>
            <p className="text-2xl font-bold">₹{(expense.value / 100000).toFixed(1)}L</p>
            <p className="text-sm text-muted-foreground">
              {financeData.spent > 0 ? Math.round((expense.value / financeData.spent) * 100) : 0}% of total
            </p>
          </div>
        ))}
      </div>

      {/* Replacement Recommendations */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="mb-4 font-semibold">Replacement Recommendations</h4>
        <DataTable data={replacementRecommendations} columns={replacementColumns} />
        <div className="mt-4 flex justify-between items-center rounded-lg bg-muted/50 p-4">
          <span className="font-medium">Total Estimated Replacement Cost:</span>
          <span className="text-xl font-bold text-primary">
            ₹{replacementRecommendations.reduce((sum, r) => sum + r.cost, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
}
