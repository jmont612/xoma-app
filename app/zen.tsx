import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Vibration, View } from 'react-native';

export default function ZenScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [buttonText, setButtonText] = useState('Comenzar');
  


  // Configuración de pasos
  const steps = [
    {
      id: 1,
      title: '',
      duration: 30,
      content: 'Este es un momento para ti. Busca un lugar cómodo, si deseas cierra los ojos, inhala una vez y sostén la respiración por 30 segundos, al terminar el tiempo exhala lentamente.'
    },
    {
      id: 2,
      title: '',
      duration: 120, // 2 minutos
      content: 'Inhala profundamente por la nariz contando hasta 4.\n\nMantén el aire 1–2 segundos.\n\nExhala lentamente por la boca contando hasta 6.'
    },
    {
      id: 3,
      title: '',
      duration: 60, // 1 minuto
      content: 'Siente el aire entrando y saliendo.\n\nPercibe las sensaciones en tu cuerpo: temperatura, contacto con el mundo, latido.\n\nSi tu mente se distrae, simplemente nota el pensamiento y regresa a tu respiración.'
    },
    {
      id: 4,
      title: '',
      duration: 0,
      content: 'Has dedicado unos minutos para cuidarte. No importa cómo lo hiciste, lo importante es que estuviste presente. Lleva contigo esta calma al resto de tu día.'
    }
  ];

  const currentStepData = steps[currentStep - 1];

  // Efecto para el temporizador
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (isTimerActive && timer === 0) {
      // Vibrar cuando el temporizador llegue a 0
      Vibration.vibrate([0, 500, 200, 500]);
      setIsTimerActive(false);
      setButtonText('Siguiente');
    }

    return () => clearInterval(interval);
  }, [isTimerActive, timer]);



  const handleStartTimer = () => {
    if (currentStep === 4) {
      // Último paso - completar y volver al inicio
      router.push('/(tabs)');
      return;
    }

    if (buttonText === 'Comenzar') {
      setTimer(currentStepData.duration);
      setIsTimerActive(true);
      setButtonText('En progreso...');
    } else if (buttonText === 'Siguiente') {
      setCurrentStep(currentStep + 1);
      setButtonText('Comenzar');
      setIsTimerActive(false);
      setTimer(0);
    }
  };

  const handleResetTimer = () => {
    // Detener el temporizador actual
    setIsTimerActive(false);
    
    // Restablecer el temporizador al valor original del paso actual
    setTimer(currentStepData.duration);
    
    // Restablecer el botón a "Comenzar"
    setButtonText('Comenzar');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepperProgress = () => {
    return (currentStep / steps.length) * 100;
  };



  return (
    <View className="flex-1 bg-gray-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-16 mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mb-4"
          >
            <Text className="text-blue-400 text-lg">← Volver</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de progreso */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white text-sm font-medium">Progreso</Text>
            <Text className="text-blue-400 text-sm font-bold">{Math.round(getStepperProgress())}%</Text>
          </View>
          <View className="bg-gray-700 rounded-full h-3">
            <View 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getStepperProgress()}%` }}
            />
          </View>
        </View>

        {/* Contenido del paso actual */}
        <View className="px-6 mb-8">
          <View className="bg-gray-800 rounded-2xl p-6">
            <Text className="text-white text-xl font-semibold mb-4">
              Paso {currentStep}: {currentStepData.title}
            </Text>
            
            <Text className="text-gray-300 text-base leading-6 mb-6">
              {currentStepData.content}
            </Text>



            {/* Temporizador */}
            {currentStepData.duration > 0 && (
              <View className="items-center mb-6">
                <View className="flex-row items-center space-x-4">
                  <View className="bg-gray-700 rounded-full px-6 py-3">
                    <Text className="text-white text-2xl font-mono">
                      {formatTime(timer)}
                    </Text>
                  </View>
                  
                  {/* Icono de restablecer */}
                  <TouchableOpacity
                    onPress={handleResetTimer}
                    className="bg-blue-600 rounded-full p-3"
                  >
                    <Text className="text-white text-lg">🔄</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Botón de acción */}
            <TouchableOpacity
              onPress={handleStartTimer}
              disabled={isTimerActive && buttonText === 'En progreso...'}
              className={`rounded-xl py-4 ${
                isTimerActive && buttonText === 'En progreso...' 
                  ? 'bg-gray-600' 
                  : currentStep === 4 
                    ? 'bg-green-600' 
                    : 'bg-blue-600'
              }`}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {currentStep === 4 ? 'Completado' : buttonText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Espaciado inferior */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}