import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../lib/theme';

function TabIcon({ name }) {
  const icons = { '知识库': '📚', '搜索': '🔍', '数据': '📤' };
  return <Text style={{ fontSize: 22 }}>{icons[name] || '📄'}</Text>;
}

export default function Layout() {
  const T = useTheme();
  return (
    <Tabs
      initialRouteName="library"
      screenOptions={{
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textSecondary,
        tabBarStyle: { backgroundColor: T.tabBg, borderTopColor: T.tabBorder },
        headerStyle: { backgroundColor: T.bg },
        headerTintColor: T.text,
        headerTitleStyle: { fontWeight: '600' },
      }}>
      <Tabs.Screen name="library" options={{ title: 'Maze', tabBarIcon: (p) => <TabIcon name="知识库" {...p} /> }} />
      <Tabs.Screen name="search" options={{ title: '搜索', tabBarIcon: (p) => <TabIcon name="搜索" {...p} /> }} />
      <Tabs.Screen name="profile" options={{ title: '数据', tabBarIcon: (p) => <TabIcon name="数据" {...p} /> }} />
      <Tabs.Screen name="detail" options={{ href: null, title: '详情' }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
