import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const referralsData = [
  { id: '1', name: 'Alice', reward: 5 },
  { id: '2', name: 'Bob', reward: 10 },
];

const Referrals = () => {
  const { isDark } = useTheme();
  const [code, setCode] = useState('');

  const handleInvite = () => {
    alert(`Referral code ${code} shared!`);
    setCode('');
  };

  const renderItem = ({ item }) => (
    <View style={[styles.item, { backgroundColor: isDark ? '#1e1e1e' : '#f2f2f2' }]}>
      <Text style={{ color: isDark ? '#fff' : '#000' }}>{item.name}</Text>
      <Text style={{ color: isDark ? '#fff' : '#000' }}>${item.reward}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>Referrals</Text>
      <TextInput
        placeholder="Enter referral code"
        placeholderTextColor={isDark ? '#aaa' : '#555'}
        style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#fff' : '#000' }]}
        value={code}
        onChangeText={setCode}
      />
      <Button title="Invite" onPress={handleInvite} />
      <FlatList
        data={referralsData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ marginTop: 20 }}
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  }
});

export default Referrals;
