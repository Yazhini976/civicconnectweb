import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DataTable } from '@/components/dashboard/DataTable';
import { DBComplaint } from '@/types';
import { getComplaints } from '@/services/api';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

interface ComplaintListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  timeRange?: 'all-time' | 'today';
  selectedDate?: string;
  statusFilter?: 'all' | 'Resolved' | 'In Progress' | 'Submitted' | 'Pending' | 'Rejected';
  complaintsList?: any[];
}

export function ComplaintListModal({ isOpen, onClose, title, timeRange, selectedDate, statusFilter = 'all', complaintsList }: ComplaintListModalProps) {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<DBComplaint[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const applyStatusFilter = (list: DBComplaint[]) => {
      if (!statusFilter || statusFilter === 'all') return list;
      return list.filter(c => {
        const s = (c.status || '').toUpperCase();
        if (statusFilter === 'Resolved') return s === 'RESOLVED' || s === 'COMPLETED' || s === 'ACCEPTED';
        if (statusFilter === 'Pending' || statusFilter === 'Submitted')
          return s === 'SUBMITTED' || s === 'PENDING' || s === 'ASSIGNED' || s === 'STANDBY';
        if (statusFilter === 'In Progress') return s === 'IN PROGRESS' || s === 'IN_PROGRESS' || s === 'WIP' || s === 'RUNNING';
        if (statusFilter === 'Rejected') return s === 'REJECTED' || s === 'FAULT' || s === 'POOR';
        // fallback: case-insensitive match
        return s === statusFilter.toUpperCase();
      });
    };

    if (complaintsList && Array.isArray(complaintsList)) {
      setComplaints(applyStatusFilter(complaintsList));
      return;
    }

    const fetchComplaints = async () => {
      setLoading(true);
      try {
        // Always fetch with date when provided (for 'today' filter)
        // For 'all-time', fetch without date to get all records
        const fetchDate = timeRange === 'today' ? selectedDate : undefined;
        const data = await getComplaints(fetchDate);
        setComplaints(applyStatusFilter(data || []));
      } catch (err) {
        console.error('Failed to fetch complaints for modal', err);
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [isOpen, timeRange, selectedDate, statusFilter, complaintsList]);

  if (!isOpen) return null;

  const columns = [
    {
      key: 'serial',
      header: 'S.No',
      render: (_c: any, index?: number) => (
        <span className="font-mono text-xs text-slate-500">{(index ?? 0) + 1}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (c: any) => (
        <span className="text-xs text-slate-600">
          {new Date(c.created_at).toLocaleDateString()}{' '}
          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (c: any) => <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold">{c.ward_number || c.location || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: any) => <StatusBadge status={c.status} />,
    },
    {
      key: 'created_at',
      header: 'Submitted At',
      render: (c: any) => (
        <span className="text-xs text-slate-500">
          {new Date(c.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl rounded-xl bg-white shadow-xl relative flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center gap-2 text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-slate-400">
              <span className="text-4xl mb-2">📋</span>
              <span className="text-sm font-medium">No complaints found</span>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={complaints}
              isCitizenView={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
