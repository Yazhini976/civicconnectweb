import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DataTable } from '@/components/dashboard/DataTable';
import { DBComplaint } from '@/types';
import { getComplaints } from '@/services/api';

interface ComplaintListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  timeRange: 'all-time' | 'today';
  selectedDate?: string;
  statusFilter?: 'all' | 'Resolved' | 'In Progress' | 'Submitted';
}

export function ComplaintListModal({ isOpen, onClose, title, timeRange, selectedDate, statusFilter = 'all' }: ComplaintListModalProps) {
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<DBComplaint[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchComplaints = async () => {
      setLoading(true);
      try {
        // If timeRange is 'today', we pass the selectedDate to get only today's complaints.
        // If 'all-time', we pass undefined to fetch everything.
        const data = await getComplaints(timeRange === 'today' ? selectedDate : undefined);
        let filtered = data || [];
        
        if (statusFilter !== 'all') {
          filtered = filtered.filter(c => c.status === statusFilter);
        }
        
        setComplaints(filtered);
      } catch (err) {
        console.error('Failed to fetch complaints for modal', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [isOpen, timeRange, selectedDate, statusFilter]);

  if (!isOpen) return null;

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (c: any) => (
        <span className="font-mono text-xs block truncate max-w-[80px]" title={c.id}>
          {c.id.slice(0, 8)}...
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
      render: (c: any) => (
        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
          c.status === 'Resolved' ? 'bg-green-100 text-green-800' :
          c.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {c.status || 'Submitted'}
        </span>
      ),
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
            <div className="flex h-32 items-center justify-center text-slate-500">Loading complaints...</div>
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
