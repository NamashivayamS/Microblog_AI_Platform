import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#1d9bf0', '#f91880', '#00ba7c', '#ffd400', '#794bc4', '#ff7a00'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#16181c',
        border: '1px solid #2f3336',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        color: '#e7e9ea',
      }}>
        <div style={{ fontWeight: 700 }}>@{payload[0].payload.user_name}</div>
        <div style={{ color: '#71767b' }}>{payload[0].value} posts</div>
      </div>
    );
  }
  return null;
};

export default function EngagementChart({ posts }) {
  if (!posts || posts.length === 0) return null;

  // Aggregate posts per author, top 6
  const countMap = {};
  posts.forEach(p => {
    countMap[p.user_name] = (countMap[p.user_name] || 0) + 1;
  });

  const data = Object.entries(countMap)
    .map(([user_name, count]) => ({ user_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (data.length < 2) return null;

  return (
    <div className="widget-card">
      <div className="widget-title">📈 Top Authors</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 4 }}>
          <XAxis
            dataKey="user_name"
            tick={{ fill: '#71767b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `@${v.slice(0, 6)}`}
          />
          <YAxis
            tick={{ fill: '#71767b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
