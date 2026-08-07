import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ComplaintListModal } from '@/components/ComplaintListModal';
import { SolidWasteSurvey } from '@/components/dashboard/SolidWasteSurvey';
import { HealthSurvey } from '@/components/dashboard/HealthSurvey';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { getComplaints as fetchAllComplaints, getOfficerStats, getComplaintStats, createComplaint } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select';

import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Ban,
  Zap,
  Image,
  Mic,
  Star,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* --------- Types matching backend JSON --------- */
interface DBComplaint {
  id: number;
  citizen_user_id: number | null;
  citizen_name: string | null;
  citizen_role: string | null;
  ward_number: string | null;
  street_name: string | null;
  door_number: string | null;
  landmark: string | null;
  category: string | null;
  type: string | null;
  area_type: string | null;
  photo_url: string | null;
  audio_url: string | null;
  status: string;
  assigned_to: number | null;
  created_at: string;
  expected_resolution_at: string | null;
  resolved_at: string | null;
}

/* --------- Derived UI Complaint --------- */
interface UIComplaint extends DBComplaint {
  fullName: string;
  wardNumber: string;
  slaBreached: boolean;
  slaRemaining: number;
  hasPhoto: boolean;
  hasAudio: boolean;
  financialHold: boolean;
  repeatComplaint: boolean;
  escalationLevel: string | null;
  serviceRating: number | null;
}

function deriveUIComplaint(c: DBComplaint): UIComplaint {
  const now = new Date();
  const created = new Date(c.created_at);
  const expectedResolution = c.expected_resolution_at ? new Date(c.expected_resolution_at) : null;

  let slaRemaining = 24; // default hours
  let slaBreached = false;

  if (expectedResolution) {
    const hoursLeft = (expectedResolution.getTime() - now.getTime()) / (1000 * 60 * 60);
    slaRemaining = Math.round(hoursLeft);
    slaBreached = hoursLeft < 0 && c.status !== 'Resolved';
  }

  return {
    ...c,
    fullName: c.citizen_name || 'Anonymous',
    wardNumber: c.ward_number || '-',
    slaBreached,
    slaRemaining,
    hasPhoto: !!c.photo_url,
    hasAudio: !!c.audio_url,
    financialHold: false,           // Not tracked in DB yet
    repeatComplaint: false,         // Not tracked in DB yet
    escalationLevel: null,          // Not tracked in DB yet
    serviceRating: null,            // Needs feedback table join
  };
}

