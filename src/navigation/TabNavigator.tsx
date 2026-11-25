import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { useAppTheme } from '../context/ThemeContext';

import DashboardScreen from '../screens/DashboardScreen';
import InventoriesScreen from '../screens/InventoriesScreen';
import StockOutScreen from '../screens/StockOutScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { theme, isDark } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.navContainer, { backgroundColor: theme.colors.headerBg }]}
      edges={['top']}
    >
      <Tab.Navigator
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.tabBarActive,
          tabBarInactiveTintColor: theme.colors.tabBarInactive,
          sceneStyle: { backgroundColor: theme.colors.background },
          tabBarStyle: {
            backgroundColor: theme.colors.tabBarBg,
            borderTopColor: theme.colors.tabBarBorder,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="dashboard" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Inventories"
          component={InventoriesScreen}
          options={{
            tabBarLabel: 'Inventory',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="layers" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="StockOut"
          component={StockOutScreen}
          options={{
            tabBarLabel: 'Stock Out',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="scale" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{
            tabBarLabel: 'Reports',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="analytics" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="person" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flex: 1,
    backgroundColor: '#166534',
  },
});
