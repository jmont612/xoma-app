import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { get } from './lib/api';

function routeIdToNumber(id?: string): number {
  if (!id) return 0;
  if (id === 'temperature') return 1;
  if (id === 'exercise') return 2;
  if (id === 'breathing') return 3;
  const asNum = Number(id);
  return Number.isFinite(asNum) ? asNum : 0;
}

function numberToEmoji(n: number): string {
  if (n === 1) return '❄️';
  if (n === 2) return '🏃';
  return '🌬️';
}

function numberToColor(n: number): string {
  if (n === 1) return 'bg-blue-100';
  if (n === 2) return 'bg-orange-100';
  return 'bg-green-100';
}

function numberToDescription(n: number): string {
  if (n === 1) return 'Refresca tu cuerpo para calmar la intensidad emocional.';
  if (n === 2) return 'Activa tu energía con movimiento físico breve.';
  return 'Respira o relaja tu cuerpo para recuperar el control.';
}

export default function SkillDetailScreen() {
  const { skillId } = useLocalSearchParams<{ skillId: string }>();
  const skillIdNum = routeIdToNumber(skillId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillName, setSkillName] = useState<string>('');
  const [subSkills, setSubSkills] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await get<{ data: { id: number; name: string; deletedAt: any; subSkills: { id: number; name: string; deletedAt: any }[] }[] }>(
          '/skills'
        );
        const list = res.data || [];
        const found = list.find((s) => s.id === skillIdNum);
        if (!found) {
          setError('Habilidad no encontrada');
        } else {
          setSkillName(found.name);
          setSubSkills(found.subSkills.map(ss => ({ id: ss.id, name: ss.name })));
        }
      } catch (e: any) {
        setError(e?.message || 'No se pudo cargar la habilidad');
      } finally {
        setLoading(false);
      }
    })();
  }, [skillIdNum]);

  const handleGoBack = () => {
    router.back();
  };

  const handleTechniquePress = (techniqueId: string | number) => {
    router.push(`/sub-skill?subSkillId=${techniqueId}`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-indigo-600 mt-3">Cargando habilidad…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-xl text-red-600">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-8">
          <TouchableOpacity
            onPress={handleGoBack}
            className="mb-4 flex-row items-center"
          >
            <Text className="text-indigo-600 text-lg">← Volver</Text>
          </TouchableOpacity>

          <View className="items-center mb-6">
            <View className={`w-20 h-20 ${numberToColor(skillIdNum)} rounded-full items-center justify-center mb-4 border border-indigo-100 bg-white/70`}>
              <Text className="text-4xl">{numberToEmoji(skillIdNum)}</Text>
            </View>
            <Text className="text-3xl font-bold text-indigo-700 mb-2">
              {skillName}
            </Text>
            <Text className="text-indigo-500 text-center leading-6">
              {numberToDescription(skillIdNum)}
            </Text>
          </View>
        </View>

        <View className="px-6 py-0">
          <View className="bg-white/0 rounded-2xl p-6 mb-4">
            <Text className="text-indigo-700 text-lg font-semibold mb-4">
              Técnicas disponibles:
            </Text>
            <View style={{ gap: 12 }}>
              {subSkills.map((technique, index) => (
                <TouchableOpacity
                  key={technique.id}
                  onPress={() => handleTechniquePress(technique.id)}
                  className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm flex-row items-center"
                >
                  <View className="w-10 h-10 bg-indigo-600 rounded-full items-center justify-center mr-4">
                    <Text className="text-white font-bold text-base">
                      {index + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-indigo-700">
                      {technique.name}
                    </Text>
                  </View>
                  <Text className="text-indigo-400 text-xl">→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}