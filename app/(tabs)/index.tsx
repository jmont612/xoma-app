import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Función para generar el calendario del mes
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        isSelected: currentDate.toDateString() === selectedDate.toDateString(),
      });
    }
    
    return days;
  };

  // Función para obtener datos dinámicos basados en la fecha
  const getDayData = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayOfMonth = date.getDate();
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isPastDay = date < today;
    
    // Para el día actual, mostramos el estado actual según la pantalla
    if (isToday) {
      return {
        mood: null,
        progress: 45, // Progreso actual mostrado en pantalla
        diaryEntries: {
          morning: false, // "Escribir" - no completado
          evening: false,
          positive: false,
          negative: false,
        },
        questionAnswered: false, // "Escribir una respuesta" - no completado
      };
    }
    
    // Para días pasados, simulamos datos más realistas
    if (isPastDay) {
      const completionRate = Math.random();
      return {
        mood: completionRate > 0.3 ? ['Terrible', 'Malo', 'Normal', 'Bueno', 'Súper'][Math.floor(Math.random() * 5)] : null,
        progress: Math.floor(Math.random() * 40) + 60, // Entre 60-100%
        diaryEntries: {
          morning: completionRate > 0.2,
          evening: completionRate > 0.4,
          positive: completionRate > 0.3,
          negative: completionRate > 0.6,
        },
        questionAnswered: completionRate > 0.5,
      };
    }
    
    // Para días futuros, todo está vacío
    return {
      mood: null,
      progress: 0,
      diaryEntries: {
        morning: false,
        evening: false,
        positive: false,
        negative: false,
      },
      questionAnswered: false,
    };
  };

  const currentDayData = getDayData(selectedDate);

  // Función para manejar selección de fecha
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  // Función para cambiar mes
  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Función para generar la semana basada en la fecha seleccionada
  const generateWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    startOfWeek.setDate(diff);

    const weekDays = [];
    const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sáb', 'Do'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      
      weekDays.push({
        day: dayNames[i],
        date: currentDay.getDate(),
        fullDate: new Date(currentDay),
        isToday: currentDay.toDateString() === today.toDateString(),
        isSelected: currentDay.toDateString() === selectedDate.toDateString(),
      });
    }

    return weekDays;
  };

  const weekDays = generateWeekDays();

  const handleWriteDiary = (type: string) => {
    if (type === 'evaluacion-emocional') {
      router.push('/ema');
    } else {
      console.log(`Comenzar evaluación ${type}`);
    }
  };

  const handleAddEntry = (type: string) => {
    console.log(`Agregar entrada: ${type}`);
  };

  const handleAnswerQuestion = () => {
    console.log('Responder pregunta del día');
  };

  const handleCrisisSkill = (skillType: string) => {
    if (skillType === 'temperatura') {
      router.push('/skill-detail?skillId=temperatura');
    } else if (skillType === 'respiracion') {
      router.push('/zen');
    }
  };

  const handleEmergencyContacts = () => {
    router.push('/emergency-contacts');
  };

  // Nuevo: ir a Intervenciones
  const handleIntervention = () => {
    router.push('/intervention'); // Abre la vista de intervención (riesgo medio por defecto)
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/background/bg2.png')}
      resizeMode="cover"
      style={{ flex: 1 }}
      imageStyle={{ opacity: 1 }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header con fecha seleccionada */}
        <View className="px-6 pt-16 mb-4">
          <Text className="text-indigo-600 text-2xl font-bold text-left">
            Hola, Majo
          </Text>
        </View>

        {/* Calendario semanal con icono */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity 
              onPress={() => setShowCalendar(true)}
              className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm"
            >
              <Text className="text-indigo-400 text-2xl mr-2">📅</Text>
              <Text className="text-indigo-500 text-sm font-medium">Seleccionar fecha</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row justify-between">
            {weekDays.map((day, index) => (
              <TouchableOpacity 
                key={index} 
                className="items-center"
                onPress={() => setSelectedDate(day.fullDate)}
              >
                <Text className="text-indigo-500 text-sm mb-2">{day.day}</Text>
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  day.isSelected ? 'bg-indigo-400' : 
                  day.isToday ? 'bg-indigo-300' : 'bg-white/60'
                }`}>
                  <Text className={`font-bold ${
                    day.isSelected || day.isToday ? 'text-white' : 'text-indigo-600'
                  }`}>
                    {day.date}
                  </Text>
                </View>
                {day.isSelected && (
                  <View className="w-1 h-1 bg-indigo-400 rounded-full mt-1" />
                )}
                {day.isToday && !day.isSelected && (
                  <View className="w-1 h-1 bg-indigo-300 rounded-full mt-1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Secciones principales */}
        <View className="px-6 space-y-6">
          
          {/* Evaluación Emocional */}
          <View className="bg-pink-100 rounded-2xl mb-6 p-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-indigo-700 text-lg font-semibold">¿Cómo me siento ahora?</Text>
            </View>
            <Text className="text-indigo-500 text-sm mb-4">
              Evaluaciones hoy: 2
            </Text>
            <TouchableOpacity
              onPress={() => handleWriteDiary('evaluacion-emocional')}
              className={`bg-indigo-400 rounded-xl py-3`}
            >
              <Text className="text-white text-center font-semibold">
                Comenzar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Frase del día */}
          <View className="bg-pink-200 rounded-2xl mb-6 p-6">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-indigo-700 text-lg font-semibold mb-2">Frase del día</Text>
                <Text className="text-indigo-600 text-sm"> 
                  &quot;Está bien sentir lo que sientes. Date permiso para hacer una pausa y respirar, no tienes que resolverlo todo ahora.&quot;
                </Text>
              </View>
            </View>
          </View>

          {/* Intervención rápida */}
          <View className="bg-pink-100 rounded-2xl mb-6 p-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-indigo-700 text-lg font-semibold">Intervención</Text>
            </View>
            <Text className="text-indigo-500 text-sm mb-4">
              Accede a técnicas y contactos de ayuda.
            </Text>
            <TouchableOpacity
              onPress={handleIntervention}
              className="bg-indigo-400 rounded-xl py-3"
            >
              <Text className="text-white text-center font-semibold">Abrir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Espaciado inferior */}
        <View className="h-8" />
      </ScrollView>

      {/* Modal del calendario */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View className="flex-1 bg-black bg-opacity-20 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 m-4 w-11/12 max-w-sm border border-indigo-100 shadow-sm">
            {/* Header del calendario */}
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Text className="text-indigo-500 text-xl">‹</Text>
              </TouchableOpacity>
              <Text className="text-indigo-700 text-lg font-semibold">
                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Text className="text-indigo-500 text-xl">›</Text>
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View className="flex-row justify-between mb-2">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => (
                <Text key={index} className="text-indigo-500 text-sm w-8 text-center">
                  {day}
                </Text>
              ))}
            </View>

            {/* Días del calendario */}
            <View className="flex-row flex-wrap">
              {generateCalendar().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => day.isCurrentMonth ? handleDateSelect(day.date) : null}
                  className={`w-8 h-8 items-center justify-center m-1 rounded ${
                    day.isSelected ? 'bg-indigo-400' : 
                    day.isToday ? 'bg-indigo-300' : 
                    day.isCurrentMonth ? 'bg-white' : 'bg-transparent'
                  }`}
                >
                  <Text className={`text-sm ${
                    day.isSelected || day.isToday ? 'text-white' :
                    day.isCurrentMonth ? 'text-indigo-600' : 'text-indigo-300'
                  }`}>
                    {day.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity
              onPress={() => setShowCalendar(false)}
              className="bg-indigo-400 rounded-xl py-3 mt-4"
            >
              <Text className="text-white text-center font-medium">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}