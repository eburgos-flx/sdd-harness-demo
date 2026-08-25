'use client';

import {
  Bar,
  BarChart as RCBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Datum {
  name: string;
  votes: number;
  pct: number;
}

export default function BarChart({ data }: { data: Datum[] }) {
  return (
    <div className="h-72 w-full md:h-96">
      <ResponsiveContainer>
        <RCBarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 8, left: -8 }}
        >
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            allowDecimals={false}
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(9,9,11,0.04)' }}
            contentStyle={{
              background: '#09090b',
              border: 'none',
              borderRadius: 14,
              padding: '10px 14px',
              boxShadow: '0 10px 30px -12px rgba(0,0,0,0.35)',
            }}
            itemStyle={{ color: '#f9fafb', fontSize: 12 }}
            labelStyle={{ color: '#a1a1aa', fontSize: 11 }}
            formatter={(value, _name, entry) => {
              const pct = (entry?.payload as Datum | undefined)?.pct ?? 0;
              return [`${value ?? 0} · ${pct}%`, 'Votos'];
            }}
          />
          <Bar
            dataKey="votes"
            fill="#2563eb"
            radius={[12, 12, 4, 4]}
            maxBarSize={64}
          />
        </RCBarChart>
      </ResponsiveContainer>
    </div>
  );
}
