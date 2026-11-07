import React from 'react';

export const TemplateHeader: React.FC = () => {
  return (
    <div className="flex flex-col gap-1.5 pb-2">
      <h1 className="text-[28px] sm:text-[30px] font-bold text-[#242321] tracking-tight leading-tight">
        Video mẫu
      </h1>
      <p className="text-sm text-[#74716D] leading-relaxed max-w-2xl">
        Khám phá các video thời trang mẫu để sử dụng cùng người mẫu của bạn.
      </p>
    </div>
  );
};
