import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import React, { useState } from 'react';
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

export default function DiaryFormScreen() {
  const [emotions, setEmotions] = useState<EmotionState>({
    alegria: 5,
    tristeza: 5,
    miedo: 5,
    ira: 5,
    culpa: 5,
    verguenza: 5,
    rechazo: 5,
  });

  const [yesNoAnswers, setYesNoAnswers] = useState<YesNoQuestions>({
    pensoAutolesion: null,
    autolesion: null,
    ideacionSuicida: null,
    intentoSuicidio: null,
    pensoSustancias: null,
    usoSustancias: null,
    pensoConductaImpulsiva: null,
    conductaImpulsiva: null,
  });

  const [textAnswers, setTextAnswers] = useState({
    dificultad: '',
    ayuda: '',
  });
  const MAX_REFLEXION_CHARS = 300;

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

  const handleSubmit = () => {
    // Validar que todas las preguntas de sí/no estén respondidas
    const unansweredQuestions = Object.values(yesNoAnswers).some(answer => answer === null);
    
    if (unansweredQuestions) {
      Alert.alert('Formulario incompleto', 'Por favor responde todas las preguntas de sí/no.');
      return;
    }

    if (!textAnswers.dificultad.trim() || !textAnswers.ayuda.trim()) {
      Alert.alert('Formulario incompleto', 'Por favor completa los campos de texto.');
      return;
    }

    // Aquí se guardaría la información
    Alert.alert(
      'Registro guardado',
      'Tu entrada del diario ha sido guardada exitosamente.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
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
            className="bg-indigo-400 py-4 rounded-2xl shadow-sm active:bg-indigo-500"
          >
            <Text className="text-white text-lg font-semibold text-center">
              Guardar Registro
            </Text>
          </TouchableOpacity>

          {/* Espaciado inferior */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}