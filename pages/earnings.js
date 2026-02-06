import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const earningsData = [
  { id: '1', task: 'Complete survey', amount: 5 },
  { id: '2', task: 'Play mini-game', amount: 3 },
  { id: '3', task: 'Invite a friend', amount: 10 },
];

const Earnings = () => {
  const { isDark } = useTheme();

  const renderItem = ({ item }) => (
    <View style={[styles.item, { backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2' }]}>
      <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 16 }}>{item.task}</Text>
      <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 16 }}>${item.amount}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Earnings</Text>
      <FlatList
        data={earningsData}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  }
});

export default Earnings;
