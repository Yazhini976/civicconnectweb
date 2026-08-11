import React from 'react';
import { X } from 'lucide-react';
import { DataTable } from '@/components/dashboard/DataTable';

interface GenericListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  columns: any[];
}

export function GenericListModal({ isOpen, onClose, title, data, columns }: GenericListModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-xl border border-border bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <DataTable data={data} columns={columns} maxHeight="60vh" />
        </div>
      </div>
    </div>
  );
}
