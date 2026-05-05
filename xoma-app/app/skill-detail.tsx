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

function numberToDescription(n: number): string {
  if (n === 1) return 'Refresca tu cuerpo para calmar la intensidad emocional.';
  if (n === 2) return 'Activa tu energía con movimiento físico breve.';
  return 'Respira o relaja tu cuerpo para recuperar el control.';
}

function pickTechniqueIcon(name: string, used: Set<string>, fallbackPool: string[]): string {
  const n = String(name || '').toLowerCase();
  const preferred: string[] = [];

  if (n.includes('diafrag')) preferred.push('🫁');
  if (n.includes('cuadr')) preferred.push('⬛');
  if (n.includes('muscul')) preferred.push('💪');
  if (n.includes('visual')) preferred.push('👁️');
  if (n.includes('escaneo') || n.includes('corporal') || n.includes('cuerpo')) preferred.push('🧍');
  if (n.includes('mindful') || n.includes('atención plena')) preferred.push('🧘');
  if (n.includes('respira') || n.includes('inhal') || n.includes('exhal')) preferred.push('🌬️');

  if (n.includes('frío') || n.includes('frio') || n.includes('hielo')) preferred.push('🧊');
  if (n.includes('temperat') || n.includes('agua')) preferred.push('💧');

  if (n.includes('ejerc') || n.includes('correr') || n.includes('camin')) preferred.push('🏃');
  if (n.includes('salt') || n.includes('burpee') || n.includes('sentad')) preferred.push('🤸');

  const candidates = [...preferred, ...fallbackPool];
  for (const icon of candidates) {
    if (!used.has(icon)) {
      used.add(icon);
      return icon;
    }
  }

  const icon = fallbackPool[0] || '•';
  used.add(icon);
  return icon;
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
      <View className="flex-1 bg-neutral items-center justify-center">
        <ActivityIndicator size="large" color="#2D5A6E" />
        <Text className="text-primary mt-3 font-semibold">Cargando habilidad…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral items-center justify-center px-6">
        <Text className="text-red-600 text-center font-semibold">{error}</Text>
      </View>
    );
  }

  const techniqueCards = (() => {
    const used = new Set<string>();
    const fallbackPool =
      skillIdNum === 1
        ? ['❄️', '🧊', '💧', '🫧', '🌡️', '🧴', '🧼', '🧽']
        : skillIdNum === 2
          ? ['🏃', '🤸', '🧗', '🚶', '🏋️', '🥊', '🧎', '⚡']
          : ['🫁', '🌬️', '🧘', '👁️', '💪', '🧍', '🧠', '🌿'];
    return subSkills.map((technique) => ({
      ...technique,
      icon: pickTechniqueIcon(technique.name, used, fallbackPool),
    }));
  })();

  return (
    <View className="flex-1 bg-neutral">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <View className="px-6 pt-14">
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={handleGoBack} className="flex-row items-center h-10">
              <View className="w-10 h-10 items-center justify-center -ml-2 mr-1">
                <Text className="text-primary text-xl" style={{ includeFontPadding: false, lineHeight: 20 }}>←</Text>
              </View>
              <Text className="text-gray-800 font-semibold">The Resilient Sanctuary</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-8">
            <View className="w-24 h-24 rounded-full bg-[#CFF1E2] items-center justify-center mb-5 border border-primary/10">
              <Text className="text-4xl">{numberToEmoji(skillIdNum)}</Text>
            </View>
            <Text className="text-primary text-3xl font-extrabold mb-2 text-center">
              {skillName}
            </Text>
            <Text className="text-gray-500 text-center leading-6">
              {numberToDescription(skillIdNum)}
            </Text>
          </View>
        </View>

        <View className="px-6">
          <View style={{ gap: 16 }}>
            {techniqueCards.map((technique) => (
              <TouchableOpacity
                key={technique.id}
                onPress={() => handleTechniquePress(technique.id)}
                className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 flex-row items-center"
              >
                <View className="w-12 h-12 rounded-full bg-[#DFF4FC] items-center justify-center mr-4">
                  <Text className="text-primary text-lg">{technique.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-extrabold mb-1">{technique.name}</Text>
                  <Text className="text-gray-500 text-xs leading-5">
                    Explora esta técnica para apoyar tu regulación emocional.
                  </Text>
                </View>
                <Text className="text-gray-300 text-2xl">›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-[#EAF5F5] rounded-[32px] h-40 mt-10 overflow-hidden">
            <View className="absolute w-72 h-72 rounded-full bg-[#CFF1E2] -top-44 -left-44 opacity-70" />
            <View className="absolute w-72 h-72 rounded-full bg-[#DFF4FC] -bottom-44 -right-44 opacity-70" />
            <View className="absolute left-6 bottom-6 right-6">
              <Text className="text-white font-extrabold text-base">
                Encuentra tu ritmo natural en{'\n'}este espacio seguro.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
