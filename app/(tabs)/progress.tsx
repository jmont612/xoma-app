import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function ProgressScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white px-6 pt-16 pb-8 shadow-sm">
          <View className="items-center">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              📊 Progreso
            </Text>
            <Text className="text-gray-600 text-center">
              Visualiza tu evolución emocional a lo largo del tiempo
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 py-8">
          <View className="bg-white rounded-2xl p-8 shadow-sm items-center">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
              <Text className="text-3xl">📈</Text>
            </View>
            <Text className="text-xl font-semibold text-gray-800 mb-2">
              Próximamente
            </Text>
            <Text className="text-gray-600 text-center">
              Aquí podrás ver gráficos detallados de tu progreso emocional, 
              tendencias semanales y análisis de patrones.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}