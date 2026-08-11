import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

export function SurveyIndicators() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');

  const [metrics, setMetrics] = useState({
    families: 0,
    population: 0,
    male: 0,
    female: 0,
    eligibleCouples: 0,
    pregnantWomen: 0,
    childrenUnder5: 0,
    seniorCitizens: 0,
    employed: 0,
    chronicDisease: 0,
    vaccinated: 0,
    disability: 0,
  });

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/c3VydmV5cy9oZWFsdGgtc3RhdHM=`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data) {
          setMetrics({
            families: res.data.totalFamilies || 0,
            population: res.data.totalPopulation || 0,
            male: res.data.male || 0,
            female: res.data.female || 0,
            eligibleCouples: res.data.eligibleCouples || 0,
            pregnantWomen: res.data.pregnantWomen || 0,
            childrenUnder5: res.data.childrenUnder5 || 0,
            seniorCitizens: res.data.seniorCitizens || 0,
            employed: res.data.employed || 0,
            chronicDisease: res.data.chronicDisease || 0,
            vaccinated: res.data.vaccinated || 0,
            disability: res.data.disability || 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch survey indicators:', err);
      }
    };

    fetchIndicators();
  }, []);

  const safePop = Math.max(1, metrics.population);
  
  const indicators = [
    {
      title: 'Employed Status',
      percent: `${((metrics.employed / safePop) * 100).toFixed(1)}%`,
      color: 'bg-blue-600',
      items: [
        { label: 'Employed', count: metrics.employed, dot: 'bg-blue-800' },
        { label: 'Unemployed/Student/Others', count: Math.max(0, metrics.population - metrics.employed), dot: 'bg-slate-400' },
      ],
    },
    {
      title: 'Chronic Disease',
      percent: `${((metrics.chronicDisease / safePop) * 100).toFixed(1)}%`,
      color: 'bg-rose-500',
      items: [
        { label: 'Affected', count: metrics.chronicDisease, dot: 'bg-rose-600' },
        { label: 'Not Affected', count: Math.max(0, metrics.population - metrics.chronicDisease), dot: 'bg-slate-400' },
      ],
    },
    {
      title: 'Vaccination (Complete)',
      percent: `${((metrics.vaccinated / safePop) * 100).toFixed(1)}%`,
      color: 'bg-blue-600',
      items: [
        { label: 'Vaccinated', count: metrics.vaccinated, dot: 'bg-blue-700' },
        { label: 'Others', count: Math.max(0, metrics.population - metrics.vaccinated), dot: 'bg-slate-400' },
      ],
    },
    {
      title: 'Disability',
      percent: `${((metrics.disability / safePop) * 100).toFixed(1)}%`,
      color: 'bg-amber-500',
      items: [
        { label: 'With Disability', count: metrics.disability, dot: 'bg-amber-500' },
        { label: 'None', count: Math.max(0, metrics.population - metrics.disability), dot: 'bg-slate-400' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Survey Indicators <span className="font-normal text-slate-600">/ ஆய்வு குறியீடுகள்</span>
        </h1>
        <p className="text-sm text-slate-500">
          Auto-calculated from all survey records · குறியீட்டு புள்ளிவிவரங்கள்
        </p>
      </div>

      {/* Time & Ward Filter Bar Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        {/* Ward Filter */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Ward / வார்டு</label>
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="h-11 w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Wards / அனைத்தும்</option>
            {Array.from({ length: 42 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Ward {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          <span>Data synced in real-time</span>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Families */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            🏡
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{metrics.families}</span>
            <p className="text-xs font-semibold text-slate-700">Families / குடும்பங்கள்</p>
            <p className="text-[11px] text-slate-400">Total surveyed</p>
          </div>
        </div>

        {/* Total Population */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            👥
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{metrics.population}</span>
            <p className="text-xs font-semibold text-slate-700">Total Population</p>
            <p className="text-[11px] text-slate-400">மொத்த மக்கள் தொகை</p>
          </div>
        </div>

        {/* Male */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
            👦
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{metrics.male}</span>
            <p className="text-xs font-semibold text-slate-700">Male / ஆண்</p>
            <p className="text-[11px] text-slate-400">மொத்த மக்கள் தொகை</p>
          </div>
        </div>

        {/* Female */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-2xl">
            👧
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{metrics.female}</span>
            <p className="text-xs font-semibold text-slate-700">Female / பெண்</p>
            <p className="text-[11px] text-slate-400">மொத்த மக்கள் தொகை</p>
          </div>
        </div>

        {/* Eligible Couples */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-2xl">
            👩‍❤️‍👨
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{metrics.eligibleCouples}</span>
            <p className="text-xs font-semibold text-slate-700">Eligible Couples</p>
            <p className="text-[11px] text-slate-400">தகுதி வாய்ந்த தம்பதியர்</p>
          </div>
        </div>

        {/* Pregnant Women */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
            🤰
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{metrics.pregnantWomen}</span>
            <p className="text-xs font-semibold text-slate-700">Pregnant Women</p>
            <p className="text-[11px] text-slate-400">கர்ப்பிணி பெண்கள்</p>
          </div>
        </div>

        {/* Children < 5 yrs */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            👶
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{metrics.childrenUnder5}</span>
            <p className="text-xs font-semibold text-slate-700">Children &lt; 5 yrs</p>
            <p className="text-[11px] text-slate-400">குழந்தைகள்</p>
          </div>
        </div>

        {/* Senior Citizens 60+ */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
            👴
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">{metrics.seniorCitizens}</span>
            <p className="text-xs font-semibold text-slate-700">Senior Citizens 60+</p>
            <p className="text-[11px] text-slate-400">மூத்தோர்</p>
          </div>
        </div>
      </div>

      {/* Progress Indicator Cards */}
      <div className="space-y-4">
        {indicators.map((ind, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{ind.title}</h3>
              <span className="text-lg font-bold text-blue-900">{ind.percent}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
              <div
                className={`h-full ${ind.color} transition-all duration-500`}
                style={{ width: ind.percent }}
              />
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 text-xs font-medium text-slate-600">
              {ind.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                  <span>{item.label}: <strong className="text-slate-900">{item.count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
