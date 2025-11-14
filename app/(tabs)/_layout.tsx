import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#bfdbfe', // blue-200 para línea superior suave
          height: 88,
          paddingBottom: 12,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#374151', // gray-700
        tabBarInactiveTintColor: '#6b7280', // gray-500
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => (
            <View className={`w-12 h-12 rounded-full ${focused ? 'bg-violet-400' : 'bg-violet-300'} items-center justify-center`}>
              <Image
                source={require('../../assets/images/home.png')}
                resizeMode="contain"
                style={{ width: 26, height: 26 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diario',
          tabBarIcon: ({ focused }) => (
            <View className={`w-12 h-12 rounded-full ${focused ? 'bg-violet-400' : 'bg-violet-300'} items-center justify-center`}>
              <Image
                source={require('../../assets/images/diary.png')}
                resizeMode="contain"
                style={{ width: 26, height: 26 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="habilities"
        options={{
          title: 'Habilidades',
          tabBarIcon: ({ focused }) => (
            <View className={`w-12 h-12 rounded-full ${focused ? 'bg-violet-400' : 'bg-violet-300'} items-center justify-center`}>
              <Image
                source={require('../../assets/images/habilities.png')}
                resizeMode="contain"
                style={{ width: 26, height: 26 }}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <View className={`w-12 h-12 rounded-full ${focused ? 'bg-violet-400' : 'bg-violet-300'} items-center justify-center`}>
              <Image
                source={require('../../assets/images/perfil.png')}
                resizeMode="contain"
                style={{ width: 26, height: 26 }}
              />
            </View>
          ),
        }}
      />
    </Tabs>
    </SafeAreaView>
  );
}