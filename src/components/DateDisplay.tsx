import React from 'react';

interface DateDisplayProps {
  currentDate: Date;
  countdowns: Array<{
    name: string;
    date: Date;
  }>;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({ currentDate, countdowns }) => {
  return (
    <div className="date-display bg-charcoal p-4 rounded-lg">
      <div className="text-lg mb-2">
        {currentDate.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
      <div className="countdowns space-y-1">
        {countdowns.map((countdown, index) => {
          const daysLeft = Math.ceil(
            (countdown.date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div key={index} className="flex justify-between">
              <span>{countdown.name}:</span>
              <span>{daysLeft}天</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 