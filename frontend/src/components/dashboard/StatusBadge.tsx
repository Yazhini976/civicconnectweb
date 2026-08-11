import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  // Normalize status from DB to one of the 4 strict statuses
  let normalized = status;
  const s = status.toLowerCase();
  
  if (s === 'resolved' || s === 'accepted' || s === 'completed') {
    normalized = 'Resolved';
  } else if (s === 'in progress' || s === 'wip' || s === 'running') {
    normalized = 'In Progress';
  } else if (s === 'rejected' || s === 'fault' || s === 'poor') {
    normalized = 'Rejected';
  } else {
    // Treat everything else (submitted, assigned, pending, standby, active, inactive, etc.) as Pending
    normalized = 'Pending';
  }

  // Determine Icon and color variant based on normalized status
  let Icon = AlertTriangle;
  let resolvedVariant: StatusVariant = 'warning';

  if (normalized === 'Resolved') {
    Icon = CheckCircle2;
    resolvedVariant = 'success';
  } else if (normalized === 'In Progress') {
    Icon = Clock;
    resolvedVariant = 'info';
  } else if (normalized === 'Rejected') {
    Icon = XCircle;
    resolvedVariant = 'danger';
  } else if (normalized === 'Pending') {
    Icon = AlertTriangle;
    resolvedVariant = 'warning';
  }

  // Override variant if explicitly provided
  if (variant) {
    resolvedVariant = variant;
  }

  return (
    <span className={cn('status-badge', resolvedVariant)}>
      <Icon className={cn(
        'h-3.5 w-3.5',
        resolvedVariant === 'success' && 'text-success',
        resolvedVariant === 'warning' && 'text-warning',
        resolvedVariant === 'danger' && 'text-destructive',
        resolvedVariant === 'info' && 'text-info',
        resolvedVariant === 'neutral' && 'text-muted-foreground'
      )} />
      <span>{normalized}</span>
    </span>
  );
}

