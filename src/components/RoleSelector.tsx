import React from 'react';
import { Role } from '../types';
import { ShieldCheck, UserCheck, User } from 'lucide-react';

interface Props {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

export const RoleSelector: React.FC<Props> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <span className="text-sm font-semibold text-slate-600">Quyền hiện tại:</span>
      <div className="flex gap-2">
        <button
          onClick={() => onRoleChange('SALES_REP')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentRole === 'SALES_REP'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          NVKD (Sales Rep)
        </button>

        <button
          onClick={() => onRoleChange('TEAM_LEAD')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentRole === 'TEAM_LEAD'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Trưởng nhóm (Team Lead)
        </button>

        <button
          onClick={() => onRoleChange('DIRECTOR')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentRole === 'DIRECTOR'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Giám đốc (Director)
        </button>
      </div>
    </div>
  );
};
