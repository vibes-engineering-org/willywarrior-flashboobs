"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TokenChartProps {
  data: number[];
  name: string;
  symbol: string;
  isPositive?: boolean;
}

export default function TokenChart({ data, name, symbol, isPositive = true }: TokenChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No chart data available
      </div>
    );
  }

  // Transform the data for Recharts
  const chartData = data.map((price, index) => ({
    index,
    price,
    date: new Date(Date.now() - (data.length - 1 - index) * 24 * 60 * 60 * 1000),
  }));

  const formatTooltip = (value: any, name: any, props: any) => {
    if (name === 'price') {
      return [`$${Number(value).toLocaleString()}`, 'Price'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: any, index: any) => {
    const date = chartData[tickItem]?.date;
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="index"
            tickFormatter={formatXAxisLabel}
            className="text-xs"
          />
          <YAxis
            domain={['dataMin - 10', 'dataMax + 10']}
            tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
            className="text-xs"
          />
          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => {
              const item = chartData[label as number];
              return item ? item.date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }) : '';
            }}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={isPositive ? "#10b981" : "#ef4444"}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: isPositive ? "#10b981" : "#ef4444", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}