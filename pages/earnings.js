 import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

const earningsData = [
  { id: '1', task: 'Complete survey', amount: 5 },
  { id: '2', task: 'Play mini-game', amount: 3 },
  { id: '3', task: 'Invite a friend', amount: 10 },
];

export default function Earnings() {
  const { isDark } = useTheme();

  return (
    <div style={{ backgroundColor: isDark ? '#121212' : '#fff', minHeight: '100vh', padding: 20 }}>
      <h1 style={{ color: isDark ? '#fff' : '#000' }}>Earnings</h1>
      {earningsData.map(item => (
        <div
          key={item.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2'
          }}
        >
          <span style={{ color: isDark ? '#fff' : '#000' }}>{item.task}</span>
          <span style={{ color: isDark ? '#fff' : '#000' }}>${item.amount}</span>
        </div>
      ))}
    </div>
  );
}
