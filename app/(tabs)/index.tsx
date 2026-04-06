import { View, Text, StyleSheet } from 'react-native';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Builder Platform</Text>
      <Text style={styles.subtitle}>Your app is running! 🚀</Text>
      <Text style={styles.text}>Install dependencies and restart to see full features</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#6366f1', marginBottom: 20 },
  text: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
