import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function EvaluacionEmocional() {
  const router = useRouter();
  const [ratings, setRatings] = useState({
    mood: 5,
    stress: 5,
    impulsivity: 5,
  });
  const [suicidalIdeation, setSuicidalIdeation] = useState<boolean | null>(null);

  // Caritas y colores para diferentes estados emocionales
  const getEmotionalData = (value: number, type: 'mood' | 'stress' | 'impulsivity') => {
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

  const handleRatingChange = (category: 'mood' | 'stress' | 'impulsivity', value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSuicidalIdeationResponse = (response: boolean) => {
    setSuicidalIdeation(response);
    if (response) {
      Alert.alert(
        'Apoyo Disponible',
        'Gracias por tu honestidad. Es importante que sepas que hay ayuda disponible. Te recomendamos contactar a un profesional de la salud mental.',
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  const handleSave = () => {
    if (suicidalIdeation === null) {
      Alert.alert('Evaluación Incompleta', 'Por favor responde la pregunta de bienestar antes de guardar.');
      return;
    }

    console.log('Evaluación guardada:', { ratings, suicidalIdeation });
    Alert.alert(
      'Evaluación Guardada',
      'Tu evaluación emocional ha sido registrada exitosamente.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const SliderComponent = ({ 
    title, 
    category, 
    value,
    labels
  }: { 
    title: string; 
    category: 'mood' | 'stress' | 'impulsivity'; 
    value: number;
    labels: { low: string; mid: string; high: string };
  }) => {
    const emotionalData = getEmotionalData(value, category);
    
    return (
      <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-indigo-100">
        <Text className="text-gray-800 text-center text-indigo-600 text-lg font-semibold mb-2">{title}</Text>
        
        {/* Carita y valor actual */}
        <View className="items-center mb-4">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-2 bg-white border border-indigo-100">
            <Image 
              source={emotionalData.icon}
              resizeMode="contain"
              style={{ width: 32, height: 32 }}
            />
          </View>
          <Text className="text-indigo-600 text-xl font-bold">{Math.round(value)}</Text>
        </View>

        {/* Slider */}
        <View className="px-2">
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={10}
            value={value}
            onValueChange={(val) => handleRatingChange(category, val)}
            minimumTrackTintColor={emotionalData.color}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={emotionalData.color}
            step={1}
          />
        </View>

        {/* Etiquetas */}
        <View className="flex-row justify-between mt-2 px-2">
          <Text className="text-indigo-500 text-xs">{labels.low}</Text>
          <Text className="text-indigo-500 text-xs">{labels.mid}</Text>
          <Text className="text-indigo-500 text-xs">{labels.high}</Text>
        </View>
      </View>
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
        <View className="px-6 pt-16 pb-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
              <Text className="text-indigo-600 text-lg">← Volver</Text>
            </TouchableOpacity>
          </View>
          
          {/* Título principal centrado con ícono */}
          <View className="items-center mb-6">
            <Text className="text-indigo-600 text-2xl font-bold text-center">
              ¿Cómo te sientes ahora?
            </Text>
            <Text className="text-indigo-500 text-sm text-center mt-2">
              Desliza para evaluar tu estado emocional actual
            </Text>
          </View>
        </View>

        <View className="px-6">
          {/* Ánimo actual */}
          <SliderComponent 
            title="Ánimo Actual" 
            category="mood" 
            value={ratings.mood}
            labels={{
              low: "0 - Muy mal",
              mid: "5 - Neutral", 
              high: "10 - Muy bien"
            }}
          />

          {/* Estrés */}
          <SliderComponent 
            title="Nivel de Estrés" 
            category="stress" 
            value={ratings.stress}
            labels={{
              low: "0 - Sin estrés",
              mid: "5 - Moderado", 
              high: "10 - Máximo"
            }}
          />

          {/* Impulsividad */}
          <SliderComponent 
            title="Impulsividad" 
            category="impulsivity" 
            value={ratings.impulsivity}
            labels={{
              low: "0 - Controlado",
              mid: "5 - Equilibrado", 
              high: "10 - Impulsivo"
            }}
          />

          {/* Pregunta guardián - Ideación suicida */}
          <View className="mb-8">
            <View className="bg-white/80 rounded-2xl p-6 mb-4 border border-pink-200 shadow-sm">
              <View className="flex-row items-center mb-3">
                <Text className="text-pink-700 text-lg mr-2">🔒</Text>
                <Text className="text-pink-700 text-sm font-medium">CONFIDENCIAL</Text>
              </View>
              <Text className="text-gray-800 text-lg font-semibold mb-3">
                ¿Has tenido pensamientos de hacerte daño hoy?
              </Text>
              <Text className="text-indigo-500 text-xs">
                Esta información es completamente confidencial y nos ayuda a brindarte el mejor apoyo.
              </Text>
            </View>

            <View className="flex-row" style={{ gap: 16 }}>
              <TouchableOpacity
                onPress={() => handleSuicidalIdeationResponse(false)}
                className={`flex-1 py-4 rounded-xl ${
                  suicidalIdeation === false ? 'bg-green-400' : 'bg-white border border-indigo-200'
                }`}
              >
                <Text className={`text-center font-semibold text-lg ${
                  suicidalIdeation === false ? 'text-white' : 'text-indigo-600'
                }`}>
                  No
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleSuicidalIdeationResponse(true)}
                className={`flex-1 py-4 rounded-xl ${
                  suicidalIdeation === true ? 'bg-red-400' : 'bg-white border border-indigo-200'
                }`}
              >
                <Text className={`text-center font-semibold text-lg ${
                  suicidalIdeation === true ? 'text-white' : 'text-indigo-600'
                }`}>
                  Sí
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón guardar */}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-indigo-400 rounded-2xl py-4 mb-8 shadow-sm active:bg-indigo-500"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Guardar Evaluación
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}