import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

export default function Profile() {
  const { isDark } = useTheme();

  return (
    <div style={{ backgroundColor: isDark ? '#121212' : '#fff', minHeight: '100vh', padding: 20, textAlign: 'center' }}>
      <img
        src="https://i.pravatar.cc/150?img=3"
        alt="avatar"
        style={{ width: 120, height: 120, borderRadius: '50%', marginBottom: 20 }}
      />
      <h2 style={{ color: isDark ? '#fff' : '#000' }}>John Doe</h2>
      <p style={{ color: isDark ? '#ccc' : '#555' }}>johndoe@example.com</p>
      <button onClick={() => alert('Edit profile clicked')}>Edit Profile</button>
    </div>
  );
}
