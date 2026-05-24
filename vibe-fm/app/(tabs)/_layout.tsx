import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/tokens';
import VibeFMLogo from '../../src/components/VibeFMLogo';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <VibeFMLogo size="md" />,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.5, fontWeight: '600' },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Capture',
          tabBarIcon: ({ color, size }) => <Ionicons name="mic-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="trending" 
        options={{ 
          title: 'Trending',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="matchmaking" 
        options={{ 
          title: 'Match',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="history" 
        options={{ 
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />
        }} 
      />
    </Tabs>
  );
}
