import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { MapScreen } from '../screens/MapScreen';
import { GroupsListScreen } from '../screens/GroupsListScreen';
import { CreateGroupScreen } from '../screens/CreateGroupScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { JoinGroupScreen } from '../screens/JoinGroupScreen';
import { CreateInviteScreen } from '../screens/CreateInviteScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const GroupsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="GroupsList" component={GroupsListScreen} options={{ title: 'Группы' }} />
    <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Создать группу' }} />
    <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Группа' }} />
    <Stack.Screen name="CreateInvite" component={CreateInviteScreen} options={{ title: 'Пригласить' }} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Карта' }} />
    <Tab.Screen name="Groups" component={GroupsStack} options={{ title: 'Группы', headerShown: false }} />
    <Tab.Screen name="Join" component={JoinGroupScreen} options={{ title: 'Присоединиться' }} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};