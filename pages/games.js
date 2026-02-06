import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const gamesData = [
  { id: '1', title: 'Puzzle Quest' },
  { id: '2', title: 'Word Hunter' },
  { id: '3', title: 'Trivia Master' },
];

const Games = ({ navigation }) => {
  const { isDark } = useTheme();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2' }]}
      onPress={() => navigation.navigate('GameDetails', { gameId: item.id })}
    >
      <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 18 }}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Games</Text>
      <FlatList
        data={gamesData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20
  },
  item: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 15
  }
});

export default Games;
