import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

const statusVariantMap: Record<string, StatusVariant> = {
  // Complaint statuses
  'Resolved': 'success',
  'Accepted': 'success',
  'Rejected': 'danger',
  'In Progress': 'info',
  'Assigned': 'warning',
  'Submitted': 'neutral',
  'Pending': 'warning',
  
  // Equipment statuses
  'Running': 'success',
  'Standby': 'neutral',
  'Maintenance': 'warning',
  'Fault': 'danger',
  
  // Compliance
  'Compliant': 'success',
  'Non-Compliant': 'danger',
  
  // General
  'Active': 'success',
  'Inactive': 'neutral',
  'On Leave': 'warning',
  'Training': 'info',
  
  // Levels
  'Normal': 'success',
  'High': 'warning',
  'Low': 'info',
  'Critical': 'danger',
  
  // Housekeeping
  'Excellent': 'success',
  'Good': 'success',
  'Average': 'warning',
  'Poor': 'danger',
  
  // Maintenance
  'Up to Date': 'success',
  'Due': 'warning',
  'Overdue': 'danger',
  
  // Risk levels
  'Medium': 'warning',
};

function getStatusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === 'resolved' || s === 'accepted') return CheckCircle2;
  if (s === 'rejected') return XCircle;
  if (s === 'in progress') return Clock;
  if (s === 'pending' || s === 'submitted') return AlertCircle;
  return null;
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || statusVariantMap[status] || 'neutral';
  const Icon = getStatusIcon(status);

  return (
    <span className={cn('status-badge', resolvedVariant)}>
      {Icon ? (
        <Icon className={cn(
          'h-3.5 w-3.5',
          resolvedVariant === 'success' && 'text-success',
          resolvedVariant === 'warning' && 'text-warning',
          resolvedVariant === 'danger' && 'text-destructive',
          resolvedVariant === 'info' && 'text-info',
          resolvedVariant === 'neutral' && 'text-muted-foreground'
        )} />
      ) : (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full flex-shrink-0',
          resolvedVariant === 'success' && 'bg-success',
          resolvedVariant === 'warning' && 'bg-warning',
          resolvedVariant === 'danger' && 'bg-destructive',
          resolvedVariant === 'info' && 'bg-info',
          resolvedVariant === 'neutral' && 'bg-muted-foreground',
        )} />
      )}
      <span>{status}</span>
    </span>
  );
}

