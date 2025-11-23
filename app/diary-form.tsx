import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { post, put, get } from './lib/api';
import { loadUser } from './lib/storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ImageBackground, ScrollView, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';

interface EmotionState {
  alegria: number;
  tristeza: number;
  miedo: number;
  ira: number;
  culpa: number;
  verguenza: number;
  rechazo: number;
}

interface YesNoQuestions {
  pensoAutolesion: boolean | null;
  autolesion: boolean | null;
  ideacionSuicida: boolean | null;
  intentoSuicidio: boolean | null;
  pensoSustancias: boolean | null;
  usoSustancias: boolean | null;
  pensoConductaImpulsiva: boolean | null;
  conductaImpulsiva: boolean | null;
}

const DEFAULT_EMOTIONS: EmotionState = { alegria: 5, tristeza: 5, miedo: 5, ira: 5, culpa: 5, verguenza: 5, rechazo: 5 };
const DEFAULT_YESNO: YesNoQuestions = { pensoAutolesion: null, autolesion: null, ideacionSuicida: null, intentoSuicidio: null, pensoSustancias: null, usoSustancias: null, pensoConductaImpulsiva: null, conductaImpulsiva: null };

export default function DiaryFormScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId?: string }>();
  const editingDiaryId = diaryId ? Number(diaryId) : null;
  const [emotions, setEmotions] = useState<EmotionState>(DEFAULT_EMOTIONS);

  const [yesNoAnswers, setYesNoAnswers] = useState<YesNoQuestions>(DEFAULT_YESNO);

  const [textAnswers, setTextAnswers] = useState({
    dificultad: '',
    ayuda: '',
  });
  const MAX_REFLEXION_CHARS = 300;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const baselineRef = useRef<{ emotions: EmotionState; yesNo: YesNoQuestions; text: { dificultad: string; ayuda: string } }>({ emotions: DEFAULT_EMOTIONS, yesNo: DEFAULT_YESNO, text: { dificultad: '', ayuda: '' } });

  useEffect(() => {
    (async () => {
      if (!editingDiaryId) return;
      try {
        const user = await loadUser<any>();
        const userId = (user?.id ?? user?.userId ?? 1) as number;
        const res = await get<{ data: any[] }>(`/diaries/user/${userId}`);
        const list = Array.isArray(res.data) ? res.data : (res as any)?.data || [];
        const found = list.find((d: any) => Number(d.id) === editingDiaryId);
        if (!found) return;
        const moodKeyById: Record<number, keyof EmotionState> = { 1: 'alegria', 2: 'tristeza', 3: 'miedo', 4: 'ira', 5: 'culpa', 6: 'verguenza', 7: 'rechazo' };
        const newEmotions: EmotionState = { alegria: 5, tristeza: 5, miedo: 5, ira: 5, culpa: 5, verguenza: 5, rechazo: 5 };
        (found.moodStates || []).forEach((ms: any) => {
          const key = moodKeyById[ms.moodStateId as number];
          if (key) newEmotions[key] = Number(ms.rating) || 0;
        });
        setEmotions(newEmotions);

        const behaviorKeyById: Record<number, keyof YesNoQuestions> = {
          1: 'pensoAutolesion', 2: 'autolesion', 3: 'ideacionSuicida', 4: 'intentoSuicidio', 5: 'pensoSustancias', 6: 'usoSustancias', 7: 'pensoConductaImpulsiva', 8: 'conductaImpulsiva'
        };
        const newYesNo: YesNoQuestions = {
          pensoAutolesion: null, autolesion: null, ideacionSuicida: null, intentoSuicidio: null, pensoSustancias: null, usoSustancias: null, pensoConductaImpulsiva: null, conductaImpulsiva: null
        };
        (found.behaviors || []).forEach((b: any) => {
          const key = behaviorKeyById[b.behaviorId as number];
          if (key) newYesNo[key] = !!b.hasHappened;
        });
        setYesNoAnswers(newYesNo);

        const filledText = {
          dificultad: found.reflections?.mostDifficultToday || '',
          ayuda: found.reflections?.mostHelpfulToday || '',
        };
        setTextAnswers(filledText);
        baselineRef.current = { emotions: newEmotions, yesNo: newYesNo, text: filledText };
      } catch {}
    })();
  }, [editingDiaryId]);

  const textFilled = useMemo(() => {
    return textAnswers.dificultad.trim().length > 0 && textAnswers.ayuda.trim().length > 0;
  }, [textAnswers]);

  const isComplete = useMemo(() => {
    const yesnoOk = Object.values(yesNoAnswers).every(v => v !== null);
    return yesnoOk && textFilled;
  }, [yesNoAnswers, textFilled]);

  const isDirty = useMemo(() => {
    const emotionsChanged = JSON.stringify(emotions) !== JSON.stringify(baselineRef.current.emotions);
    const yesNoChanged = JSON.stringify(yesNoAnswers) !== JSON.stringify(baselineRef.current.yesNo);
    const textChanged = JSON.stringify(textAnswers) !== JSON.stringify(baselineRef.current.text);
    return emotionsChanged || yesNoChanged || textChanged;
  }, [emotions, yesNoAnswers, textAnswers]);

  const emotionConfig = [
    { key: 'alegria', label: 'Alegría', emoji: '😊' },
    { key: 'tristeza', label: 'Tristeza', emoji: '😢' },
    { key: 'miedo', label: 'Miedo', emoji: '😨' },
    { key: 'ira', label: 'Ira', emoji: '😡' },
    { key: 'culpa', label: 'Culpa', emoji: '😔' },
    { key: 'verguenza', label: 'Vergüenza', emoji: '😳' },
    { key: 'rechazo', label: 'Rechazo / Asco', emoji: '🤢' },
  ];

  const yesNoQuestions = [
    { key: 'pensoAutolesion', label: 'Pensaste en autolesionarte?' },
    { key: 'autolesion', label: 'Te autolesionaste?' },
    { key: 'ideacionSuicida', label: 'Tuviste ideación suicida?' },
    { key: 'intentoSuicidio', label: 'Lo intentaste?' },
    { key: 'pensoSustancias', label: 'Pensaste en usar sustancias?' },
    { key: 'usoSustancias', label: 'Usaste sustancias?' },
    { key: 'pensoConductaImpulsiva', label: 'Pensaste en realizar alguna conducta impulsiva?' },
    { key: 'conductaImpulsiva', label: 'Tuviste alguna conducta impulsiva (ej. atracones, compras, peleas)?' },
  ];

  const getEmotionData = (value: number, emotionType: string) => {
    const roundedValue = Math.round(value);
    
    // Configuración específica por tipo de emoción
    switch (emotionType) {
      case 'alegria':
        if (roundedValue === 0) return { emoji: '😶', color: '#6B7280', bgColor: 'bg-gray-600' };
        if (roundedValue <= 2) return { emoji: '😔', color: '#DC2626', bgColor: 'bg-red-600' };
        if (roundedValue <= 4) return { emoji: '😐', color: '#EA580C', bgColor: 'bg-orange-600' };
        if (roundedValue <= 6) return { emoji: '🙂', color: '#CA8A04', bgColor: 'bg-yellow-600' };
        if (roundedValue <= 8) return { emoji: '😊', color: '#16A34A', bgColor: 'bg-green-600' };
        return { emoji: '😄', color: '#2563EB', bgColor: 'bg-blue-600' };
      
      case 'tristeza':
        if (roundedValue === 0) return { emoji: '😊', color: '#16A34A', bgColor: 'bg-green-600' };
        if (roundedValue <= 2) return { emoji: '🙂', color: '#CA8A04', bgColor: 'bg-yellow-600' };
        if (roundedValue <= 4) return { emoji: '😐', color: '#EA580C', bgColor: 'bg-orange-600' };
        if (roundedValue <= 6) return { emoji: '😔', color: '#DC2626', bgColor: 'bg-red-600' };
        if (roundedValue <= 8) return { emoji: '😢', color: '#7C2D12', bgColor: 'bg-red-800' };
        return { emoji: '😭', color: '#450A0A', bgColor: 'bg-red-900' };
      
      case 'miedo':
        if (roundedValue === 0) return { emoji: '😌', color: '#16A34A', bgColor: 'bg-green-600' };
        if (roundedValue <= 2) return { emoji: '🙂', color: '#CA8A04', bgColor: 'bg-yellow-600' };
        if (roundedValue <= 4) return { emoji: '😐', color: '#EA580C', bgColor: 'bg-orange-600' };
        if (roundedValue <= 6) return { emoji: '😟', color: '#DC2626', bgColor: 'bg-red-600' };
        if (roundedValue <= 8) return { emoji: '😨', color: '#7C2D12', bgColor: 'bg-red-800' };
        return { emoji: '😱', color: '#450A0A', bgColor: 'bg-red-900' };
      
      case 'ira':
        if (roundedValue === 0) return { emoji: '😇', color: '#16A34A', bgColor: 'bg-green-600' };
        if (roundedValue <= 2) return { emoji: '😌', color: '#CA8A04', bgColor: 'bg-yellow-600' };
        if (roundedValue <= 4) return { emoji: '😐', color: '#EA580C', bgColor: 'bg-orange-600' };
        if (roundedValue <= 6) return { emoji: '😠', color: '#DC2626', bgColor: 'bg-red-600' };
        if (roundedValue <= 8) return { emoji: '😡', color: '#7C2D12', bgColor: 'bg-red-800' };
        return { emoji: '🤬', color: '#450A0A', bgColor: 'bg-red-900' };
      
      case 'culpa':
        if (roundedValue === 0) return { emoji: '😊', color: '#16A34A', bgColor: 'bg-green-600' };
        if (roundedValue <= 2) return { emoji: '🙂', color: '#CA8A04', bgColor: 'bg-yellow-600' };
        if (roundedValue <= 4) return { emoji: '😐', color: '#EA580C', bgColor: 'bg-orange-600' };
        if (roundedValue <= 6) return { emoji: '😔', color: '#DC2626', bgColor: 'bg-red-600' };
        if (roundedValue <= 8) return { emoji: '😞', color: '#7C2D12', bgColor: 'bg-red-800' };
        return { emoji: '😖', color: '#450A0A', bgColor: 'bg-red-900' };
      
      case 'verguenza':
        if (roundedValue === 0) return { emoji: '😊', color: '#16A34A', bgColor: 'bg-green-600' };
        if (roundedValue <= 2) return { emoji: '🙂', color: '#CA8A04', bgColor: 'bg-yellow-600' };
        if (roundedValue <= 4) return { emoji: '😐', color: '#EA580C', bgColor: 'bg-orange-600' };
        if (roundedValue <= 6) return { emoji: '😳', color: '#DC2626', bgColor: 'bg-red-600' };
        if (roundedValue <= 8) return { emoji: '😰', color: '#7C2D12', bgColor: 'bg-red-800' };
        return { emoji: '🫣', color: '#450A0A', bgColor: 'bg-red-900' };
      
      case 'rechazo':
        if (roundedValue === 0) return { emoji: '😊', color: '#16A34A', bgColor: 'bg-green-600' };
        if (roundedValue <= 2) return { emoji: '🙂', color: '#CA8A04', bgColor: 'bg-yellow-600' };
        if (roundedValue <= 4) return { emoji: '😐', color: '#EA580C', bgColor: 'bg-orange-600' };
        if (roundedValue <= 6) return { emoji: '😒', color: '#DC2626', bgColor: 'bg-red-600' };
        if (roundedValue <= 8) return { emoji: '🤢', color: '#7C2D12', bgColor: 'bg-red-800' };
        return { emoji: '🤮', color: '#450A0A', bgColor: 'bg-red-900' };
      
      default:
        return { emoji: '😐', color: '#6B7280', bgColor: 'bg-gray-600' };
    }
  };

  const handleEmotionChange = (emotion: keyof EmotionState, value: number) => {
    setEmotions(prev => ({ ...prev, [emotion]: value }));
  };

  const handleYesNoChange = (question: keyof YesNoQuestions, value: boolean) => {
    setYesNoAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleSubmit = async () => {
    // Validar que todas las preguntas de sí/no estén respondidas
    const unansweredQuestions = Object.values(yesNoAnswers).some(answer => answer === null);
    
    if (unansweredQuestions) {
      Alert.alert('Formulario incompleto', 'Por favor responde todas las preguntas de sí/no.');
      return;
    }

    if (!isComplete) {
      Alert.alert('Formulario incompleto', 'Por favor completa todos los campos requeridos.');
      return;
    }
    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const user = await loadUser<any>();
      const userId = (user?.id ?? user?.userId ?? 1) as number;

      const moodStateOrder: (keyof EmotionState)[] = ['alegria', 'tristeza', 'miedo', 'ira', 'culpa', 'verguenza', 'rechazo'];
      const moodStates = moodStateOrder.map((key, idx) => ({ moodStateId: idx + 1, rating: Math.round(emotions[key]) }));

      const behaviorOrder: (keyof YesNoQuestions)[] = ['pensoAutolesion', 'autolesion', 'ideacionSuicida', 'intentoSuicidio', 'pensoSustancias', 'usoSustancias', 'pensoConductaImpulsiva', 'conductaImpulsiva'];
      const behaviors = behaviorOrder.map((key, idx) => ({ behaviorId: idx + 1, hasHappened: yesNoAnswers[key] === true }));

      const payload = {
        userId,
        moodStates,
        behaviors,
        reflections: {
          mostDifficultToday: textAnswers.dificultad.trim(),
          mostHelpfulToday: textAnswers.ayuda.trim(),
        },
      };

      if (editingDiaryId) {
        await put<any>(`/diaries/${editingDiaryId}`, payload);
        Alert.alert('Cambios guardados', 'Tu registro ha sido actualizado.', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        await post<any>('/diaries', payload);
        Alert.alert('Registro guardado', 'Tu entrada del diario ha sido guardada exitosamente.', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (err: any) {
      const msg = err?.code === 'NETWORK_ERROR'
        ? `No se pudo conectar con el servidor${err?.url ? `: ${err.url}` : ''}`
        : err?.message || 'No se pudo guardar el diario';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/background/bg2.png')}
      resizeMode="cover"
      style={{ flex: 1 }}
      imageStyle={{ opacity: 1 }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-16 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
              <Text className="text-indigo-600 text-lg">← Volver</Text>
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-gray-800">Nuevo Registro</Text>
            <View className="w-16" />
          </View>
        </View>
        {/* Contenido */}
        <View className="px-6 py-6">
          {/* Sección de Emociones */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-indigo-100">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
              Emociones
            </Text>
            {emotionConfig.map((emotion) => {
              const emotionData = getEmotionData(emotions[emotion.key as keyof EmotionState], emotion.key);
              return (
                <View key={emotion.key} className="mb-8">
                  <Text className="text-center text-indigo-600 text-lg font-semibold mb-2">
                    {emotion.label}
                  </Text>
                  
                  {/* Indicador y valor actual */}
                  <View className="items-center mb-4">
                    <View className="w-16 h-16 rounded-full items-center justify-center mb-2 bg-white border border-indigo-100">
                      <Text className="text-2xl">{emotionData.emoji}</Text>
                    </View>
                    <Text className="text-indigo-600 text-xl font-bold">
                      {Math.round(emotions[emotion.key as keyof EmotionState])}
                    </Text>
                  </View>
                  
                  {/* Slider */}
                  <View className="px-2">
                    <Slider
                      style={{ width: '100%', height: 40 }}
                      minimumValue={0}
                      maximumValue={10}
                      value={emotions[emotion.key as keyof EmotionState]}
                      onValueChange={(value) => handleEmotionChange(emotion.key as keyof EmotionState, value)}
                      minimumTrackTintColor={emotionData.color}
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor={emotionData.color}
                      step={1}
                    />
                  </View>
                  
                  {/* Etiquetas */}
                  <View className="flex-row justify-between mt-2 px-2">
                    <Text className="text-indigo-500 text-xs">0 - Nada</Text>
                    <Text className="text-indigo-500 text-xs">5 - Moderado</Text>
                    <Text className="text-indigo-500 text-xs">10 - Mucho</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Sección de Preguntas Sí/No */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-indigo-100">
            <Text className="text-xl font-semibold text-gray-800 mb-6">
              Comportamientos
            </Text>
            {yesNoQuestions.map((question) => {
              const isYesSelected = yesNoAnswers[question.key as keyof YesNoQuestions] === true;
              const isNoSelected = yesNoAnswers[question.key as keyof YesNoQuestions] === false;
      
              return (
                <View key={question.key} className="mb-5">
                  <Text className="text-lg text-gray-700 mb-3">
                    {question.label}
                  </Text>
      
                  {/* Selector segmentado Sí/No */}
                  <View className="flex-row rounded-xl border border-indigo-100 overflow-hidden bg-white">
                    <TouchableOpacity
                      onPress={() => handleYesNoChange(question.key as keyof YesNoQuestions, true)}
                      className={`flex-1 py-3 items-center justify-center ${
                        isYesSelected ? 'bg-red-50' : 'bg-white'
                      }`}
                    >
                      <Text className={`font-medium ${
                        isYesSelected ? 'text-red-700' : 'text-indigo-600'
                      }`}>
                        Sí
                      </Text>
                    </TouchableOpacity>
      
                    <View className="w-px bg-indigo-100" />
      
                    <TouchableOpacity
                      onPress={() => handleYesNoChange(question.key as keyof YesNoQuestions, false)}
                      className={`flex-1 py-3 items-center justify-center ${
                        isNoSelected ? 'bg-green-50' : 'bg-white'
                      }`}
                    >
                      <Text className={`font-medium ${
                        isNoSelected ? 'text-green-700' : 'text-indigo-600'
                      }`}>
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Sección de Texto Libre */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-indigo-100">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Image
                  source={require('../assets/images/icons/mood-regular.png')}
                  resizeMode="contain"
                  style={{ width: 20, height: 20, marginRight: 8 }}
                />
                <Text className="text-xl font-semibold text-gray-800">Reflexiones</Text>
              </View>
              <Text className="text-indigo-400 text-xs">Opcional</Text>
            </View>
            
            <View className="mb-6">
              <Text className="text-lg text-gray-700 mb-3">
                Lo que más me costó hoy fue...
              </Text>
              <View className="rounded-2xl border border-indigo-200 bg-white">
                <TextInput
                  value={textAnswers.dificultad}
                  onChangeText={(text) => setTextAnswers(prev => ({ ...prev, dificultad: text }))}
                  placeholder="Escribe aquí..."
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#6366F1"
                  multiline
                  numberOfLines={4}
                  maxLength={MAX_REFLEXION_CHARS}
                  className="p-4 text-gray-700"
                  textAlignVertical="top"
                />
              </View>
              <View className="flex-row justify-between mt-2 px-1">
                <Text className="text-indigo-500 text-xs">Máx. {MAX_REFLEXION_CHARS} caracteres</Text>
                <Text className="text-indigo-500 text-xs">{textAnswers.dificultad.length}/{MAX_REFLEXION_CHARS}</Text>
              </View>
            </View>
            
            <View className="mb-6">
              <Text className="text-lg text-gray-700 mb-3">
                Lo que me ayudó hoy fue...
              </Text>
              <View className="rounded-2xl border border-indigo-200 bg-white">
                <TextInput
                  value={textAnswers.ayuda}
                  onChangeText={(text) => setTextAnswers(prev => ({ ...prev, ayuda: text }))}
                  placeholder="Escribe aquí..."
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#6366F1"
                  multiline
                  numberOfLines={4}
                  maxLength={MAX_REFLEXION_CHARS}
                  className="p-4 text-gray-700"
                  textAlignVertical="top"
                />
              </View>
              <View className="flex-row justify-between mt-2 px-1">
                <Text className="text-indigo-500 text-xs">Máx. {MAX_REFLEXION_CHARS} caracteres</Text>
                <Text className="text-indigo-500 text-xs">{textAnswers.ayuda.length}/{MAX_REFLEXION_CHARS}</Text>
              </View>
            </View>
          </View>

          {/* Botón de Guardar */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !isComplete || !isDirty}
            className={`py-4 rounded-2xl shadow-sm ${isSubmitting || !isComplete || !isDirty ? 'bg-indigo-300' : 'bg-indigo-400 active:bg-indigo-500'}`}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {isSubmitting ? 'Guardando…' : editingDiaryId ? 'Guardar Cambios' : 'Guardar Registro'}
            </Text>
          </TouchableOpacity>

          {/* Espaciado inferior */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}