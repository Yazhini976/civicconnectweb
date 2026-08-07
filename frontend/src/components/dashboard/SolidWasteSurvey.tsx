import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const wasteDisposalData = [
  { name: 'Municipal collection', value: 15, color: '#f59e0b' },
  { name: 'Private collector', value: 2, color: '#1d4ed8' },
  { name: 'Community bin', value: 13, color: '#e11d48' },
  { name: 'Dumping in open areas', value: 6, color: '#2563eb' },
  { name: 'Burning', value: 8, color: '#8b5cf6' },
  { name: 'Composting', value: 4, color: '#22c55e' },
  { name: 'Recycling/Scrap dealer', value: 2, color: '#f97316' },
  { name: 'Other', value: 1, color: '#06b6d4' }
];

const maxDisposalValue = Math.max(...wasteDisposalData.map(d => d.value));

const wasteSegregationData = [
  { name: 'Sometimes', value: 16, color: '#f59e0b' },
  { name: 'Never', value: 16, color: '#003380' },
  { name: 'Always', value: 14, color: '#e11d48' }
];

const wasteTypesData = [
  { name: 'Sanitary Waste', value: 0, color: '#cbd5e1' }, // Dummy to keep spacing
  { name: 'Textile', value: 11, color: '#003380' },
  { name: 'Metal', value: 10, color: '#e11d48' },
  { name: 'Paper/Cardboard', value: 10, color: '#003380' },
  { name: 'E-Waste', value: 0, color: '#cbd5e1' }, // Dummy
  { name: 'Glass', value: 10, color: '#22c55e' },
  { name: 'Garden Waste', value: 0, color: '#cbd5e1' }, // Dummy
  { name: 'Food/Biodegradable', value: 8, color: '#06b6d4' },
  { name: 'Plastic', value: 7, color: '#f59e0b' }
];

export function SolidWasteSurvey() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Waste Disposal Analysis - Ward-wise */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold">Waste Disposal Analysis - Ward-wise</h3>
          <div className="space-y-4">
            {wasteDisposalData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>{item.name}</span>
                  <span className="text-primary">{item.value} families</span>
                </div>
                <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.value / maxDisposalValue) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Waste Segregation Status */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
          <h3 className="mb-6 w-full text-left text-lg font-bold">Waste Segregation Status</h3>
          <div className="w-full max-w-[300px] aspect-square relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteSegregationData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="90%"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-xs font-bold"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={false}
                  stroke="none"
                >
                  {wasteSegregationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            {wasteSegregationData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-medium text-muted-foreground">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waste Types Analysis - Ward-wise */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold">Waste Types Analysis - Ward-wise</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={wasteTypesData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18]}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {wasteTypesData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
