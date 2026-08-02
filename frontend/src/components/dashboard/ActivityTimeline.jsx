import React from 'react';
import { 
  Building2, 
  Image as ImageIcon, 
  CheckCircle2, 
  Pencil, 
  Clock3, 
  FileEdit, 
  UploadCloud,
  Send
} from 'lucide-react';

const activityConfig = {
  property: { icon: Building2, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  update: { icon: Pencil, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  media: { icon: UploadCloud, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  publish: { icon: Send, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  sale: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  draft: { icon: FileEdit, color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function formatRelativeTime(value) {
  if (!value) return 'Just now';
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  
  const diffMs = Date.now() - timestamp.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(timestamp);
}

export default function ActivityTimeline({ activities = [] }) {
  const displayActivities = activities.slice(0, 5);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
        <p className="text-xs text-slate-400 mt-0.5">Timeline of recent events and updates across your property portfolio</p>
      </div>

      {displayActivities.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-5 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No recent activity</p>
          <p className="mt-1 text-xs text-slate-400">Property additions, updates, and image uploads will appear here.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80">
          {displayActivities.map((item, index) => {
            const config = activityConfig[item.type] || activityConfig.property;
            const Icon = config.icon;
            const propertyName = item.propertyName || item.property_name || item.description?.replace(/^(Added|Updated|Uploaded images for|Marked|Published)\s*/i, '').replace(/\.$/, '') || 'Property Listing';

            return (
              <div key={item.id || index} className="relative flex items-start space-x-4 group">
                {/* Timeline node icon */}
                <div
                  className={`
                    absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border
                    ${config.color} ring-4 ring-white transition-transform group-hover:scale-110 shadow-xs
                  `}
                >
                  <Icon className="w-3 h-3" />
                </div>

                {/* Event Content */}
                <div className="flex-1 bg-slate-50/60 group-hover:bg-blue-50/30 p-3.5 rounded-xl border border-slate-100 group-hover:border-blue-100 transition-all">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-blue-700 mb-0.5">
                    {propertyName}
                  </p>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
