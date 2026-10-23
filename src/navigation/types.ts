import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

/** Screens inside the "Группы" tab. */
export type GroupsStackParamList = {
  GroupsList: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId: string; groupName?: string };
  CreateInvite: { groupId: string; groupName?: string };
  JoinGroup: { code?: string } | undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Groups: NavigatorScreenParams<GroupsStackParamList> | undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
export type GroupsNavigation = NativeStackNavigationProp<GroupsStackParamList>;
export type TabNavigation = BottomTabNavigationProp<MainTabParamList>;

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
export type GroupsScreenProps<T extends keyof GroupsStackParamList> = NativeStackScreenProps<
  GroupsStackParamList,
  T
>;
export type TabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;
