import { Tabs } from 'expo-router';

import { BookIcon, CalendarIcon, HomeIcon, UserIcon } from '@/components/icons/Icon';
import { colors, fontFamily } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSoft,
          height: 84,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.textSemiBold,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', tabBarIcon: ({ color }) => <HomeIcon color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendrier', tabBarIcon: ({ color }) => <CalendarIcon color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'Cours', tabBarIcon: ({ color }) => <BookIcon color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color }) => <UserIcon color={color} size={20} /> }}
      />
    </Tabs>
  );
}
