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
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';
const COLORS = ['#f59e0b', '#003380', '#0ea5e9', '#e11d48', '#22c55e', '#8b5cf6', '#f97316', '#06b6d4'];

const addColors = (arr) => (arr || []).map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }));

export function HealthSurvey() {
  const [data, setData] = useState({
    bplAplData: [],
    genderData: [],
    casteData: [],
    insuranceData: [],
    incomeData: [],
    sanitationData: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/c3VydmV5cy9oZWFsdGgtc3RhdHM=`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData({
          bplAplData: addColors(res.data.bplAplData),
          genderData: addColors(res.data.genderData),
          casteData: addColors(res.data.casteData),
          insuranceData: addColors(res.data.insuranceData),
          incomeData: addColors(res.data.incomeData),
          sanitationData: addColors(res.data.sanitationData)
        });
      } catch (err) {
        console.error('Failed to fetch health stats:', err);
      }
    };
    fetchStats();
  }, []);

  const { bplAplData, genderData, casteData, insuranceData, incomeData, sanitationData } = data;
  const maxIncomeValue = Math.max(...incomeData.map(d => d.value), 1);


  return (
    <div className="space-y-6">
      
      {/* Top Row: BPL/APL & Gender */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* BPL vs APL */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
          <h3 className="mb-6 w-full text-center text-lg font-bold text-slate-700">BPL vs APL Distribution</h3>
          <div className="w-full max-w-[250px] aspect-square relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bplAplData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="90%"
                  paddingAngle={1}
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
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
                        <tspan x={x} dy="-0.5em">{name}</tspan>
                        <tspan x={x} dy="1.2em">{`${value}%`}</tspan>
                      </text>
                    );
                  }}
                  labelLine={false}
                  stroke="white"
                  strokeWidth={2}
                >
                  {bplAplData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
          <h3 className="mb-6 w-full text-center text-lg font-bold text-slate-700">Gender Distribution</h3>
          <div className="w-full max-w-[250px] aspect-square relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="90%"
                  paddingAngle={1}
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
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
                        <tspan x={x} dy="-0.5em">{name}</tspan>
                        <tspan x={x} dy="1.2em">{`${value}%`}</tspan>
                      </text>
                    );
                  }}
                  labelLine={false}
                  stroke="white"
                  strokeWidth={2}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Row: Caste & Insurance */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Caste Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-center text-lg font-bold text-slate-700">Caste Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={casteData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18]}
              />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={15}>
                {casteData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insurance Coverage */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center">
          <h3 className="mb-6 w-full text-center text-lg font-bold text-slate-700">Insurance Coverage</h3>
          <div className="w-full max-w-[250px] aspect-square relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insuranceData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="90%"
                  paddingAngle={1}
                  dataKey="value"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
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
                        className="text-[10px] font-bold"
                      >
                        <tspan x={x} dy="-0.5em">{name}</tspan>
                        <tspan x={x} dy="1.2em">{`${value}%`}</tspan>
                      </text>
                    );
                  }}
                  labelLine={false}
                  stroke="white"
                  strokeWidth={2}
                >
                  {insuranceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Income & Sanitation */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Income Group Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-center text-lg font-bold text-slate-700">Income Group Distribution</h3>
          <div className="space-y-5 px-4">
            {incomeData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.name}</span>
                  <span className="text-primary">{item.value}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.value / maxIncomeValue) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sanitation Status */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-6 text-center text-lg font-bold text-slate-700">Sanitation Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sanitationData} margin={{ top: 20, right: 30, left: -20, bottom: 40 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#64748b' }}
                angle={-30}
                textAnchor="end"
                interval={0}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]}
              />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={12}>
                {sanitationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
