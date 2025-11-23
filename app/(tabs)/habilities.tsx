import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, ImageSourcePropType, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { get } from '../lib/api';

interface SkillCard {
  id: string;
  title: string;
  icon: ImageSourcePropType;
  description: string;
}

function mapIconById(id: number): ImageSourcePropType {
  if (id === 1) return require('../../assets/images/icons/temperature-icon.png');
  if (id === 2) return require('../../assets/images/icons/intense-icon.png');
  return require('../../assets/images/icons/breath-icon.png');
}

function mapRouteIdById(id: number): string {
  if (id === 1) return 'temperature';
  if (id === 2) return 'exercise';
  return 'breathing';
}

function mapDescriptionById(id: number): string {
  if (id === 1) return 'Refresca el cuerpo para calmar la intensidad emocional.';
  if (id === 2) return 'Activa tu energía con movimiento físico breve.';
  return 'Inhala y reten el oxigeno por unos segundos, luego exhala.';
}

export default function HabilitiesScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<{ id: number; name: string; subSkills: { id: number; name: string }[] }[]>([]);

  const handleVerMas = (skillId: string) => {
    router.push(`/skill-detail?skillId=${skillId}`);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await get<{ data: { id: number; name: string; deletedAt: any; subSkills: { id: number; name: string; deletedAt: any }[] }[] }>(
          '/skills'
        );
        setSkills(res.data || []);
      } catch (e: any) {
        setError(e?.message || 'No se pudo cargar habilidades');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

        <View className="px-6 pb-8">
          {loading && (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="text-indigo-600 mt-3">Cargando habilidades…</Text>
            </View>
          )}
          {error && !loading && (
            <View className="bg-white rounded-2xl p-6 border border-red-200">
              <Text className="text-red-600">{error}</Text>
            </View>
          )}
          {!loading && !error && skills.map((s) => {
            const routeId = mapRouteIdById(s.id);
            const card: SkillCard = {
              id: routeId,
              title: s.name,
              icon: mapIconById(s.id),
              description: mapDescriptionById(s.id),
            };
            return (
            <View
              key={card.id}
              className="bg-white/100 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-4"
            >
              {/* Centered icon */}
              <View className="items-center mb-4">
                <View className="w-20 h-20 rounded-full bg-white items-center justify-center shadow-sm">
                  <Image
                    source={card.icon}
                    resizeMode="contain"
                    className="w-12 h-12"
                  />
                </View>
              </View>

              {/* Title */}
              <Text className="text-xl font-semibold text-indigo-700 text-center mb-1">
                {card.title}
              </Text>

              {/* Description */}
              <Text className="text-indigo-500 text-center mb-6 leading-6">
                {card.description}
              </Text>

              {/* Ver más button */}
              <TouchableOpacity
                onPress={() => handleVerMas(card.id)}
                className="bg-indigo-400 rounded-xl py-3 items-center shadow-sm w-full"
              >
                <Text className="text-white font-semibold text-base">
                  Ver más
                </Text>
              </TouchableOpacity>
            </View>
            );
          })}
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </ImageBackground>
  );
}