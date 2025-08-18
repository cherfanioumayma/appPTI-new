import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, USER_ROLES } from '../utils/constants';
import LoginScreen from '../screens/LoginScreen';
import SOSButtonScreen from '../screens/SOSButtonScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AlertHistoryScreen from '../screens/AlertHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// (Colle ici les navigateurs TabWorker et TabSupervisor que tu as déjà écrits)

const AppNavigator = () => {
  const { isAuthenticated, userData, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : userData?.role === USER_ROLES.SUPERVISOR ? (
        <Stack.Screen name="SupervisorTabs" component={SupervisorTabNavigator} />
      ) : (
        <Stack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
