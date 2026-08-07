import React from 'react';
import { Check, Sparkles } from 'lucide-react';

const STEPS = [
  { id: 'basic',    name: 'Basic Info' },
  { id: 'location', name: 'Location' },
  { id: 'amenities',name: 'Amenities' },
  { id: 'media',    name: 'Media' },
  { id: 'preview',  name: 'AI Preview' },
];

export default function WizardStepper({ currentStep, onStepClick }) {
  return (
    <nav className="mb-8" aria-label="Progress">
      {/* Desktop Stepper — matches reference photo */}
      <div className="hidden sm:flex items-start justify-between">
        {STEPS.map((step, idx) => {
          const isActive    = currentStep === idx;
          const isCompleted = currentStep > idx;
          const isFuture    = currentStep < idx;
          const isLast      = idx === STEPS.length - 1;
          const isAIStep    = idx === 4;

          return (
            <React.Fragment key={step.id}>
              {/* Step cell */}
              <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
                {/* Circle badge */}
                <button
                  type="button"
                  onClick={() => { if (isCompleted) onStepClick(idx); }}
                  disabled={isFuture}
                  aria-label={step.name}
                  aria-current={isActive ? 'step' : undefined}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    text-sm font-bold transition-all duration-300 border-2 select-none
                    ${isCompleted
                      ? 'bg-[#0058be] border-[#0058be] text-white cursor-pointer shadow-md shadow-[#0058be]/25 hover:bg-[#004395] hover:border-[#004395]'
                      : isActive
                      ? 'bg-[#0058be] border-[#0058be] text-white shadow-lg shadow-[#0058be]/25 animate-pulse-ring'
                      : 'bg-[#eaedff] border-[#c2c6d6] text-[#424754] cursor-not-allowed'}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  ) : isAIStep && isFuture ? (
                    <Sparkles className="w-4 h-4 text-[#727785]" />
                  ) : isAIStep && isActive ? (
                    <Sparkles className="w-4 h-4 text-white" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </button>

                {/* Label */}
                <span
                  className={`
                    mt-2.5 text-xs font-semibold text-center leading-tight whitespace-nowrap
                    transition-colors duration-300
                    ${isActive
                      ? 'text-[#0058be] font-bold'
                      : isCompleted
                      ? 'text-[#0058be]'
                      : 'text-[#727785]'}
                  `}
                >
                  {step.name}
                </span>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div
                  className="flex-1 mt-5 mx-1"
                  style={{ height: '1.5px', alignSelf: 'flex-start', marginTop: '19px' }}
                >
                  <div
                    className="w-full h-full transition-all duration-500"
                    style={{ backgroundColor: isCompleted ? '#0058be' : '#c2c6d6' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#0058be]">{STEPS[currentStep]?.name}</span>
          <span className="text-[11px] text-[#727785] font-medium">
            {currentStep + 1} of {STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((step, idx) => {
            const isActive    = currentStep === idx;
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
                    ? 'bg-[#0058be]'
                    : isActive
                    ? 'bg-[#0058be] ring-2 ring-[#adc6ff]'
                    : 'bg-[#dae2fd]'}
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
