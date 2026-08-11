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

import React, { useState, useEffect } from 'react';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';
const COLORS = ['#f59e0b', '#1d4ed8', '#e11d48', '#2563eb', '#8b5cf6', '#22c55e', '#f97316', '#06b6d4', '#475569'];

const DISPOSAL_CATEGORIES = [
  "Municipal collection",
  "Private collector",
  "Community bin",
  "Dumping in open areas",
  "Burning",
  "Composting",
  "Recycling/Scrap dealer",
  "Other"
];

const TYPE_CATEGORIES = [
  "Sanitary Waste",
  "Textile",
  "Metal",
  "Paper/Cardboard",
  "E-Waste",
  "Glass",
  "Garden Waste",
  "Food/Biodegradable",
  "Plastic"
];

const SEGREGATION_CATEGORIES = [
  "Always",
  "Sometimes",
  "Never"
];

const fillAndAddColors = (fetchedData, categories) => {
  const dataMap = new Map((fetchedData || []).map(d => [d.name, d.value]));
  return categories.map((cat, i) => ({
    name: cat,
    value: dataMap.get(cat) || 0,
    color: COLORS[i % COLORS.length]
  }));
};

export function SolidWasteSurvey() {
  const [data, setData] = useState({
    wasteDisposalData: [],
    wasteSegregationData: [],
    wasteTypesData: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/c3VydmV5cy93YXN0ZS1zdGF0cw==`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resData = await res.json();
        setData({
          wasteDisposalData: fillAndAddColors(resData.wasteDisposalData, DISPOSAL_CATEGORIES),
          wasteSegregationData: fillAndAddColors(resData.wasteSegregationData, SEGREGATION_CATEGORIES),
          wasteTypesData: fillAndAddColors(resData.wasteTypesData, TYPE_CATEGORIES)
        });
      } catch (err) {
        console.error('Failed to fetch waste stats:', err);
      }
    };
    fetchStats();
  }, []);

  const { wasteDisposalData, wasteSegregationData, wasteTypesData } = data;
  const maxDisposalValue = Math.max(...wasteDisposalData.map(d => d.value), 1);


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
