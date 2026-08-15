import { Tabs } from 'expo-router';
import { ClipboardList, Settings, User } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#22b5d8',
      tabBarInactiveTintColor: '#94a3b8',
      header: () => <AppHeader />,
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e2e8f0',
      }
    }}>
      <Tabs.Screen
        name="missions"
        options={{
          title: 'Missions',
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
