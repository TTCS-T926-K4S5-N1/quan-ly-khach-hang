import React from 'react';
import { OpportunityStatus } from '../../types/opportunity';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface OpportunityStatusBadgeProps {
  status: OpportunityStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const OpportunityStatusBadge: React.FC<OpportunityStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  if (status === 'WON') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-sm ${sizeClasses}`}
      >
        {showIcon && <CheckCircle2 size={iconSizes} className="text-emerald-600" />}
        <span>Thắng</span>
      </span>
    );
  }

  if (status === 'LOST') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-sm ${sizeClasses}`}
      >
        {showIcon && <XCircle size={iconSizes} className="text-rose-600" />}
        <span>Thua</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 shadow-sm ${sizeClasses}`}
    >
      {showIcon && <Clock size={iconSizes} className="text-sky-600" />}
      <span>Đang mở</span>
    </span>
  );
};
