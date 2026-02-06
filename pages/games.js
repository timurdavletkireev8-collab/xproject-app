import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

const gamesData = [
  { id: '1', title: 'Puzzle Quest' },
  { id: '2', title: 'Word Hunter' },
  { id: '3', title: 'Trivia Master' },
];

export default function Games() {
  const { isDark } = useTheme();

  return (
    <div style={{ backgroundColor: isDark ? '#121212' : '#fff', minHeight: '100vh', padding: 20 }}>
      <h1 style={{ color: isDark ? '#fff' : '#000' }}>Games</h1>
      {gamesData.map(game => (
        <div
          key={game.id}
          style={{
            padding: 15,
            borderRadius: 10,
            marginBottom: 15,
            backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2',
            cursor: 'pointer'
          }}
          onClick={() => alert(`Open game ${game.title}`)}
        >
          <span style={{ color: isDark ? '#fff' : '#000', fontSize: 18 }}>{game.title}</span>
        </div>
      ))}
    </div>
  );
}
