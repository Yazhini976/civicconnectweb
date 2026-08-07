import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CONFIG } from '@/data/mockData';

interface FilterBarProps {
  filters: {
    ward?: string;
    zone?: string;
    status?: string;
    sla?: string;
    station?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  showWard?: boolean;
  showZone?: boolean;
  showStatus?: boolean;
  showSLA?: boolean;
  showStation?: boolean;
  statusOptions?: string[];
}

export function FilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  showWard = true,
  showZone = true,
  showStatus = true,
  showSLA = false,
  showStation = false,
  statusOptions = ['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved'],
}: FilterBarProps) {
  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'all').length;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters
      </div>

      {showWard && (
        <Select value={filters.ward || 'all'} onValueChange={(v) => onFilterChange('ward', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Ward" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wards</SelectItem>
            {Array.from({ length: CONFIG.totalWards }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                Ward {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showZone && (
        <Select value={filters.zone || 'all'} onValueChange={(v) => onFilterChange('zone', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            <SelectItem value="Zone 1">Zone 1</SelectItem>
            <SelectItem value="Zone 2">Zone 2</SelectItem>
            <SelectItem value="Zone 3">Zone 3</SelectItem>
          </SelectContent>
        </Select>
      )}

      {showStatus && (
        <Select value={filters.status || 'all'} onValueChange={(v) => onFilterChange('status', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status.toLowerCase()}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showSLA && (
        <Select value={filters.sla || 'all'} onValueChange={(v) => onFilterChange('sla', v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="SLA Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SLA</SelectItem>
            <SelectItem value="within">Within SLA</SelectItem>
            <SelectItem value="approaching">Approaching</SelectItem>
            <SelectItem value="breached">Breached</SelectItem>
          </SelectContent>
        </Select>
      )}

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1">
          <X className="h-4 w-4" />
          Clear
          <Badge variant="secondary" className="ml-1">
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