export default function Citizen() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const subcategoryParam = searchParams.get('sub');

  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem('selectedDate') || new Date().toISOString().split('T')[0]
  );
  
  const [officers, setOfficers] = useState<{id: string, name: string}[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('all');

  const userRole = useMemo(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr && userStr.startsWith("{")) {
        return JSON.parse(userStr).role;
      }
    } catch (e) { }
    return '';
  }, []);

  // Sync with Header calendar
  useEffect(() => {
    const handleStorage = () => {
      const date = localStorage.getItem('selectedDate');
      if (date) setSelectedDate(date);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Fetch dynamic officers based on logged-in role
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          const res = await fetch(`${API_BASE_URL}/officers?role=${parsed.role}`);
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data)) {
              setOfficers(data);
            }
          }
        } else {
          const res = await fetch(`${API_BASE_URL}/officers?role=citizen`);
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data)) {
              setOfficers(data);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic officers", err);
      }
    };
    fetchOfficers();
  }, []);

  const [rawComplaints, setRawComplaints] = useState<DBComplaint[]>([]);
  const [officerStats, setOfficerStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTimeStatsObj, setAllTimeStatsObj] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState('all');
  
  /* =======================
     MODAL STATE
     ======================= */
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTimeRange, setModalTimeRange] = useState<'all-time'|'today'>('all-time');
  const [modalStatus, setModalStatus] = useState<'all' | 'Resolved' | 'In Progress' | 'Submitted'>('all');

  const openListModal = (title: string, timeRange: 'all-time'|'today', status: 'all' | 'Resolved' | 'In Progress' | 'Submitted') => {
    setModalTitle(title);
    setModalTimeRange(timeRange);
    setModalStatus(status);
    setIsListModalOpen(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    user_phone: '1234567890',
    module_id: 1,
    location: '',
    reason: '',
    description: ''
  });

  const handleCreateComplaint = async () => {
    try {
      await createComplaint(newComplaint);
      setIsModalOpen(false);
      // Reload complaints
      setLoading(true);
      const [complaintsData, statsData, allTimeStats] = await Promise.all([
        fetchAllComplaints(selectedDate),
        getOfficerStats(),
        getComplaintStats()
      ]);
      setRawComplaints(complaintsData || []);
      setOfficerStats(statsData || []);
      setAllTimeStatsObj(allTimeStats || {});
      setNewComplaint({ user_phone: '1234567890', module_id: 1, location: '', reason: '', description: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to create complaint');
    } finally {
      setLoading(false);
    }
  };

  const OFFICER_WARDS: Record<string, string[]> = {
    'fieldofficer1': Array.from({ length: 10 }, (_, i) => String(i + 1)),
    'fieldofficer2': Array.from({ length: 10 }, (_, i) => String(i + 11)),
    'fieldofficer3': Array.from({ length: 10 }, (_, i) => String(i + 21)),
    'fieldofficer4': Array.from({ length: 12 }, (_, i) => String(i + 31)),
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [complaintsData, statsData, allTimeStats] = await Promise.all([
          fetchAllComplaints(selectedDate),
          getOfficerStats(),
          getComplaintStats()
        ]);
        setRawComplaints(complaintsData || []);
        setOfficerStats(statsData || []);
        setAllTimeStatsObj(allTimeStats || {});
      } catch (err) {
        console.error('Error fetching complaints/stats:', err);
        setRawComplaints([]);
        setOfficerStats([]);
        setAllTimeStatsObj({});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedDate]);

  /* ✅ Derive UI complaints from DB complaints */
  const complaints = useMemo(() => {
    let list = rawComplaints.map(deriveUIComplaint);
    
    // Filter complaints to valid wards
    list = list.filter(c => {
      const match = (c.ward_number || '').match(/\d+/);
      const wNum = match ? parseInt(match[0], 10) : NaN;
      return !isNaN(wNum) && wNum >= 1 && wNum <= 200;
    });

    if (categoryParam) {
      list = list.filter(c => c.category === categoryParam);
    }
    if (subcategoryParam) {
      list = list.filter(c =>
        (c.type || '').toLowerCase() === subcategoryParam.toLowerCase()
      );
    }
    return list;
  }, [rawComplaints, categoryParam, subcategoryParam]);

  /* ---- Officer Filtered Complaints ---- */
  const officerFilteredComplaints = useMemo(() => {
    if (selectedOfficer === 'all') return complaints;
    return complaints.filter(c => String(c.assigned_to) === String(selectedOfficer));
  }, [complaints, selectedOfficer]);

  /* ---- Charts ---- */
  const complaintsByWard = useMemo(() => {
    const map: Record<string, number> = {};

    officerFilteredComplaints.forEach(c => {
      const wardStr = c.ward_number || '';
      const match = wardStr.match(/\d+/);
      const normalizedWard = match ? match[0] : '0';
      map[normalizedWard] = (map[normalizedWard] || 0) + 1;
    });

    return Object.entries(map)
      .map(([ward, count]) => ({ ward: `Ward ${ward}`, count }))
      .sort((a, b) => {
        const matchA = a.ward.match(/\d+/);
        const matchB = b.ward.match(/\d+/);
        const wardA = matchA ? parseInt(matchA[0], 10) : 0;
        const wardB = matchB ? parseInt(matchB[0], 10) : 0;
        return wardA - wardB;
      });
  }, [officerFilteredComplaints]);

  const complaintsByType = useMemo(() => {
    const map: Record<string, number> = {};

    officerFilteredComplaints.forEach(c => {
      const t = c.type || 'Other';
      map[t] = (map[t] || 0) + 1;
    });

    const sorted = Object.entries(map)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    if (sorted.length <= 5) return sorted;

    const top5 = sorted.slice(0, 5);
    const othersCount = sorted.slice(5).reduce((sum, item) => sum + item.count, 0);

    return [
      ...top5,
      { type: 'Others', count: othersCount }
    ];
  }, [officerFilteredComplaints]);

  const topPerformers = useMemo(() => {
    const prefixMap: Record<string, string> = {
      'Water Utility': 'WU',
      'UGSS': 'UGSS',
      'Street Lighting': 'SL',
      'Solid Waste': 'SW',
    };

    const targetPrefix = categoryParam ? prefixMap[categoryParam] : null;

    let list = officerStats.map(o => {
      const totalAssigned = o.total_assigned || 0;
      const resolvedCount = o.resolved || 0;
      const score = totalAssigned > 0 ? Math.round((resolvedCount / totalAssigned) * 100) : 100;
      
      return { 
        ...o, 
        totalAssigned, 
        resolved: resolvedCount, 
        score 
      };
    });

    if (targetPrefix) {
      list = list.filter(o => o.name.startsWith(targetPrefix));
    }

    return list.sort((a, b) => b.score - a.score || b.resolved - a.resolved);
  }, [officerStats, categoryParam]);

  /* ---- Tab Filter ---- */
  const filteredComplaints = useMemo(() => {
    let data = [...officerFilteredComplaints];
    if (activeTab === 'completed') data = data.filter(c => c.status === 'Resolved');
    if (activeTab === 'pending') data = data.filter(c => c.status !== 'Resolved');
    if (activeTab === 'breached') data = data.filter(c => c.slaBreached);
    if (activeTab === 'financial-hold') data = data.filter(c => c.financialHold);
    if (activeTab === 'escalated') data = data.filter(c => !!c.escalationLevel);
    if (activeTab === 'repeat') data = data.filter(c => c.repeatComplaint);
    return data;
  }, [officerFilteredComplaints, activeTab]);

  /* ---- KPI Counts (Filtered by Officer) ---- */
  const totalCount = officerFilteredComplaints.length;
  const resolvedCount = officerFilteredComplaints.filter(c => c.status === 'Resolved').length;
  const pendingCount = officerFilteredComplaints.filter(c => c.status !== 'Resolved').length;
  const slaBreachedCount = officerFilteredComplaints.filter(c => c.slaBreached).length;
  const financialHoldCount = officerFilteredComplaints.filter(c => c.financialHold).length;
  const repeatCount = officerFilteredComplaints.filter(c => c.repeatComplaint).length;

  /* ---- Table Columns ---- */
  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (c: UIComplaint) => (
        <span className="font-mono text-xs block truncate max-w-[80px]" title={c.id}>
          {c.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: 'ward',
      header: 'Location / Ward',
      render: (c: UIComplaint) => <Badge variant="outline">{c.wardNumber}</Badge>,
    },
    { key: 'fullName', header: 'Citizen' },
    {
      key: 'type',
      header: 'Type',
      render: (c: UIComplaint) => (
        <div>
          <p className="font-medium">{c.type || '-'}</p>
          <p className="text-xs text-muted-foreground">{c.category || '-'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: UIComplaint) => <StatusBadge status={c.status} />,
    },
    {
      key: 'assigned',
      header: 'Assigned To',
      render: (c: UIComplaint) => (
        c.assigned_to ? <span>Staff #{c.assigned_to}</span> : <span className="text-muted-foreground">Unassigned</span>
      ),
    },
    {
      key: 'escalation',
      header: 'Escalation',
      render: (c: UIComplaint) =>
        c.escalationLevel ? (
          <Badge variant="destructive">Escalated to {c.escalationLevel}</Badge>
        ) : (
          <span className="text-muted-foreground">None</span>
        ),
    },

    {
      key: 'resolved',
      header: 'Resolved At',
      render: (c: UIComplaint) =>
        c.resolved_at ? (
          <span className="text-xs text-muted-foreground">
            {new Date(c.resolved_at).toLocaleDateString()} {new Date(c.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title={categoryParam ? `${categoryParam} Grievance Dashboard` : "Citizen Grievance Dashboard"} subtitle="Loading...">
        <div className="flex h-64 items-center justify-center">Loading complaints...</div>
      </DashboardLayout>
    );
  }

  const allTimeTotal = Object.values(allTimeStatsObj).reduce((a, b) => a + b, 0);
  const allTimeResolved = allTimeStatsObj['Resolved'] || 0;
  const allTimePending = allTimeStatsObj['Submitted'] || 0;
  const allTimeInProgress = allTimeStatsObj['In Progress'] || 0;

  return (
    <DashboardLayout 
      title={categoryParam ? `${categoryParam} Grievance Dashboard` : "Citizen Grievance Dashboard"} 
      subtitle={`Manage and track complaints • ${selectedDate}`}
      headerActions={
        (userRole === 'citizen' || userRole === '') && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>New Complaint</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Complaint</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="module" className="text-right">Module</Label>
                <Select value={String(newComplaint.module_id)} onValueChange={(val) => setNewComplaint({...newComplaint, module_id: Number(val)})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select Module" />
                  </SelectTrigger>
                  <SelectContent>
                    {(userRole === 'ae1' || userRole === 'admin' || userRole === '') && (
                      <>
                        <SelectItem value="1">UGSS</SelectItem>
                        <SelectItem value="2">Water Utility</SelectItem>
                        <SelectItem value="3">Street Lighting</SelectItem>
                      </>
                    )}
                    {(userRole === 'ae2' || userRole === 'admin' || userRole === '') && (
                      <>
                        <SelectItem value="4">Solid Waste</SelectItem>
                        <SelectItem value="5">Survey</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">Reason</Label>
                <Input id="reason" value={newComplaint.reason} onChange={(e) => setNewComplaint({...newComplaint, reason: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">Location</Label>
                <Input id="location" value={newComplaint.location} onChange={(e) => setNewComplaint({...newComplaint, location: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">Description</Label>
                <Input id="desc" value={newComplaint.description} onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateComplaint}>Submit Complaint</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )
      }
      >

      {categoryParam === 'Survey' && subcategoryParam === 'Solidwaste survey' ? (
        <SolidWasteSurvey />
      ) : categoryParam === 'Survey' && subcategoryParam === 'Health' ? (
        <HealthSurvey />
      ) : (
        <>
          {/* =======================
              KPI CARDS (TODAY)
              ======================= */}
      <h2 className="mb-4 text-xl font-bold tracking-tight">Today's Complaints</h2>
      <div className="mb-8 grid gap-4 grid-cols-2">
        <KPICard title="Complaints Made Today" value={totalCount} icon={<Users />} onClick={() => openListModal("Today's Complaints", 'today', 'all')} />
        <KPICard title="Resolved Today" value={resolvedCount} variant="success" icon={<CheckCircle2 />} onClick={() => openListModal('Resolved Today', 'today', 'Resolved')} />
        <KPICard title="Pending Today" value={pendingCount} variant="warning" icon={<Clock />} onClick={() => openListModal('Pending Today', 'today', 'Submitted')} />
        <KPICard title="In Progress Today" value={officerFilteredComplaints.filter(c => c.status === 'In Progress').length} variant="info" icon={<Zap />} onClick={() => openListModal('In Progress Today', 'today', 'In Progress')} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Bar Chart – Complaints by Ward */}
        <div className="chart-container">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Complaints by Ward</h3>
            <div className="w-[200px]">
              <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Officers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Officers</SelectItem>
                  {officers.length > 0 ? (
                    <SelectGroup>
                      {officers.map(o => (
                        <SelectItem key={o.id || o.name} value={o.id || 'unknown'}>{o.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  ) : (
                    <SelectGroup>
                      <SelectItem value="fieldofficer1">Officer 1 (1-10)</SelectItem>
                      <SelectItem value="fieldofficer2">Officer 2 (11-20)</SelectItem>
                      <SelectItem value="fieldofficer3">Officer 3 (21-30)</SelectItem>
                      <SelectItem value="fieldofficer4">Officer 4 (31-42)</SelectItem>
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={complaintsByWard}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="ward" 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
                height={70}
                tick={{ fontSize: 10, fontWeight: 500 }} 
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ fontSize: '14px' }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart – Complaint Types */}
        <div className="chart-container">
          <h3 className="mb-4 font-semibold">Complaints by Type</h3>
          <StandardPieChart
            data={complaintsByType}
            dataKey="count"
            nameKey="type"
            showLabels={true}
            tooltipFormatter={(value: number) => `${value} Complaints`}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="escalated">Escalated</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DataTable data={filteredComplaints} columns={columns} maxHeight="none" />
        </TabsContent>
      </Tabs>
      </>
      )}

      <ComplaintListModal 
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        title={modalTitle}
        timeRange={modalTimeRange}
        selectedDate={selectedDate}
        statusFilter={modalStatus}
      />
    </DashboardLayout>
  );
}
