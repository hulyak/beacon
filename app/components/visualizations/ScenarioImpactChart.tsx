'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

interface ScenarioOutcome {
  metric: string;
  before: number;
  after: number;
  change: number;
  unit: string;
}

interface ScenarioImpactChartProps {
  outcomes: ScenarioOutcome[];
  title?: string;
}

const defaultOutcomes: ScenarioOutcome[] = [
  { metric: 'Delivery Time', before: 14, after: 21, change: 50, unit: 'days' },
  { metric: 'Shipping Cost', before: 100, after: 125, change: 25, unit: '%' },
  { metric: 'Inventory', before: 100, after: 85, change: -15, unit: '%' },
  { metric: 'Risk Score', before: 45, after: 72, change: 60, unit: 'pts' },
  { metric: 'Supplier Load', before: 75, after: 95, change: 27, unit: '%' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ScenarioOutcome;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isNegative = data.change < 0;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
        <p className="text-gray-900 font-medium mb-2">{data.metric}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-500">
            Before: <span className="text-gray-900">{data.before} {data.unit}</span>
          </p>
          <p className="text-gray-500">
            After: <span className="text-gray-900">{data.after} {data.unit}</span>
          </p>
          <p className={isNegative ? 'text-green-600' : 'text-red-600'}>
            Change: {isNegative ? '' : '+'}{data.change}%
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function ScenarioImpactChart({ outcomes = defaultOutcomes, title = 'Scenario Impact Analysis' }: ScenarioImpactChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={outcomes}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" stroke="#6b7280" fontSize={12} />
            <YAxis
              type="category"
              dataKey="metric"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="before" name="Before" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12}>
              {outcomes.map((_, index) => (
                <Cell key={`before-${index}`} fill="#3b82f6" />
              ))}
            </Bar>
            <Bar dataKey="after" name="After" fill="#f97316" radius={[0, 4, 4, 0]} barSize={12}>
              {outcomes.map((entry, index) => (
                <Cell
                  key={`after-${index}`}
                  fill={entry.change < 0 ? '#22c55e' : '#f97316'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-sm text-gray-600">Before Disruption</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-sm text-gray-600">After Disruption</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm text-gray-600">Improvement</span>
        </div>
      </div>
    </motion.div>
  );
}

export default ScenarioImpactChart;
