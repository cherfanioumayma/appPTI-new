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
import RegisterScreen from '../screens/RegisterScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
const Tab = createBottomTabNavigator(); // <-- AJOUTE cette ligne ici
// Exemple de TabNavigator pour les workers
const WorkerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'SOS') iconName = 'alert-circle';
        else if (route.name === 'Historique') iconName = 'time';
        else if (route.name === 'Paramètres') iconName = 'settings';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="SOS" component={SOSButtonScreen} />
    <Tab.Screen name="Historique" component={AlertHistoryScreen} />
    <Tab.Screen name="Paramètres" component={SettingsScreen} />
  </Tab.Navigator>
);

// Exemple de TabNavigator pour les superviseurs
const SupervisorTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Tableau de bord') iconName = 'home';
        else if (route.name === 'Suivi') iconName = 'map';
        else if (route.name === 'Paramètres') iconName = 'settings';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Tableau de bord" component={DashboardScreen} />
    <Tab.Screen name="Suivi" component={LiveTrackingScreen} />
    <Tab.Screen name="Paramètres" component={SettingsScreen} />
  </Tab.Navigator>
);

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, userData, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : userData?.role === USER_ROLES.SUPERVISOR ? (
        <Stack.Screen name="SupervisorTabs" component={SupervisorTabNavigator} />
      ) : (
        <Stack.Screen name="WorkerTabs" component={WorkerTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;