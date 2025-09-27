import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const handleResponder = () => {
    // Aquí iría la lógica para responder la pregunta
    console.log('Responder pregunta sobre estado emocional');
  };

  // Datos de ejemplo para la línea de tiempo (de más reciente a más antiguo)
  const timelineData = [
    { time: '21:00', mood: 'Alto', color: 'bg-red-500', level: 3, description: 'Me siento muy bien' },
    { time: '18:20', mood: 'Moderado', color: 'bg-yellow-500', level: 2, description: 'Estado emocional estable' },
    { time: '15:45', mood: 'Bajo', color: 'bg-green-500', level: 1, description: 'Me siento un poco decaído' },
    { time: '12:30', mood: 'Alto', color: 'bg-red-500', level: 3, description: 'Muy positivo y energético' },
    { time: '09:00', mood: 'Moderado', color: 'bg-yellow-500', level: 2, description: 'Comenzando el día tranquilo' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="bg-white px-6 pt-16 pb-8 shadow-sm">
          <View className="items-center space-y-6">

            {/* Main Question */}
            <View className="bg-blue-50 rounded-2xl p-6 w-full">
              <Text className="text-xl font-semibold text-blue-800 text-center mb-4">
                ¿Cómo te sientes ahora?
              </Text>
              
              {/* Respond Button */}
              <TouchableOpacity
                onPress={handleResponder}
                className="bg-blue-600 rounded-xl py-4 shadow-lg active:bg-blue-700"
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Responder
                </Text>
              </TouchableOpacity>
            </View>

            {/* Last Response Info */}
            <View className="items-center">
              <Text className="text-gray-500 text-sm">
                Última respuesta: hace 3 horas
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline Section */}
        <View className="px-6 py-8">
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Tu progreso emocional hoy
            </Text>
            <Text className="text-gray-600">
              Seguimiento de tu estado emocional durante el día
            </Text>
          </View>

          {/* Vertical Timeline */}
          <View className="relative">
            {/* Timeline Line */}
            <View className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />

            {/* Timeline Items */}
            <View className="space-y-6">
              {timelineData.map((item, index) => (
                <View key={index} className="flex-row items-center">
                  {/* Timeline Dot */}
                  <View className="relative">
                    <View className={`w-12 h-12 ${item.color} rounded-full items-center justify-center shadow-lg`}>
                      <Text className="text-white font-bold text-lg">
                        {item.level}
                      </Text>
                    </View>
                    {/* Connector Line to Content */}
                    <View className="absolute top-6 left-12 w-4 h-0.5 bg-gray-300" />
                  </View>

                  {/* Content Card */}
                  <View className="flex-1 ml-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-semibold text-gray-800 text-lg">
                        {item.mood}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {item.time}
                      </Text>
                    </View>
                    
                    {/* Mood Level Bar */}
                    <View className="bg-gray-200 rounded-full h-2 mb-2">
                      <View 
                        className={`${item.color} h-2 rounded-full`}
                        style={{ width: `${(item.level / 3) * 100}%` }}
                      />
                    </View>
                    
                    <Text className="text-gray-600 text-sm mb-1">
                      Nivel {item.level}/3 - {item.mood}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {item.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Current Time Indicator */}
            <View className="flex-row items-center mt-6">
              <View className="w-12 h-12 bg-gray-400 rounded-full items-center justify-center border-4 border-white shadow-lg">
                <View className="w-3 h-3 bg-white rounded-full animate-pulse" />
              </View>
              <View className="flex-1 ml-4 bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300">
                <Text className="text-gray-500 font-medium">
                  Próximo registro
                </Text>
                <Text className="text-gray-400 text-sm">
                  Toca "Responder" para registrar tu estado actual
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}