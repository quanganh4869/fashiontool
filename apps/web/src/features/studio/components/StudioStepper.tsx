import React from 'react';
import {
  Check,
  User,
  Clapperboard,
  CheckCheck,
  Loader2,
  PlayCircle,
  Package,
  Shirt,
} from 'lucide-react';
import { StudioStep } from '../types/studio.types';

interface StudioStepperProps {
  currentStep: StudioStep;
  onStepClick?: (step: StudioStep) => void;
  canNavigateToStep?: (step: StudioStep) => boolean;
}

interface StepItem {
  key: StudioStep;
  title: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  { key: 'model', title: '1. Chọn người mẫu', icon: User },
  { key: 'template', title: '2. Chọn video mẫu', icon: Clapperboard },
  { key: 'confirm', title: '3. Kiểm tra tương thích', icon: CheckCheck },
  { key: 'processing', title: '4. Xử lý video', icon: Loader2 },
  { key: 'result', title: '5. Kết quả & Kiểm định', icon: PlayCircle },
  { key: 'products', title: '6. Nhập sản phẩm', icon: Package },
  { key: 'replacement', title: '7. Thay trang phục', icon: Shirt },
];

export const StudioStepper: React.FC<StudioStepperProps> = ({
  currentStep,
  onStepClick,
  canNavigateToStep,
}) => {
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
      <nav aria-label="Tiến trình studio" className="flex items-center justify-between overflow-x-auto">
        {STEPS.map((step, idx) => {
          const isCurrent = step.key === currentStep;
          const isCompleted = idx < stepIndex;
          const isAllowed = canNavigateToStep ? canNavigateToStep(step.key) : idx <= stepIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                disabled={!isAllowed}
                onClick={() => isAllowed && onStepClick?.(step.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isCurrent
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : isCompleted
                    ? 'text-slate-800 hover:bg-slate-100 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <span>{idx + 1}</span>}
                </span>
                <span className="hidden md:inline">{step.title}</span>
                <span className="md:hidden">
                  <Icon className="w-4 h-4 inline" />
                </span>
              </button>

              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 min-w-4 max-w-12 mx-1 rounded ${
                    idx < stepIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
