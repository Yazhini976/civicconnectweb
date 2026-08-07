import { cn } from '@/lib/utils';

interface GaugeChartProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function GaugeChart({
  value,
  max = 100,
  label,
  unit = '%',
  size = 'md',
  variant = 'default',
}: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    xs: 'h-12 w-12',
    sm: 'h-24 w-24',
    md: 'h-32 w-32',
    lg: 'h-40 w-40',
  };

  const getColor = () => {
    if (variant !== 'default') {
      switch (variant) {
        case 'success': return 'stroke-success';
        case 'warning': return 'stroke-warning';
        case 'danger': return 'stroke-destructive';
      }
    }
    if (percentage >= 80) return 'stroke-success';
    if (percentage >= 50) return 'stroke-warning';
    return 'stroke-destructive';
  };

  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative', sizeClasses[size])}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-700 ease-out', getColor())}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "font-bold text-foreground leading-none",
            size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-lg' : 'text-2xl'
          )}>
            {value}
          </span>
          {unit && (
            <span className={cn(
              "text-muted-foreground leading-none mt-0.5",
              size === 'xs' ? 'text-[8px]' : 'text-xs'
            )}>
              {unit}
            </span>
          )}
        </div>
      </div>
      {label && <p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p>}
    </div>
  );
}
