import React from 'react';
import { Plus, BarChart3, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const iconMap = {
  Plus,
  BarChart3,
  Building2,
};

export default function QuickActionCard({ action }) {
  const Icon = iconMap[action.iconName] || Plus;

  const content = (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card-soft hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer group flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${action.accentColor} group-hover:scale-105 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
          Action →
        </span>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
          {action.title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {action.description}
        </p>
      </div>
    </div>
  );

  return action.to ? <Link to={action.to}>{content}</Link> : content;
}
