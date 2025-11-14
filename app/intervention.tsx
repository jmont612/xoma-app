import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, ImageBackground, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type RiskLevel = 'high' | 'medium';

interface Skill {
  id: string;
  title: string;
  techniques: string[];
  durationMin: number;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export default function InterventionScreen() {
  const router = useRouter();
  const { risk } = useLocalSearchParams<{ risk?: string }>();

  const riskLevel: RiskLevel = (risk === 'high' || risk === 'medium') ? risk : 'medium';
  const [step, setStep] = useState<number>(0);

  // Habilidades rápidas sugeridas
  const allSkills: Skill[] = [
    { id: 'skill1', title: 'Técnicas disponibles', techniques: ['Un lugar tranquilo', 'Hielos'], durationMin: 5 },
    { id: 'skill2', title: 'Respiración y conexión', techniques: ['Respira 4-7-8', 'Enraíza con 5 sentidos'], durationMin: 5 },
  ];

  const skillsToShow = useMemo(() => {
    return riskLevel === 'high' ? allSkills.slice(0, 1) : allSkills.slice(0, 2);
  }, [riskLevel]);

  // Contactos de emergencia (reutilizable del screen de contactos)
  const emergencyContacts: EmergencyContact[] = [
    { id: '1', name: 'Terapeuta', phone: '+1234567890' },
    { id: '2', name: 'Contacto Principal', phone: '+0987654321' },
    { id: '3', name: 'Contacto Secundario', phone: '+1122334455' }
  ];

  const goNext = () => {
    // Para riesgo alto hay 3 pasos: Intro -> Habilidad -> Contactos
    // Para riesgo medio hay 2 pasos: Intro -> Habilidades
    const maxStep = riskLevel === 'high' ? 2 : 1;
    if (step < maxStep) {
      setStep(step + 1);
    } else {
      router.back();
    }
  };

  const handleStartSkill = (skillId: string) => {
    router.push({ pathname: '/skill-detail', params: { id: skillId } });
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
            <TouchableOpacity onPress={() => router.back()}>
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

        {/* Paso 1: Habilidades */}
        {step === 1 && (
          <View className="px-6">
            {skillsToShow.map((skill, index) => (
              <View key={skill.id} className="bg-white/80 rounded-2xl p-6 mb-6 border border-indigo-100 shadow-sm">
                <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-6">
                  <Text className="text-white font-semibold text-base">
                    {riskLevel === 'high' ? 'Habilidad' : `Habilidad ${index + 1}`}
                  </Text>
                </View>

                <View className="mb-4">
                  {skill.techniques.map((t, i) => (
                    <Text key={i} className="text-indigo-600 mb-1">{t}</Text>
                  ))}
                </View>

                {/* Duración pill */}
                <View className="items-start mb-4">
                  <View className="bg-pink-50 px-4 py-2 rounded-full border border-pink-200 shadow-sm">
                    <Text className="text-indigo-600 text-sm">Duración {skill.durationMin} min.</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleStartSkill(skill.id)}
                  className="bg-indigo-400 rounded-2xl py-3 items-center shadow-sm"
                >
                  <Text className="text-white font-semibold">Comenzar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Paso 2: Contactos (solo riesgo alto) */}
        {step === 2 && riskLevel === 'high' && (
          <View className="px-6">
            <View className="bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-6">
              <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-6">
                <Text className="text-white font-semibold text-base">Contactos de Emergencia</Text>
              </View>

              {emergencyContacts.map((contact) => (
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
              ))}
            </View>
          </View>
        )}

        {/* Espaciado inferior */}
        <View className="h-8" />
      </ScrollView>
    </ImageBackground>
  );
}