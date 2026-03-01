"use client";

import { cn } from "@/lib/utils";
import { STEPS } from "@/types";
import { Check } from "lucide-react";

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps?: number[];
}

export function Stepper({
  currentStep,
  onStepClick,
  completedSteps = [],
}: StepperProps) {
  return (
    <div className="flex items-center gap-1 w-full">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.includes(step.id);
        const isPast = step.id < currentStep;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full",
                isActive
                  ? "bg-primary/20 text-primary"
                  : isPast || isCompleted
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted || isPast
                      ? "bg-primary/30 text-primary"
                      : "bg-secondary text-muted-foreground"
                )}
              >
                {isCompleted || isPast ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  step.id + 1
                )}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-4 shrink-0",
                  isPast ? "bg-primary/50" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
