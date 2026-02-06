import React from 'react';
import { View, Text, StyleSheet, Image, Button } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

const Profile = ({ navigation }) => {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <Image
        source={{ uri: 'https://i.pravatar.cc/150?img=3' }}
        style={styles.avatar}
      />
      <Text style={[styles.name, { color: isDark ? '#fff' : '#000' }]}>John Doe</Text>
      <Text style={[styles.email, { color: isDark ? '#ccc' : '#555' }]}>johndoe@example.com</Text>
      <Button title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  email: {
    fontSize: 16,
    marginBottom: 20
  }
});

export default Profile;
