import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  getComplaints,
  getWorkOrders,
  getAllStations,
  getOfficerStats
} from '@/services/api';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { StandardPieChart } from '@/components/dashboard/StandardPieChart';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ===================== DOWNLOAD HELPER ===================== */
const PHONE_KEYS = ['phone', 'phone_number', 'mobile', 'contact', 'phonenumber'];
const DATE_KEYS = ['date', 'created_at', 'resolved_at', 'updated_at', 'survey_date'];

const formatCellValue = (key: string, value: any): string => {
  const k = key.toLowerCase();
  if (value === null || value === undefined) return '';

  // Phone → force text in Excel using ="..."
  if (PHONE_KEYS.some(p => k.includes(p))) {
    return `="${String(value)}"`;
  }

  // Date → reformat YYYY-MM-DD or ISO timestamp to DD/MM/YYYY
  if (DATE_KEYS.some(d => k.includes(d))) {
    const str = String(value);
    const iso = str.split('T')[0]; // handle "2026-08-01T..." too
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return String(value);
};

const downloadCSV = (filename: string, rows: any[]) => {
  if (!rows || !rows.length) return;

  const allHeaders = Object.keys(rows[0]);
  const headers = allHeaders.filter(h =>
    h.toLowerCase() !== 'color' &&
    h.toLowerCase() !== 'fill' &&
    h.toLowerCase() !== 'photo_url' &&
    h.toLowerCase() !== 'audio_url'
  );

  const csv =
    headers.join(',') +
    '\n' +
    rows
      .map(row =>
        headers.map(h => {
          const formatted = formatCellValue(h, row[h]);
          // Wrap in quotes if not already an Excel formula
          if (formatted.startsWith('="')) return formatted;
          return `"${formatted}"`;
        }).join(',')
      )
      .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* ===================== DIRECT PDF DOWNLOAD ===================== */
const handlePrintPDF = (activeTab: string, data: any) => {
  const doc = new jsPDF();
  
  if (activeTab === 'details') {
    doc.setFontSize(16);
    doc.text('Complaint Details Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    autoTable(doc, {
      startY: 28,
      head: [['Citizen Name', 'Category', 'Type', 'Ward', 'Status', 'Created At']],
      body: data.complaints.map((c: any) => [
        c.citizen_name || 'Anonymous',
        c.category || '-',
        c.type || '-',
        c.ward_number || '-',
        c.status || '-',
        c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'
      ]),
      headStyles: { fillColor: [30, 58, 138] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save('complaints_report.pdf');
    
  } else if (activeTab === 'officers') {
    doc.setFontSize(16);
    doc.text('Officer Performance Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    autoTable(doc, {
      startY: 28,
      head: [['Officer Name', 'Assigned', 'Resolved', 'Avg Resolve Time']],
      body: data.processedOfficers.map((o: any) => [
        o.name || 'Unassigned',
        o.totalAssigned,
        o.resolved,
        o.avg_time
      ]),
      headStyles: { fillColor: [30, 58, 138] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save('officers_report.pdf');
    doc.save('officers_report.pdf');
  }
};

/* ======================================================= */

const COLORS = [
  'hsl(215, 80%, 45%)',
  'hsl(175, 60%, 45%)',
  'hsl(38, 95%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(0, 75%, 55%)',
];

export default function Reports() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [officerStats, setOfficerStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const currentHash = location.hash.replace('#', '') || 'details';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cData, woData, sData, statsData] = await Promise.all([
          getComplaints().catch(() => []),
          getWorkOrders().catch(() => []),
          getAllStations().catch(() => []),
          getOfficerStats().catch(() => [])
        ]);
        setComplaints(cData || []);
        setWorkOrders(woData || []);
        setStations(sData || []);
        setOfficerStats(statsData || []);
      } catch (err) {
        console.error('Failed to fetch report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Derived Chart Data ---

  // 1. Team Ranking (from Work Orders)
  const teamRanking = useMemo(() => {
    const staffMap: Record<number, { name: string, assigned: number, resolved: number }> = {};
    workOrders.forEach(wo => {
      if (!staffMap[wo.staff_id]) {
        staffMap[wo.staff_id] = { name: `Staff ${wo.staff_id}`, assigned: 0, resolved: 0 };
      }
      staffMap[wo.staff_id].assigned++;
      if (wo.status === 'Completed' || wo.status === 'Resolved') {
        staffMap[wo.staff_id].resolved++;
      }
    });

    return Object.values(staffMap).map(s => ({
      name: s.name,
      assigned: s.assigned,
      resolved: s.resolved,
    })).sort((a, b) => b.assigned - a.assigned).slice(0, 10);
  }, [workOrders]);


  const processedOfficers = useMemo(() => {
    return officerStats.map(o => {
      const totalAssigned = o.total_assigned || 0;
      const resolvedCount = o.resolved || 0;
      const notResolved = totalAssigned - resolvedCount;
      return {
        id: o.id,
        name: o.name,
        totalAssigned,
        resolved: resolvedCount,
        notResolved,
      };
    }).sort((a, b) => b.totalAssigned - a.totalAssigned);
  }, [officerStats]);

  /* ========== DOWNLOAD ACTIVE REPORT ========= */

  /* ======================================== */

  if (loading) return <DashboardLayout title="Reports">Loading...</DashboardLayout>;

  return (
    <DashboardLayout title="Reports">
      {/* Download Reports Button */}
      <div className="mb-6 flex justify-end gap-3">
        <button 
          onClick={() => downloadCSV(`${currentHash}_report.csv`, currentHash === 'details' ? complaints : processedOfficers)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          Download CSV
        </button>
        <button 
          onClick={() => handlePrintPDF(currentHash, { complaints, processedOfficers, teamRanking })}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          ⬇ Download PDF (Active Tab)
        </button>
      </div>


      <div id="reports-content">
        <Tabs value={currentHash}>
          <TabsContent value="details">
            <div className="chart-container">
              <h4 className="mb-4 font-semibold">Complaint Details Report</h4>
              <DataTable data={complaints} columns={[
                {
                  key: 'serial',
                  header: 'S.No',
                  render: (_c: any, index?: number) => <span className="font-mono text-xs text-slate-500">{(index ?? 0) + 1}</span>
                },
                { key: 'citizen_name', header: 'Citizen Name' },
                { key: 'category', header: 'Category' },
                { key: 'type', header: 'Type' },
                { key: 'ward_number', header: 'Ward' },
                { 
                  key: 'status', 
                  header: 'Status',
                  render: (c: any) => <StatusBadge status={c.status} />
                },
                { 
                  key: 'created_at', 
                  header: 'Created At',
                  render: (c: any) => new Date(c.created_at).toLocaleDateString()
                }
              ]} maxHeight="400px" />
            </div>
          </TabsContent>

          <TabsContent value="officers">
            <div className="chart-container">
              <h4 className="mb-4 font-semibold">Field Officers Details</h4>
              <DataTable data={processedOfficers} columns={[
                { key: 'name', header: 'Officer Name' },
                { key: 'totalAssigned', header: 'Assigned Cases' },
                { key: 'resolved', header: 'Resolved' },
                { key: 'notResolved', header: 'Not Resolved' }
              ]} maxHeight="400px" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
