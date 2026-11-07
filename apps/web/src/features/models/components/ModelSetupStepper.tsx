import React from 'react';
import { Check } from 'lucide-react';
import { WizardStepKey } from '../types/model-management.types';

export interface StepItem {
  key: WizardStepKey;
  stepNumber: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  isDisabled: boolean;
}

export interface ModelSetupStepperProps {
  steps: StepItem[];
  onStepClick: (stepKey: WizardStepKey) => void;
}

export const ModelSetupStepper: React.FC<ModelSetupStepperProps> = ({
  steps,
  onStepClick,
}) => {
  return (
    <div className="w-full bg-white border border-[#E8E5E0] rounded-xl p-4 sm:p-5 shadow-sm">
      {/* Desktop & Tablet Stepper */}
      <nav aria-label="Tiến trình tạo hồ sơ người mẫu" className="w-full">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, index) => {
            const isClickable = !step.isDisabled && !step.isActive;

            return (
              <React.Fragment key={step.key}>
                <li className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!isClickable}
                    aria-label={`Bước ${step.stepNumber}: ${step.title}`}
                    onClick={() => isClickable && onStepClick(step.key)}
                    className={`flex items-center gap-2.5 text-left transition-colors focus:outline-none rounded-md ${
                      isClickable
                        ? 'cursor-pointer hover:opacity-80'
                        : step.isActive
                          ? 'cursor-default'
                          : 'cursor-not-allowed opacity-45'
                    }`}
                  >
                    {/* Step Number Circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        step.isActive
                          ? 'bg-[#654B7B] text-white ring-4 ring-[#654B7B]/15'
                          : step.isCompleted
                            ? 'bg-[#367458] text-white'
                            : 'bg-[#F6F5F2] text-[#74716D] border border-[#E8E5E0]'
                      }`}
                    >
                      {step.isCompleted ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        step.stepNumber
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="hidden sm:flex flex-col">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[#74716D]">
                        Bước {step.stepNumber}
                      </span>
                      <span
                        className={`text-sm font-semibold truncate ${
                          step.isActive
                            ? 'text-[#242321]'
                            : step.isCompleted
                              ? 'text-[#367458]'
                              : 'text-[#74716D]'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  </button>
                </li>

                {/* Connecting Line between steps */}
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={`flex-1 h-[2px] mx-3 sm:mx-6 transition-colors ${
                      steps[index].isCompleted ? 'bg-[#367458]' : 'bg-[#E8E5E0]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      {/* Mobile Title indicator */}
      <div className="sm:hidden mt-3 pt-3 border-t border-[#F2EDF5] flex items-center justify-between text-xs">
        <span className="text-[#74716D]">
          Bước {steps.find((s) => s.isActive)?.stepNumber} / 3:
        </span>
        <span className="font-semibold text-[#242321]">
          {steps.find((s) => s.isActive)?.title}
        </span>
      </div>
    </div>
  );
};
