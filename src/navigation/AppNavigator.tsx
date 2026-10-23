import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../context/AuthContext';
import { layout, spacing } from '../design/tokens';
import { useAppTheme } from '../design/ThemeContext';
import { AccountScreen } from '../screens/AccountScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { CreateInviteScreen } from '../screens/CreateInviteScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { GroupsListScreen } from '../screens/GroupsListScreen';
import { JoinGroupScreen } from '../screens/JoinGroupScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MapScreen } from '../screens/MapScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import type { GroupsStackParamList, MainTabParamList, RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const GroupsStack = createNativeStackNavigator<GroupsStackParamList>();

const TAB_ICONS = {
  Map: { active: 'map', inactive: 'map-outline' },
  Groups: { active: 'account-group', inactive: 'account-group-outline' },
  Account: { active: 'account-circle', inactive: 'account-circle-outline' },
} as const;

function GroupsNavigator() {
  const { colors } = useAppTheme();

  return (
    <GroupsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 17, fontWeight: '600', color: colors.text },
        headerTitleAlign: 'left',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <GroupsStack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={{ headerShown: false }}
      />
      <GroupsStack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'Новая группа', presentation: 'modal' }}
      />
      <GroupsStack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={({ route }) => ({ title: route.params.groupName ?? 'Группа' })}
      />
      <GroupsStack.Screen
        name="CreateInvite"
        component={CreateInviteScreen}
        options={{ title: 'Приглашение' }}
      />
      <GroupsStack.Screen
        name="JoinGroup"
        component={JoinGroupScreen}
        options={{ title: 'Войти по коду', presentation: 'modal' }}
      />
    </GroupsStack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: layout.tabBarHeight + insets.bottom,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.xs,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
        tabBarIcon: ({ color, focused }) => (
          <MaterialCommunityIcons
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            size={24}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Карта' }} />
      <Tab.Screen name="Groups" component={GroupsNavigator} options={{ title: 'Группы' }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Аккаунт' }} />
    </Tab.Navigator>
  );
}

function BootSplash() {
  const { colors } = useAppTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xl,
      }}
    >
      <BrandMark size={72} />
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export const AppNavigator: React.FC = () => {
  const { status } = useAuth();
  const { colors, isDark } = useAppTheme();

  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [isDark, colors]);

  if (status === 'loading') {
    return <BootSplash />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'authenticated' ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
