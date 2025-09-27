import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white px-6 pt-16 pb-8 shadow-sm">
          <View className="items-center">
            <View className="w-20 h-20 bg-blue-600 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">U</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800 mb-1">
              Usuario
            </Text>
            <Text className="text-gray-600">
              usuario@ejemplo.com
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 py-8 space-y-4">
          {/* Profile Options */}
          <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <TouchableOpacity className="px-6 py-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-lg mr-3">⚙️</Text>
                  <Text className="text-gray-800 font-medium">Configuración</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="px-6 py-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-lg mr-3">🔔</Text>
                  <Text className="text-gray-800 font-medium">Notificaciones</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="px-6 py-4 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-lg mr-3">📊</Text>
                  <Text className="text-gray-800 font-medium">Estadísticas</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="px-6 py-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-lg mr-3">❓</Text>
                  <Text className="text-gray-800 font-medium">Ayuda</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
            <View className="flex-row items-center justify-center">
              <Text className="text-lg mr-3">🚪</Text>
              <Text className="text-red-600 font-medium">Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}