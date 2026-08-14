import { CheckCircle } from 'lucide-react';
import { FormStep } from '../../types';

interface ProgressIndicatorProps {
  steps: { key: FormStep; label: string }[];
  currentStep: FormStep;
  onStepClick?: (step: FormStep) => void;
}

export function ProgressIndicator({
  steps,
  currentStep,
  onStepClick,
}: ProgressIndicatorProps) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <div className="w-full">
      <div className="hidden md:flex items-start w-full overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const isCurrent = step.key === currentStep;
          const isCompleted = index < currentIndex;
          const isClickable = !!onStepClick && index <= currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.key)}
                className="flex flex-col items-center min-w-[4.5rem] disabled:cursor-default"
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={step.label}
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary text-primary bg-background'
                        : 'border-muted text-muted-foreground bg-background'
                  } ${isClickable ? 'hover:border-primary/70' : ''}`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </span>
                <span
                  className={`mt-2 text-xs text-center leading-tight ${
                    isCurrent
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-1.25rem] ${
                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {steps[currentIndex].label}
          </span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full mb-3">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {steps.map((step, index) => {
            const isCurrent = step.key === currentStep;
            const isCompleted = index < currentIndex;
            const isClickable = !!onStepClick && index <= currentIndex;
            return (
              <button
                key={step.key}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.key)}
                className={`min-w-11 min-h-11 rounded-md text-xs px-2 border ${
                  isCurrent
                    ? 'border-primary text-primary bg-background'
                    : isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground'
                }`}
                aria-label={step.label}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
