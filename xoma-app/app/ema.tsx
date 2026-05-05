import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { post } from './lib/api';
import { loadUser } from './lib/storage';

type DialogState =
  | { type: 'error' | 'info' | 'success'; title: string; message: string }
  | null;

export default function EvaluacionEmocional() {
  const router = useRouter();
  const [ratings, setRatings] = useState({
    mood: 5,
    stress: 5,
    anxiety: 5,
    impulsivity: 5,
  });
  const [suicidalIdeation, setSuicidalIdeation] = useState<boolean | null>(null);
  const [urgeSelfHarm, setUrgeSelfHarm] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [riskResult, setRiskResult] = useState<'low' | 'medium' | 'high' | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const showDialog = (next: Exclude<DialogState, null>) => {
    setDialog(next);
  };

  const getEmotionalData = (value: number, type: 'mood' | 'stress' | 'impulsivity' | 'anxiety') => {
    const roundedValue = Math.round(value);

    if (type === 'mood') {
      if (roundedValue === 0) return { icon: require('../assets/images/icons/mood-awful.png'), color: '#6B7280', bgColor: 'bg-gray-600' };
      if (roundedValue <= 2) return { icon: require('../assets/images/icons/mood-bad.png'), color: '#DC2626', bgColor: 'bg-red-600' };
      if (roundedValue <= 4) return { icon: require('../assets/images/icons/mood-regular.png'), color: '#EA580C', bgColor: 'bg-orange-600' };
      if (roundedValue <= 6) return { icon: require('../assets/images/icons/mood-good.png'), color: '#CA8A04', bgColor: 'bg-yellow-600' };
      if (roundedValue <= 8) return { icon: require('../assets/images/icons/mood-amazing.png'), color: '#16A34A', bgColor: 'bg-green-600' };
      return { icon: require('../assets/images/icons/mood-amazing.png'), color: '#2563EB', bgColor: 'bg-blue-600' };
    }

    if (type === 'stress') {
      if (roundedValue === 0) return { icon: require('../assets/images/icons/mood-amazing.png'), color: '#16A34A', bgColor: 'bg-green-600' };
      if (roundedValue <= 2) return { icon: require('../assets/images/icons/mood-amazing.png'), color: '#16A34A', bgColor: 'bg-green-600' };
      if (roundedValue <= 4) return { icon: require('../assets/images/icons/mood-regular.png'), color: '#CA8A04', bgColor: 'bg-yellow-600' };
      if (roundedValue <= 6) return { icon: require('../assets/images/icons/mood-bad.png'), color: '#EA580C', bgColor: 'bg-orange-600' };
      if (roundedValue <= 8) return { icon: require('../assets/images/icons/mood-awful.png'), color: '#DC2626', bgColor: 'bg-red-600' };
      return { icon: require('../assets/images/icons/mood-awful.png'), color: '#7C2D12', bgColor: 'bg-red-800' };
    }

    if (type === 'anxiety') {
      if (roundedValue === 0) return { icon: require('../assets/images/icons/mood-amazing.png'), color: '#16A34A', bgColor: 'bg-green-600' };
      if (roundedValue <= 2) return { icon: require('../assets/images/icons/mood-amazing.png'), color: '#16A34A', bgColor: 'bg-green-600' };
      if (roundedValue <= 4) return { icon: require('../assets/images/icons/mood-regular.png'), color: '#CA8A04', bgColor: 'bg-yellow-600' };
      if (roundedValue <= 6) return { icon: require('../assets/images/icons/mood-bad.png'), color: '#EA580C', bgColor: 'bg-orange-600' };
      if (roundedValue <= 8) return { icon: require('../assets/images/icons/mood-awful.png'), color: '#DC2626', bgColor: 'bg-red-600' };
      return { icon: require('../assets/images/icons/mood-awful.png'), color: '#7C2D12', bgColor: 'bg-red-800' };
    }

    if (type === 'impulsivity') {
      if (roundedValue === 0) return { icon: require('../assets/images/icons/mood-good.png'), color: '#16A34A', bgColor: 'bg-green-600' };
      if (roundedValue <= 2) return { icon: require('../assets/images/icons/mood-good.png'), color: '#16A34A', bgColor: 'bg-green-600' };
      if (roundedValue <= 4) return { icon: require('../assets/images/icons/mood-regular.png'), color: '#CA8A04', bgColor: 'bg-yellow-600' };
      if (roundedValue <= 6) return { icon: require('../assets/images/icons/mood-bad.png'), color: '#EA580C', bgColor: 'bg-orange-600' };
      if (roundedValue <= 8) return { icon: require('../assets/images/icons/mood-awful.png'), color: '#DC2626', bgColor: 'bg-red-600' };
      return { icon: require('../assets/images/icons/mood-awful.png'), color: '#7C2D12', bgColor: 'bg-red-800' };
    }

    return { icon: require('../assets/images/icons/mood-regular.png'), color: '#6B7280', bgColor: 'bg-gray-600' };
  };

  const handleRatingChange = (category: 'mood' | 'stress' | 'impulsivity' | 'anxiety', value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSuicidalIdeationResponse = (response: boolean) => {
    setSuicidalIdeation(response);
    if (response) {
      showDialog({
        type: 'info',
        title: 'Apoyo disponible',
        message:
          'Gracias por tu honestidad. Recuerda que no estás solo/a. Te recomendamos contactar a un profesional de la salud mental o a tu red de apoyo.',
      });
    }
  };

  const handleUrgeSelfHarmResponse = (response: boolean) => {
    setUrgeSelfHarm(response);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (suicidalIdeation === null || urgeSelfHarm === null) {
      showDialog({
        type: 'error',
        title: 'Evaluación incompleta',
        message: 'Por favor responde todas las preguntas antes de enviar.',
      });
      return;
    }
    try {
      setIsSaving(true);
      const user = await loadUser<any>();
      const userId = (user?.id ?? user?.userId ?? 1) as number;
      const mood = Math.round(ratings.mood);
      const stress = Math.round(ratings.stress);
      const impulsivity = Math.round(ratings.impulsivity);
      const anxiety = Math.round(ratings.anxiety);
      const payload = {
        userId,
        emaLogs: [
          { emaTypeId: 1, rating: mood },
          { emaTypeId: 2, rating: stress },
          { emaTypeId: 3, rating: impulsivity },
          { emaTypeId: 4, rating: anxiety },
          { emaTypeId: 5, booleanValue: suicidalIdeation === true },
          { emaTypeId: 6, booleanValue: urgeSelfHarm === true },
        ],
      };
      const res = await post<any>('/ema-logs', payload);
      const levelRaw = (res?.data?.riskLevel || res?.riskLevel || res?.data?.level || res?.level || null) as string | null;
      let level: 'low' | 'medium' | 'high' | null = null;
      if (levelRaw === 'low' || levelRaw === 'medium' || levelRaw === 'high') {
        level = levelRaw;
      } else {
        if (suicidalIdeation === true || urgeSelfHarm === true) level = 'high';
        else {
          const highSignals = [stress, anxiety, impulsivity].filter(v => v >= 6).length;
          level = highSignals >= 1 ? 'medium' : 'low';
        }
      }

      if (level === 'low') {
        setRiskResult('low');
      } else if (level === 'medium') {
        router.push({ pathname: '/intervention', params: { risk: 'medium', data: encodeURIComponent(JSON.stringify(res)) } });
      } else {
        router.push({ pathname: '/intervention', params: { risk: 'high', data: encodeURIComponent(JSON.stringify(res)) } });
      }
    } catch (err: any) {
      const friendly =
        err?.code === 'NETWORK_ERROR'
          ? { title: 'Sin conexión', message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.' }
          : { title: 'No se pudo guardar', message: err?.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.' };
      showDialog({ type: 'error', title: friendly.title, message: friendly.message });
    } finally {
      setIsSaving(false);
    }
  };

  const SliderComponent = ({
    title,
    category,
    value,
    labels
  }: {
    title: string;
    category: 'mood' | 'stress' | 'impulsivity' | 'anxiety';
    value: number;
    labels: { left: string; right: string };
  }) => {
    const emotionalData = getEmotionalData(value, category);
    
    return (
      <View className="bg-white rounded-[28px] p-5 mb-5 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-500 text-[11px] font-bold tracking-widest uppercase">{title}</Text>
          <View className="w-10 h-10 rounded-full bg-[#DDF4F3] items-center justify-center">
            <Image
              source={emotionalData.icon}
              resizeMode="contain"
              style={{ width: 18, height: 18 }}
            />
          </View>
        </View>

        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={10}
          value={value}
          onSlidingComplete={(val) => { handleRatingChange(category, Math.round(val)); }}
          minimumTrackTintColor="#2D5A6E"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#2D5A6E"
          step={1}
        />

        <View className="flex-row justify-between mt-2">
          <Text className="text-gray-400 text-[11px]">{labels.left}</Text>
          <Text className="text-gray-400 text-[11px]">{labels.right}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-neutral">
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-6" onPress={() => setDialog(null)}>
          <Pressable className="w-full bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm" onPress={() => {}}>
            <View className="items-center">
              <View
                className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${
                  dialog?.type === 'success' || dialog?.type === 'info' ? 'bg-[#EAF5F5]' : 'bg-[#F9EAEA]'
                }`}
              >
                <Text
                  className={`text-2xl font-extrabold ${
                    dialog?.type === 'success' || dialog?.type === 'info' ? 'text-primary' : 'text-[#C84A4A]'
                  }`}
                >
                  {dialog?.type === 'success' ? '✓' : dialog?.type === 'info' ? 'i' : '!'}
                </Text>
              </View>
              <Text className="text-gray-900 text-lg font-extrabold text-center">{dialog?.title}</Text>
              <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">{dialog?.message}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setDialog(null)}
              className="mt-6 rounded-full py-4 bg-primary active:bg-primary/90"
            >
              <Text className="text-white text-center font-bold text-base">Entendido</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View className="px-6 pt-14">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
              <Text className="text-primary text-2xl mr-3">×</Text>
              <Text className="text-gray-700 font-semibold">EMA</Text>
            </TouchableOpacity>
            <View className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-white">
              <Image
                source={require('../assets/images/logo.png')}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          </View>

          <View className="items-center mt-10 mb-10">
            <Text className="text-primary text-3xl font-extrabold text-center leading-tight">
              ¿Cómo te sientes{'\n'}ahora?
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-3">
              Desliza para evaluar tu estado emocional{'\n'}actual
            </Text>
          </View>
        </View>

        <View className="px-6">
          <SliderComponent
            title="Ánimo actual"
            category="mood"
            value={ratings.mood}
            labels={{ left: '0 - Muy mal', right: '10 - Muy bien' }}
          />

          <SliderComponent
            title="Nivel de estrés"
            category="stress"
            value={ratings.stress}
            labels={{ left: '0 - Sin estrés', right: '10 - Máximo' }}
          />

          <SliderComponent
            title="Ansiedad"
            category="anxiety"
            value={ratings.anxiety}
            labels={{ left: '0 - Sin ansiedad', right: '10 - Alta' }}
          />

          <SliderComponent
            title="Impulsividad"
            category="impulsivity"
            value={ratings.impulsivity}
            labels={{ left: '0 - Controlado', right: '10 - Impulsivo' }}
          />

          <View className="bg-[#DDF4F3] rounded-[28px] p-6 mb-5 border border-primary/10">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-white/80 items-center justify-center mr-3">
                <Text className="text-primary text-lg">🛡️</Text>
              </View>
              <Text className="text-primary font-bold text-base">Bienestar</Text>
            </View>
            <Text className="text-gray-800 text-lg font-bold mb-5">
              ¿Sientes urgencia de lesionarte ahora?
            </Text>
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleUrgeSelfHarmResponse(false)}
                className={`flex-1 rounded-full py-3 border ${urgeSelfHarm === false ? 'bg-primary border-primary' : 'bg-white/80 border-primary/10'}`}
              >
                <Text className={`text-center font-bold ${urgeSelfHarm === false ? 'text-white' : 'text-primary'}`}>
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUrgeSelfHarmResponse(true)}
                className={`flex-1 rounded-full py-3 border ${urgeSelfHarm === true ? 'bg-primary border-primary' : 'bg-white/80 border-primary/10'}`}
              >
                <Text className={`text-center font-bold ${urgeSelfHarm === true ? 'text-white' : 'text-primary'}`}>
                  Sí
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-[#DDF4F3] rounded-[28px] p-6 mb-8 border border-primary/10">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-white/80 items-center justify-center mr-3">
                <Text className="text-primary text-lg">🔒</Text>
              </View>
              <Text className="text-primary font-bold text-base">Confidencial</Text>
            </View>
            <Text className="text-gray-800 text-lg font-bold mb-3">
              ¿Tienes pensamientos que atenten contra tu vida ahora?
            </Text>
            <Text className="text-gray-500 text-xs mb-5">
              Esta información es completamente confidencial y nos ayuda a brindarte el mejor apoyo.
            </Text>
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => handleSuicidalIdeationResponse(false)}
                className={`flex-1 rounded-full py-3 border ${suicidalIdeation === false ? 'bg-primary border-primary' : 'bg-white/80 border-primary/10'}`}
              >
                <Text className={`text-center font-bold ${suicidalIdeation === false ? 'text-white' : 'text-primary'}`}>
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSuicidalIdeationResponse(true)}
                className={`flex-1 rounded-full py-3 border ${suicidalIdeation === true ? 'bg-primary border-primary' : 'bg-white/80 border-primary/10'}`}
              >
                <Text className={`text-center font-bold ${suicidalIdeation === true ? 'text-white' : 'text-primary'}`}>
                  Sí
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {riskResult === 'low' ? (
            <View className="mb-10">
              <View className="bg-white rounded-[28px] p-6 shadow-sm mb-5">
                <Text className="text-primary text-lg font-extrabold mb-2 text-center">Lo estás haciendo muy bien</Text>
                <Text className="text-gray-500 text-center">Sigue así, estás avanzando de forma positiva.</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.replace('/(tabs)')}
                className="rounded-full py-5 bg-primary active:bg-primary/90"
              >
                <Text className="text-white text-center font-bold text-base">Volver al inicio</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`rounded-full py-5 mb-10 ${isSaving ? 'bg-primary/70' : 'bg-primary active:bg-primary/90'}`}
            >
              <View className="flex-row items-center justify-center">
                {!isSaving && <Text className="text-white font-bold mr-2">✓</Text>}
                <Text className="text-white text-center font-bold text-base">
                  {isSaving ? 'Guardando…' : 'Guardar Evaluación'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
