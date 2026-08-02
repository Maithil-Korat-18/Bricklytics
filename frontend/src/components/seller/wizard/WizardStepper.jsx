import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 'basic', name: 'Basic Information' },
  { id: 'details', name: 'Property Details' },
  { id: 'pricing', name: 'Pricing & Images' },
  { id: 'review', name: 'Review & Publish' },
];

export default function WizardStepper({ currentStep, onStepClick }) {
  return (
    <nav className="mb-8" aria-label="Progress">
      {/* Desktop Stepper — Horizontal Bar */}
      <div className="hidden sm:block">
        <div className="relative flex items-center justify-between">
          {/* Connection line (background) */}
          <div className="absolute left-[10%] right-[10%] top-[18px] h-[2px] bg-slate-200 z-0" />

          {/* Connection line (progress fill) */}
          <div
            className="absolute left-[10%] top-[18px] h-[2px] bg-emerald-500 z-[1] transition-all duration-700 ease-out"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 80}%` }}
          />

          {STEPS.map((step, idx) => {
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;
            const isFuture = currentStep < idx;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center" style={{ flex: '1' }}>
                {/* Step indicator circle */}
                <button
                  type="button"
                  onClick={() => { if (isCompleted) onStepClick(idx); }}
                  disabled={isFuture}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 border-2
                    ${isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white cursor-pointer hover:bg-emerald-600 hover:border-emerald-600 shadow-md shadow-emerald-500/25'
                      : isActive
                      ? 'bg-white border-blue-600 shadow-lg shadow-blue-500/20 ring-4 ring-blue-100'
                      : 'bg-white border-slate-200 cursor-not-allowed'}
                  `}
                  aria-label={step.name}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isActive ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </button>

                {/* Step title label (no step numbers) */}
                <span
                  className={`
                    mt-2.5 text-xs font-semibold text-center transition-colors duration-300 max-w-[120px] leading-tight
                    ${isActive ? 'text-blue-700 font-bold' : isCompleted ? 'text-emerald-700 font-semibold' : 'text-slate-400'}
                  `}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Stepper */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-blue-700">{STEPS[currentStep]?.name}</span>
          <span className="text-[11px] text-slate-400 font-medium">
            {currentStep + 1} of {STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => { if (isCompleted) onStepClick(idx); }}
                disabled={currentStep < idx}
                className={`
                  flex-1 h-2 rounded-full transition-all duration-500
                  ${isCompleted
                    ? 'bg-emerald-500'
                    : isActive
                    ? 'bg-blue-600 ring-2 ring-blue-200'
                    : 'bg-slate-200'}
                `}
                aria-label={step.name}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}
