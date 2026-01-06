import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Cell } from 'recharts';

interface StaffingData {
  scheduled: number;
  actual: number;
}

interface StaffingChartProps {
  rn: StaffingData[];
  lpn: StaffingData[];
  cna: StaffingData[];
}

export const StaffingChart: React.FC<StaffingChartProps> = ({ rn, lpn, cna }) => {
  const days = ['Day 1', 'Day 2', 'Day 3'];
  
  const chartData = days.map((day, index) => ({
    name: day,
    'RN Scheduled': rn[index]?.scheduled || 0,
    'RN Actual': rn[index]?.actual || 0,
    'LPN Scheduled': lpn[index]?.scheduled || 0,
    'LPN Actual': lpn[index]?.actual || 0,
    'CNA Scheduled': cna[index]?.scheduled || 0,
    'CNA Actual': cna[index]?.actual || 0,
  }));

  // Calculate gaps
  const gaps = {
    rn: rn.reduce((acc, d) => acc + (d.scheduled - d.actual), 0),
    lpn: lpn.reduce((acc, d) => acc + (d.scheduled - d.actual), 0),
    cna: cna.reduce((acc, d) => acc + (d.scheduled - d.actual), 0),
  };

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(222, 30%, 18%)' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(222, 30%, 18%)' }}
              tickLine={false}
              width={30}
            />
            <Legend 
              wrapperStyle={{ fontSize: '10px' }}
              iconSize={8}
            />
            {/* RN */}
            <Bar dataKey="RN Scheduled" fill="hsl(210, 40%, 50%)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="RN Actual" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`rn-${index}`}
                  fill={entry['RN Actual'] < entry['RN Scheduled'] * 0.85 ? 'hsl(0, 84%, 60%)' : 'hsl(210, 60%, 65%)'}
                />
              ))}
            </Bar>
            {/* LPN */}
            <Bar dataKey="LPN Scheduled" fill="hsl(38, 70%, 45%)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="LPN Actual" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`lpn-${index}`}
                  fill={entry['LPN Actual'] < entry['LPN Scheduled'] * 0.85 ? 'hsl(0, 84%, 60%)' : 'hsl(38, 80%, 55%)'}
                />
              ))}
            </Bar>
            {/* CNA */}
            <Bar dataKey="CNA Scheduled" fill="hsl(142, 50%, 35%)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="CNA Actual" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cna-${index}`}
                  fill={entry['CNA Actual'] < entry['CNA Scheduled'] * 0.85 ? 'hsl(0, 84%, 60%)' : 'hsl(142, 60%, 45%)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gap Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-surface-2 rounded p-2">
          <div className="text-xxs text-muted-foreground uppercase">RN Gap</div>
          <div className={`font-mono font-bold ${gaps.rn > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {gaps.rn > 0 ? `-${gaps.rn}h` : '0h'}
          </div>
        </div>
        <div className="bg-surface-2 rounded p-2">
          <div className="text-xxs text-muted-foreground uppercase">LPN Gap</div>
          <div className={`font-mono font-bold ${gaps.lpn > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {gaps.lpn > 0 ? `-${gaps.lpn}h` : '0h'}
          </div>
        </div>
        <div className="bg-surface-2 rounded p-2">
          <div className="text-xxs text-muted-foreground uppercase">CNA Gap</div>
          <div className={`font-mono font-bold ${gaps.cna > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {gaps.cna > 0 ? `-${gaps.cna}h` : '0h'}
          </div>
        </div>
      </div>
    </div>
  );
};
