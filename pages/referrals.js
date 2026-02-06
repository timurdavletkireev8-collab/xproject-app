import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';

const referralsData = [
  { id: '1', name: 'Alice', reward: 5 },
  { id: '2', name: 'Bob', reward: 10 },
];

export default function Referrals() {
  const { isDark } = useTheme();
  const [code, setCode] = useState('');

  const handleInvite = () => {
    alert(`Referral code ${code} shared!`);
    setCode('');
  };

  return (
    <div style={{ backgroundColor: isDark ? '#121212' : '#fff', minHeight: '100vh', padding: 20 }}>
      <h1 style={{ color: isDark ? '#fff' : '#000' }}>Referrals</h1>

      <input
        type="text"
        placeholder="Enter referral code"
        value={code}
        onChange={e => setCode(e.target.value)}
        style={{
          padding: 10,
          borderRadius: 10,
          border: `1px solid ${isDark ? '#fff' : '#000'}`,
          marginBottom: 10,
          width: '100%',
          color: isDark ? '#fff' : '#000',
          backgroundColor: isDark ? '#1e1e1e' : '#fff'
        }}
      />
      <button onClick={handleInvite}>Invite</button>

      <div style={{ marginTop: 20 }}>
        {referralsData.map(item => (
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
            <span style={{ color: isDark ? '#fff' : '#000' }}>{item.name}</span>
            <span style={{ color: isDark ? '#fff' : '#000' }}>${item.reward}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
