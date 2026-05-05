import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { get } from './lib/api';
import { loadUser } from './lib/storage';

type RiskLevel = 'high' | 'medium';

interface SubSkillItem {
  id: number;
  name: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export default function InterventionScreen() {
  const router = useRouter();
  const { risk, data } = useLocalSearchParams<{ risk?: string; data?: string }>();

  const riskLevel: RiskLevel = (risk === 'high' || risk === 'medium') ? risk : 'medium';
  const responseData = useMemo(() => {
    try {
      return data ? JSON.parse(decodeURIComponent(data)) : null;
    } catch {
      return null;
    }
  }, [data]);
  const [step, setStep] = useState<number>(0);

  // Habilidades rápidas sugeridas
  const normalizedSubSkills = useMemo<SubSkillItem[]>(() => {
    const raw = (responseData?.data?.recommendedSubSkills || responseData?.recommendedSubSkills || responseData?.data?.subSkills || responseData?.subSkills || []) as any[];
    if (!Array.isArray(raw) || raw.length === 0) return [];
    const result: SubSkillItem[] = [];
    for (const it of raw) {
      const id = typeof it === 'number' ? it : Number(it?.id);
      const name = typeof it === 'string' ? it : (it?.name || 'Sub habilidad');
      if (Number.isFinite(id) && id > 0) {
        if (!result.find(r => r.id === id)) result.push({ id, name });
      }
    }
    return result;
  }, [responseData]);

  const subSkillsToShow = useMemo(() => {
    const base = normalizedSubSkills;
    return riskLevel === 'high' ? base.slice(0, 1) : base;
  }, [riskLevel, normalizedSubSkills]);

  // Contactos de emergencia provenientes de la respuesta de EMA
  const emergencyContacts = useMemo<EmergencyContact[]>(() => {
    const raw = (responseData?.data?.emergencyContacts || (responseData as any)?.emergencyContacts || []) as any[];
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const out: EmergencyContact[] = [];
    for (const c of raw) {
      const id = String(c?.id ?? Math.random());
      const firstName = String(c?.firstName ?? '').trim();
      const lastName = String(c?.lastName ?? '').trim();
      const name = [firstName, lastName].filter(Boolean).join(' ') || 'Contacto';
      const phone = String(c?.phoneNumber ?? c?.phone ?? '').trim();
      const dedupeKey = `${name}|${phone}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        out.push({ id, name, phone });
      }
    }
    return out;
  }, [responseData]);

  const [contactsState, setContactsState] = useState<EmergencyContact[]>([]);
  useEffect(() => { setContactsState(emergencyContacts); }, [emergencyContacts]);
  useEffect(() => {
    const fetchFallback = async () => {
      try {
        if (riskLevel !== 'high') return;
        if (contactsState.length > 0) return;
        const me = await loadUser<any>();
        const res = await get<{ data: any[] }>(`/emergency-contacts/user/${me?.id ?? me?.userId ?? 0}`);
        const arr = Array.isArray(res?.data) ? res!.data! : [];
        const out: EmergencyContact[] = arr.map((c: any) => ({
          id: String(c?.id ?? Math.random()),
          name: [String(c?.firstName ?? '').trim(), String(c?.lastName ?? '').trim()].filter(Boolean).join(' ') || 'Contacto',
          phone: String(c?.phoneNumber ?? c?.phone ?? '').trim()
        }));
        if (out.length > 0) setContactsState(out);
      } catch {}
    };
    fetchFallback();
  }, [riskLevel, contactsState.length]);

  const goNext = () => {
    const maxStep = 1;
    if (step < maxStep) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleStartSubSkill = (subSkillId: number) => {
    router.push({ pathname: '/sub-skill', params: { subSkillId: String(subSkillId) } });
  };

  const handleCall = async (phone: string) => {
    const url = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) Linking.openURL(url);
  };

  const handleWhatsapp = async (phone: string) => {
    const url = `whatsapp://send?phone=${phone}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) Linking.openURL(url);
  };

  return (
    <ImageBackground 
      source={require('../assets/images/background/bg4.png')}
      resizeMode="cover"
      style={{ flex: 1 }}
      imageStyle={{ opacity: 1 }}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-4">
          <View className="flex-row items-center justify-between">
            <View />
            <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
              <Text className="text-white font-medium">Saltar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Paso 0: Intro (botón anclado abajo con margen) */}
        {step === 0 && (
          <View className="px-6 pb-8 flex-1">
            <View className="items-center flex-1 justify-center">
              <Text className="text-white text-center text-base font-medium px-4 mb-4">
                Identificamos signos de malestar emocional. Aquí tienes una habilidad rápida para
                ayudarte a recuperar el control.
              </Text>

              <Image
                source={require('../assets/images/person-meditation.png')}
                style={{ width: 280, height: 280, resizeMode: 'contain' }}
              />
            </View>

            <TouchableOpacity
              onPress={goNext}
              className="bg-indigo-400 rounded-2xl py-4 mt-auto shadow-sm active:bg-indigo-500"
            >
              <Text className="text-white text-center font-semibold text-lg">Siguiente</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 1 && (
          <View className="px-6">
            {subSkillsToShow.map((sub, index) => (
              <View key={sub.id} className="bg-white/80 rounded-2xl p-6 mb-6 border border-indigo-100 shadow-sm">
                <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-6">
                  <Text className="text-white font-semibold text-base">
                    {riskLevel === 'high' ? 'Sub habilidad' : `Sub habilidad ${index + 1}`}
                  </Text>
                </View>
                <View className="mb-4">
                  <Text className="text-indigo-700 font-semibold">{sub.name}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleStartSubSkill(sub.id)}
                  className="bg-indigo-400 rounded-2xl py-3 items-center shadow-sm"
                >
                  <Text className="text-white font-semibold">Comenzar</Text>
                </TouchableOpacity>
              </View>
            ))}

            {riskLevel === 'high' && (
              <View className="bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-6">
                <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-6">
                  <Text className="text-white font-semibold text-base">Contactos de Emergencia</Text>
                </View>

                {contactsState.length === 0 ? (
                  <Text className="text-indigo-600">Aún no hay un contacto registrado</Text>
                ) : (
                  contactsState.map((contact) => (
                    <View key={contact.id} className="bg-yellow-50 rounded-2xl p-4 mb-3 border border-yellow-200 shadow-sm">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-indigo-700 font-medium">{contact.name}</Text>
                        <View className="flex-row items-center">
                          <TouchableOpacity onPress={() => handleCall(contact.phone)} className="mr-4">
                            <Ionicons name="call" size={20} color="#6b7280" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleWhatsapp(contact.phone)}>
                            <Ionicons name="logo-whatsapp" size={20} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* Espaciado inferior */}
        <View className="h-8" />
      </ScrollView>
    </ImageBackground>
  );
}