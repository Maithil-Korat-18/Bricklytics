import React from 'react';

export default function StatCard({ data }) {
  if (data.isAiInsight) {
    return (
      <div className="bg-ai-insight rounded-xl p-md border border-primary-fixed/50 shadow-ambient flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-fixed-dim/20 rounded-full blur-xl"></div>
        <div className="flex justify-between items-start relative z-10">
          <span className="font-body-sm text-body-sm text-primary font-semibold uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">auto_awesome</span> {data.title}
          </span>
          <div className="p-1.5 bg-primary/10 rounded-md text-primary">
            <span className="material-symbols-outlined text-sm">{data.icon || 'psychology'}</span>
          </div>
        </div>
        <div className="relative z-10">
          <div className="font-headline-lg text-headline-lg text-primary">{data.value}</div>
          <div className="text-secondary font-body-sm text-body-sm mt-1">{data.subtitle}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/30 shadow-ambient flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start">
        <span className="font-body-sm text-body-sm text-secondary font-medium uppercase tracking-wider">
          {data.title}
        </span>
        <div className={`p-1.5 rounded-md ${data.iconBg || 'bg-secondary-container/50'} ${data.iconColor || 'text-secondary'}`}>
          <span className="material-symbols-outlined text-sm">{data.icon || 'home_work'}</span>
        </div>
      </div>
      <div>
        <div className="font-headline-lg text-headline-lg text-on-surface">{data.value}</div>
        {data.trendText ? (
          <div className="flex items-center gap-1 text-tertiary font-label-md text-label-md mt-1">
            <span className="material-symbols-outlined text-sm">{data.trendIcon || 'trending_up'}</span>
            {data.trendText} <span className="text-secondary font-body-sm text-body-sm ml-1 font-normal">{data.trendSubtext}</span>
          </div>
        ) : (
          <div className="text-secondary font-body-sm text-body-sm mt-1">{data.subtitle}</div>
        )}
      </div>
    </div>
  );
}

