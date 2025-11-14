import React from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

interface Technique {
  id: string;
  title: string;
  description?: string;
}

const skillData = {
  temperature: {
    title: 'Temperatura (T)',
    emoji: '❄️',
    description: 'Refresca tu cuerpo para calmar la intensidad emocional.',
    color: 'bg-blue-100',
    techniques: [
      { id: 'facial-immersion', title: 'Inmersión facial en agua fría' },
      { id: 'cold-compress', title: 'Compresas frías en rostro/cuello' },
      { id: 'cold-object', title: 'Sostener un objeto frío en las manos' },
      { id: 'cold-hands', title: 'Lavado de manos con agua fría' },
      { id: 'cold-shower', title: 'Duchas frías breves' }
    ]
  },
  exercise: {
    title: 'Ejercicio Intenso (I)',
    emoji: '🏃',
    description: 'Activa tu energía con movimiento físico breve.',
    color: 'bg-orange-100',
    techniques: [
      { id: 'jump-rope', title: 'Saltos de cuerda' },
      { id: 'jumping-jacks', title: 'Jumping jacks (saltos estrella)' },
      { id: 'running-place', title: 'Correr en el lugar' },
      { id: 'squats', title: 'Sentadillas rápidas' },
      { id: 'pushups', title: 'Flexiones o plancha corta' }
    ]
  },
  breathing: {
    title: 'Respiración/Relajación (P)',
    emoji: '🌬️',
    description: 'Respira o relaja tu cuerpo para recuperar el control.',
    color: 'bg-green-100',
    techniques: [
      { id: 'diaphragmatic', title: 'Respiración diafragmática (4-6)' },
      { id: 'box-breathing', title: 'Respiración cuadrada (box breathing)' },
      { id: 'progressive-relaxation', title: 'Relajación muscular progresiva (cuerpo por secciones)' },
      { id: 'visualization', title: 'Respiración con visualización (imaginar calma)' },
      { id: 'body-scan', title: 'Escaneo corporal breve (body scan)' }
    ]
  }
};

export default function SkillDetailScreen() {
  const { skillId } = useLocalSearchParams<{ skillId: string }>();
  
  const skill = skillData[skillId as keyof typeof skillData];
  
  if (!skill) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-xl text-gray-600">Habilidad no encontrada</Text>
      </View>
    );
  }

  const handleGoBack = () => {
    router.back();
  };

  const handleTechniquePress = (techniqueId: string) => {
    // TODO: Navigate to technique detail or implementation
    console.log(`Técnica seleccionada: ${techniqueId}`);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white px-6 pt-16 pb-8 shadow-sm">
          {/* Back button */}
          <TouchableOpacity
            onPress={handleGoBack}
            className="mb-4 flex-row items-center"
          >
            <Text className="text-blue-600 text-lg font-semibold">← Volver</Text>
          </TouchableOpacity>

          {/* Skill info */}
          <View className="items-center">
            <View className={`w-20 h-20 ${skill.color} rounded-full items-center justify-center mb-4`}>
              <Text className="text-4xl">{skill.emoji}</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              {skill.title}
            </Text>
            <Text className="text-gray-600 text-center leading-6">
              {skill.description}
            </Text>
          </View>
        </View>

        {/* Techniques List */}
        <View className="px-6 py-8">
          <Text className="text-xl font-bold text-gray-800 mb-6">
            Técnicas disponibles:
          </Text>
          
          <View className="space-y-4">
            {skill.techniques.map((technique, index) => (
              <TouchableOpacity
                key={technique.id}
                onPress={() => handleTechniquePress(technique.id)}
                className="bg-white rounded-2xl p-6 shadow-sm flex-row items-center"
              >
                {/* Number indicator */}
                <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-4">
                  <Text className="text-white font-bold text-base">
                    {index + 1}
                  </Text>
                </View>
                
                {/* Technique info */}
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-800 mb-1">
                    {technique.title}
                  </Text>
                  {technique.description && (
                    <Text className="text-gray-600 text-sm">
                      {technique.description}
                    </Text>
                  )}
                </View>

                {/* Arrow indicator */}
                <Text className="text-gray-400 text-xl">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}