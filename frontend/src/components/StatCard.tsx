import { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'accent';
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, icon: Icon, trend, variant = 'default' }, ref) => {
    const variantStyles = {
      default: 'bg-gradient-to-br from-primary to-orange-600 before:bg-white/20',
      success: 'bg-gradient-to-br from-emerald-500 to-emerald-600 before:bg-white/20',
      warning: 'bg-gradient-to-br from-amber-500 to-amber-600 before:bg-white/20',
      accent: 'bg-gradient-to-br from-orange-500 to-red-600 before:bg-white/20',
    };

    return (
      <div ref={ref} className={`stat-card ${variantStyles[variant]} animate-slide-up border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm font-semibold mb-1 uppercase tracking-wide">{title}</p>
            <p className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-sm">{value}</p>
            {trend && (
              <p className="text-sm text-white/70 mt-2 font-medium">{trend}</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';
