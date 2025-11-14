import { router } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, ImageSourcePropType, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface SkillCard {
  id: string;
  title: string;
  icon: ImageSourcePropType;
  description: string;
}

const tipSkills: SkillCard[] = [
  {
    id: 'temperature',
    title: 'Temperatura (T)',
    icon: require('../../assets/images/icons/temperature-icon.png'),
    description: 'Refresca el cuerpo para calmar la intensidad emocional.'
  },
  {
    id: 'exercise',
    title: 'Ejercicio intenso (I)',
    icon: require('../../assets/images/icons/intense-icon.png'),
    description: 'Activa tu energía con movimiento físico breve.'
  },
  {
    id: 'breathing',
    title: 'Respiración',
    icon: require('../../assets/images/icons/breath-icon.png'),
    description: 'Inhala y reten el oxigeno por unos segundos, luego exhala.'
  }
];

export default function HabilitiesScreen() {
  const handleVerMas = (skillId: string) => {
    router.push(`/skill-detail?skillId=${skillId}`);
  };

  return (
    <ImageBackground
      source={require('../../assets/images/background/bg3.png')}
      resizeMode="cover"
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header over pastel background */}
        <View className="px-6 pt-16 pb-6">
          <View className="items-center">
            <Text className="text-3xl font-bold text-indigo-700 mb-2">
              Habilidades
            </Text>
            <Text className="text-indigo-600 text-center leading-6">
              Usa estas técnicas para regular emociones intensas en momentos de crisis.
            </Text>
          </View>
        </View>

        {/* Skills Cards */}
        <View className="px-6 pb-8">
          {tipSkills.map((skill) => (
            <View
              key={skill.id}
              className="bg-white/100 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-4"
            >
              {/* Centered icon */}
              <View className="items-center mb-4">
                <View className="w-20 h-20 rounded-full bg-white items-center justify-center shadow-sm">
                  <Image
                    source={skill.icon}
                    resizeMode="contain"
                    className="w-12 h-12"
                  />
                </View>
              </View>

              {/* Title */}
              <Text className="text-xl font-semibold text-indigo-700 text-center mb-1">
                {skill.title}
              </Text>

              {/* Description */}
              <Text className="text-indigo-500 text-center mb-6 leading-6">
                {skill.description}
              </Text>

              {/* Ver más button */}
              <TouchableOpacity
                onPress={() => handleVerMas(skill.id)}
                className="bg-indigo-400 rounded-xl py-3 items-center shadow-sm w-full"
              >
                <Text className="text-white font-semibold text-base">
                  Ver más
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </ImageBackground>
  );
}