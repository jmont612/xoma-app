import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, ImageBackground, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { get } from '../lib/api';
import { toDateFromUnknown, toLocalYYYYMMDD } from '../lib/date';
import { loadUser } from '../lib/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [minSelectableDate, setMinSelectableDate] = useState(new Date());

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
    const minDay = new Date(minSelectableDate);
    minDay.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const curMid = new Date(currentDate);
      curMid.setHours(0, 0, 0, 0);
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
        isSelected: currentDate.toDateString() === selectedDate.toDateString(),
        isFuture: currentDate > today,
        isBeforeReg: curMid < minDay,
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
  const [emaCount, setEmaCount] = useState<number>(0);
  const [daySkillCount, setDaySkillCount] = useState<number>(0);
  const [daySkillNames, setDaySkillNames] = useState<string[]>([]);
  const daySkillsFetchLockRef = useRef(false);

  

  const loadEmaCount = useCallback(async (date: Date) => {
    try {
      const user = await loadUser<any>();
      const userId = (user?.id ?? user?.userId ?? 1) as number;
      const res = await get<{ data: any[] }>(`/ema-logs/user/${userId}`);
      const list = Array.isArray(res?.data) ? res.data : (res as any)?.data || [];
      const target = new Date(date);
      const targetStr = toLocalYYYYMMDD(target);
      const count = list.filter((item: any) => {
        const raw = item?.createdAt || item?.date || item?.logDate || item?.timestamp;
        const dt = typeof raw === 'number' ? new Date(raw) : new Date(String(raw || new Date()));
        const localStr = toLocalYYYYMMDD(dt);
        return localStr === targetStr;
      }).length;
      setEmaCount(Math.floor(count / 6));
    } catch {
      setEmaCount(0);
    }
  }, []);

  useEffect(() => { loadEmaCount(selectedDate); }, [selectedDate, loadEmaCount]);
  useFocusEffect(useCallback(() => { loadEmaCount(selectedDate); }, [selectedDate, loadEmaCount]));

  const loadDaySkills = useCallback(async (date?: Date) => {
    if (daySkillsFetchLockRef.current) return;
    daySkillsFetchLockRef.current = true;
    try {
      const me = await loadUser<any>();
      const userId = (me?.id ?? me?.userId ?? 1) as number;
      const target = new Date(date ?? selectedDate);
      const targetStr = toLocalYYYYMMDD(target);
      const tzOffsetMin = new Date().getTimezoneOffset();
      const adj = new Date(target);
      adj.setDate(target.getDate() + (tzOffsetMin > 0 ? 1 : (tzOffsetMin < 0 ? -1 : 0)));
      const adjStr = toLocalYYYYMMDD(adj);
      const datesToQuery = Array.from(new Set([targetStr, adjStr]));
      const results = await Promise.all(
        datesToQuery.map(d => get<{ data: any[] }>(`/user-skill-activities/user/${userId}?date=${d}`))
      );
      const merged: any[] = [];
      results.forEach((res, idx) => {
        const arr: any[] = Array.isArray(res?.data) ? res.data : (res as any)?.data || [];
        merged.push(...arr);
        console.log('loadDaySkills query fecha:', datesToQuery[idx], 'items:', arr.length);
      });
      const activities: any[] = merged
        .filter((sa: any) => toLocalYYYYMMDD(toDateFromUnknown(sa?.createdAt ?? sa?.created_at ?? sa?.date ?? sa?.timestamp)) === targetStr)
        .filter((sa, idx, arr) => arr.findIndex(x => String(x?.id ?? `${x?.subSkill?.id}-${idx}`) === String(sa?.id ?? `${sa?.subSkill?.id}-${idx}`)) === idx);
      const names: string[] = [];
      let completedCount = 0;
      activities.forEach((sa: any) => {
        const status = String(sa?.status ?? '').trim().toLowerCase();
        if (status === 'completed') {
          completedCount += 1;
          const n = sa?.subSkill?.name || sa?.name || 'Habilidad';
          names.push(String(n));
        }
      });
      console.log('loadDaySkills completadas:', completedCount);
      const uniqueNames = Array.from(new Set(names));
      setDaySkillCount(completedCount);
      setDaySkillNames(uniqueNames);
    } catch {
      setDaySkillCount(0);
      setDaySkillNames([]);
    } finally {
      daySkillsFetchLockRef.current = false;
    }
  }, [selectedDate]);

  
  useFocusEffect(useCallback(() => { loadDaySkills(); }, [loadDaySkills]));
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('skill-completed', () => {
      const today = new Date();
      setSelectedDate(today);
      loadDaySkills(today);
      loadEmaCount(today);
    });
    return () => { sub.remove(); };
  }, [loadDaySkills, loadEmaCount]);

  useEffect(() => {
    (async () => {
      try {
        const me = await loadUser<any>();
        const raw = me?.createdAt ?? me?.created_at ?? me?.registrationDate ?? me?.registeredAt;
        const reg = raw ? toDateFromUnknown(raw) : new Date();
        const mid = new Date(reg);
        mid.setHours(0, 0, 0, 0);
        setMinSelectableDate(mid);
      } catch {
        const mid = new Date();
        mid.setHours(0, 0, 0, 0);
        setMinSelectableDate(mid);
      }
    })();
  }, []);

  // Función para manejar selección de fecha
  const handleDateSelect = (date: Date) => {
    const today = new Date();
    const minDay = new Date(minSelectableDate);
    minDay.setHours(0, 0, 0, 0);
    const dMid = new Date(date);
    dMid.setHours(0, 0, 0, 0);
    if (dMid < minDay) return;
    if (date > today) return;
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
    const minDay = new Date(minSelectableDate);
    minDay.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const curMid = new Date(currentDay);
      curMid.setHours(0, 0, 0, 0);
      
      weekDays.push({
        day: dayNames[i],
        date: currentDay.getDate(),
        fullDate: new Date(currentDay),
        isToday: currentDay.toDateString() === today.toDateString(),
        isSelected: currentDay.toDateString() === selectedDate.toDateString(),
        isFuture: currentDay > today,
        isBeforeReg: curMid < minDay,
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
                onPress={() => (!day.isFuture && !day.isBeforeReg) ? setSelectedDate(day.fullDate) : null}
              >
                <Text className="text-indigo-500 text-sm mb-2">{day.day}</Text>
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  day.isSelected ? 'bg-indigo-400' : 
                  day.isToday ? 'bg-indigo-300' : ((day.isFuture || day.isBeforeReg) ? 'bg-white/40' : 'bg-white/60')
                }`}>
                  <Text className={`font-bold ${
                    day.isSelected || day.isToday ? 'text-white' : ((day.isFuture || day.isBeforeReg) ? 'text-indigo-300' : 'text-indigo-600')
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
              {selectedDate.toDateString() === new Date().toDateString() ? 'Evaluaciones hoy' : 'Evaluaciones del día'}: {emaCount}
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

          <View className="bg-pink-100 rounded-2xl mb-6 p-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-indigo-700 text-lg font-semibold">Habilidades realizadas</Text>
            </View>
            <Text className="text-indigo-500 text-sm mb-4">
              {selectedDate.toDateString() === new Date().toDateString() ? 'Hoy' : 'Del día'}: {daySkillCount}
            </Text>
            <View className="flex-row flex-wrap">
              {daySkillNames.length === 0 ? (
                <Text className="text-indigo-500">Sin habilidades realizadas</Text>
              ) : (
                daySkillNames.map((name, idx) => (
                  <View key={`${name}-${idx}`} className="bg-white rounded-full px-4 py-2 mr-2 mb-2 border border-indigo-100 shadow-sm">
                    <Text className="text-indigo-700 text-sm">{name}</Text>
                  </View>
                ))
              )}
            </View>
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
                  onPress={() => (day.isCurrentMonth && !day.isFuture && !day.isBeforeReg) ? handleDateSelect(day.date) : null}
                  className={`w-8 h-8 items-center justify-center m-1 rounded ${
                    day.isSelected ? 'bg-indigo-400' : 
                    day.isToday ? 'bg-indigo-300' : 
                    day.isCurrentMonth ? ((day.isFuture || day.isBeforeReg) ? 'bg-white/40' : 'bg-white') : 'bg-transparent'
                  }`}
                >
                  <Text className={`text-sm ${
                    day.isSelected || day.isToday ? 'text-white' :
                    day.isCurrentMonth ? ((day.isFuture || day.isBeforeReg) ? 'text-indigo-300' : 'text-indigo-600') : 'text-indigo-300'
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
