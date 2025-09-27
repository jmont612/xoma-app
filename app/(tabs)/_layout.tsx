import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-6 h-6 rounded-full ${focused ? 'bg-blue-600' : 'bg-gray-400'} items-center justify-center`}>
              <Text className="text-white text-xs font-bold">🏠</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Ficha',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-6 h-6 rounded-full ${focused ? 'bg-blue-600' : 'bg-gray-400'} items-center justify-center`}>
              <Text className="text-white text-xs font-bold">📋</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'DBT',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-6 h-6 rounded-full ${focused ? 'bg-blue-600' : 'bg-gray-400'} items-center justify-center`}>
              <Text className="text-white text-xs font-bold">🧠</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View className={`w-6 h-6 rounded-full ${focused ? 'bg-blue-600' : 'bg-gray-400'} items-center justify-center`}>
              <Text className="text-white text-xs font-bold">👤</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}