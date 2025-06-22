import React from 'react';

interface MetricBarProps {
  label: string;
  value: number;
  min: number;
  max: number;
  gradient: string;
  unit?: string;
  valueLabel?: string;
}

const MetricBar: React.FC<MetricBarProps> = ({
  label,
  value,
  min,
  max,
  gradient,
  unit = '',
  valueLabel,
}) => {
  const range = max - min;
  const cappedValue = Math.max(min, Math.min(value, max));
  const percentage = range === 0 ? 0 : ((cappedValue - min) / range) * 100;

  return (
    <div className="w-full group">
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium uppercase tracking-wider text-gray-400 text-xs">{label}</span>
        {valueLabel && (
          <div className="text-right text-xs uppercase font-bold tracking-wider"
               style={{
                  color: percentage > 66 ? '#4ade80' : (percentage > 33 ? '#facc15' : '#f87171')
               }}
          >
            {valueLabel}
          </div>
        )}
      </div>
      <div className="relative w-full flex items-center h-4">
        <div className="w-full h-1.5 rounded-full" style={{ backgroundImage: gradient }} />
        <div
          className="absolute top-1/2 h-4 w-1 bg-white rounded-full transform -translate-y-1/2 shadow-md transition-all duration-300 ease-out"
          style={{ left: `calc(${percentage}% - 2px)` }}
        >
             <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 border border-gray-700 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {value.toFixed(unit === 'wpm' ? 0 : 2)} {unit}
             </div>
        </div>
      </div>
    </div>
  );
};

export default MetricBar; 