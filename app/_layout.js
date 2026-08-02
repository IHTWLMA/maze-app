import { useEffect } from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../lib/theme';
import { startAutoSync } from '../lib/db';

function TabIcon({ name }) {
  const icons = { '首页': '💡', '知识库': '📚', '搜索': '🔍', '我的': '📤' };
  return <Text style={{ fontSize: 22 }}>{icons[name] || '📄'}</Text>;
}

export default function Layout() {
  const T = useTheme();
  useEffect(() => { startAutoSync(); }, []);
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: T.primary, tabBarInactiveTintColor: T.textSecondary,
      tabBarStyle: { backgroundColor: T.tabBg, borderTopColor: T.tabBorder },
      headerStyle: { backgroundColor: T.bg }, headerTintColor: T.text,
      headerTitleStyle: { fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Maze', tabBarIcon: (p) => <TabIcon name="首页" {...p} /> }} />
      <Tabs.Screen name="library" options={{ title: '知识库', tabBarIcon: (p) => <TabIcon name="知识库" {...p} /> }} />
      <Tabs.Screen name="search" options={{ title: '搜索', tabBarIcon: (p) => <TabIcon name="搜索" {...p} /> }} />
      <Tabs.Screen name="profile" options={{ title: '我的', tabBarIcon: (p) => <TabIcon name="我的" {...p} /> }} />
    </Tabs>
  );
}
