import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { get } from '../lib/api';
import { fromYYYYMMDDLocal, isSameLocalDay, toLocalYYYYMMDD, toDateFromUnknown } from '../lib/date';
import { loadUser } from '../lib/storage';

interface DiaryEntry {
  id: string;
  date: string;
  time: string;
  practiceSkills: string[];
  interventions: number;
  riskBehaviors: boolean;
  riskLevel: 'low' | 'moderate' | 'high';
}

export default function DiaryScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [minSelectableDate, setMinSelectableDate] = useState(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  const computeRiskLevel = (entry: any): 'low' | 'moderate' | 'high' => {
    if (entry?.riskLevel === 'low' || entry?.riskLevel === 'moderate' || entry?.riskLevel === 'high') {
      return entry.riskLevel as 'low' | 'moderate' | 'high';
    }
    const behaviors = entry?.behaviors || [];
    const mapById = (id: number) => behaviors.find((b: any) => b.behaviorId === id)?.hasHappened === true;
    const intentoSuicidio = mapById(4);
    const ideacionSuicida = mapById(3);
    const autolesion = mapById(2);
    const impulsiva = mapById(8);
    const sustancias = mapById(6) || mapById(5);
    if (intentoSuicidio || ideacionSuicida) return 'high';
    if (autolesion || impulsiva || sustancias) return 'moderate';
    return 'low';
  };

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await loadUser<any>();
      const userId = (user?.id ?? user?.userId ?? 1) as number;
      const res = await get<{ data: any[] }>(`/diaries/user/${userId}`);
      const list = Array.isArray(res.data) ? res.data : (res as any)?.data || [];
      const mapped: DiaryEntry[] = list.map((d: any, idx: number) => {
        const dateStr: string = d.entryDate || d.createdAt || new Date().toISOString();
        const dt = new Date(dateStr);
        const practiceSkills: string[] = Array.isArray(d.skillActivities)
          ? d.skillActivities.map((sa: any) => sa?.subSkill?.name || 'Habilidad')
          : [];
        const interventions: number = Array.isArray(d.skillActivities) ? d.skillActivities.length : 0;
        const riskBehaviors: boolean = Array.isArray(d.behaviors) && d.behaviors.some((b: any) => b.hasHappened === true);
        const riskLevel = computeRiskLevel(d);
        return {
          id: String(d.id ?? idx + 1),
          date: toLocalYYYYMMDD(dt),
          time: dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          practiceSkills,
          interventions,
          riskBehaviors,
          riskLevel,
        };
      });
      setDiaryEntries(mapped);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'No se pudo cargar los diarios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useFocusEffect(useCallback(() => { loadEntries(); }, [loadEntries]));

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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-400';
      case 'moderate': return 'bg-yellow-400';
      case 'high': return 'bg-red-400';
      default: return 'bg-gray-500';
    }
  };

  const getRiskBarClass = (level: string) => {
    // Barra superior uniforme en violeta para todas las tarjetas
    return 'bg-violet-500';
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'low': return 'Bajo';
      case 'moderate': return 'Moderado';
      case 'high': return 'Alto';
      default: return 'Sin datos';
    }
  };

  const formatDate = (dateString: string) => {
    const date = fromYYYYMMDDLocal(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateInRange = (entryDate: string, filter: string) => {
    const entry = fromYYYYMMDDLocal(entryDate);
    const today = new Date();
    switch (filter) {
      case 'week': {
        const dow = today.getDay();
        const mondayOffset = (dow + 6) % 7;
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        start.setDate(today.getDate() - mondayOffset);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return entry.getTime() >= start.getTime() && entry.getTime() <= end.getTime();
      }
      case 'month': {
        return entry.getMonth() === today.getMonth() && entry.getFullYear() === today.getFullYear();
      }
      case 'custom': {
        if (customDateRange.start) {
          return isSameLocalDay(entry, customDateRange.start);
        }
        return true;
      }
      case 'all':
      default:
        return true;
    }
  };

  const filteredEntries = useMemo(
    () => diaryEntries
      .filter(entry => isDateInRange(entry.date, selectedFilter))
      .sort((a, b) => {
        const ta = new Date(`${a.date}T${a.time}`).getTime();
        const tb = new Date(`${b.date}T${b.time}`).getTime();
        return tb - ta;
      }),
    [diaryEntries, selectedFilter, customDateRange.start, customDateRange.end]
  );

  const hasSelectedDateEntry = useMemo(() => {
    return diaryEntries.some((e) => isSameLocalDay(e.date, selectedDate));
  }, [diaryEntries, selectedDate]);

  useEffect(() => {
    if (customDateRange.start && selectedFilter !== 'custom') {
      setSelectedFilter('custom');
    }
  }, [customDateRange.start]);

  const generateCalendarDays = (): (number | null)[] => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const selectDate = (day: number | null) => {
    if (day) {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const today = new Date();
      const minDay = new Date(minSelectableDate);
      minDay.setHours(0, 0, 0, 0);
      const dMid = new Date(newDate);
      dMid.setHours(0, 0, 0, 0);
      if (dMid < minDay) return;
      if (newDate > today) return;
      setSelectedDate(newDate);
      setCustomDateRange({ start: newDate, end: newDate });
      setSelectedFilter('custom');
      setShowDatePicker(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/background/bg2.png')}
      resizeMode="cover"
      style={{ flex: 1 }}
      imageStyle={{ opacity: 1 }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-16 pb-4">
          <View className="items-center">
            <Text className="text-2xl font-bold text-indigo-600 mb-1">
              Diario
            </Text>
            <Text className="text-indigo-500">
              Registro de tus actividades y estado emocional diario
            </Text>
          </View>
        </View>

        {/* Filtros de fecha */}
        <View className="px-6 mb-6">
          <View className="bg-white/70 rounded-xl p-4">
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center mb-3"
            >
              <Image 
                source={require('../../assets/images/icons/calendar-icon.png')}
                resizeMode="contain"
                style={{ width: 20, height: 20, marginRight: 8 }}
              />
              <Text className="text-indigo-600 font-medium">Seleccionar fecha</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'month', label: 'Mes' },
                  { key: 'week', label: 'Semana' }
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setSelectedFilter(filter.key)}
                    className={`px-4 py-2 rounded-full border mr-1 ${
                      selectedFilter === filter.key
                        ? 'bg-indigo-400 border-indigo-400'
                        : 'bg-white border-indigo-200'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedFilter === filter.key
                          ? 'text-white'
                          : 'text-indigo-600'
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Mostrar fecha seleccionada si es custom */}
            {selectedFilter === 'custom' && customDateRange.start && (
              <View className="mt-3 p-2 bg-white/70 border border-indigo-100 rounded-lg">
                <Text className="text-indigo-700 text-sm font-medium">
                  Fecha seleccionada: {customDateRange.start.toLocaleDateString('es-ES')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Listado de fichas */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-indigo-700 mb-4">
            Registros diarios
          </Text>
          {isLoading && (
            <View className="items-center justify-center py-8">
              <Text className="text-indigo-600">Cargando diarios…</Text>
            </View>
          )}
          {error && !isLoading && (
            <View className="items-center justify-center py-8">
              <Text className="text-red-600">{error}</Text>
            </View>
          )}

          {!hasSelectedDateEntry && (
            <Link href="/diary-form" asChild>
              <TouchableOpacity 
                 className="bg-white/100 rounded-2xl p-8 shadow-sm items-center border border-indigo-100 mb-5"
               >
                <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 border border-indigo-100 shadow-sm">
                  <Image 
                    source={require('../../assets/images/diary.png')}
                    resizeMode="contain"
                    style={{ width: 40, height: 40 }}
                  />
                </View>
                <Text className="text-xl font-semibold text-indigo-700 mb-2">
                  Sin registros
                </Text>
                <Text className="text-indigo-600 text-center mb-4">
                  El día {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} no has llenado tu diario.
                </Text>
                <View className="bg-indigo-400 px-6 py-3 rounded-full shadow-sm">
                  <Text className="text-white font-semibold">
                    Crear registro
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          )}

          {filteredEntries.map((entry) => (
            <TouchableOpacity key={entry.id} onPress={() => router.push(`/diary-form?diaryId=${entry.id}`)} className="bg-white/100 rounded-2xl overflow-hidden mb-5 shadow-sm border border-indigo-100">
              {/* Barra superior de nivel de riesgo (completa) */}
              <View className={`flex-row items-center justify-between px-4 py-3 ${getRiskBarClass(entry.riskLevel)} rounded-t-2xl`}>
                <Text className="text-white text-sm font-semibold">{getRiskText(entry.riskLevel)}</Text>
                <View className={`w-3 h-3 rounded-full ${getRiskColor(entry.riskLevel)}`} />
              </View>

              {/* Contenido de la tarjeta */}
              <View className="p-6">
                {/* Fecha y hora */}
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-indigo-700">
                    {formatDate(entry.date)}
                  </Text>
                  <Text className="text-indigo-500">
                    {entry.time}
                  </Text>
                </View>

                {/* Habilidades practicadas */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-indigo-700 mb-2">
                    Habilidades practicadas:
                  </Text>
                  <View className="flex-row flex-wrap">
                    {entry.practiceSkills.map((skill, index) => (
                      <View key={index} className="bg-pink-50 rounded-full px-4 py-2 mr-2 mb-2 border border-indigo-100 shadow-sm">
                        <Text className="text-indigo-700 text-sm">
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                
              </View>
            </TouchableOpacity>
          ))}

          {/* Mensaje cuando no hay entradas */}
          {filteredEntries.length === 0 && hasSelectedDateEntry && (
            <Link href="/diary-form" asChild>
              <TouchableOpacity 
                 className="bg-white/100 rounded-2xl p-8 shadow-sm items-center border border-indigo-100"
               >
                <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 border border-indigo-100 shadow-sm">
                  <Image 
                    source={require('../../assets/images/diary.png')}
                    resizeMode="contain"
                    style={{ width: 40, height: 40 }}
                  />
                </View>
                <Text className="text-xl font-semibold text-indigo-700 mb-2">
                  Sin registros
                </Text>
                <Text className="text-indigo-600 text-center mb-4">
                  El día {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} no has llenado tu diario.
                </Text>
                <View className="bg-indigo-400 px-6 py-3 rounded-full shadow-sm">
                  <Text className="text-white font-semibold">
                    Crear registro
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      </ScrollView>

      {/* Modal del calendario */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-20">
          <View className="bg-white rounded-2xl p-6 m-4 w-80 border border-indigo-100 shadow-sm">
            {/* Header del calendario */}
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity
                onPress={() => {
                  const candidate = new Date(selectedDate);
                  candidate.setMonth(candidate.getMonth() - 1);
                  const minMonth = new Date(minSelectableDate);
                  const isBeforeMinMonth = candidate.getFullYear() < minMonth.getFullYear() || (candidate.getFullYear() === minMonth.getFullYear() && candidate.getMonth() < minMonth.getMonth());
                  if (isBeforeMinMonth) return;
                  setSelectedDate(candidate);
                }}
                className="p-2"
              >
                <Text className="text-indigo-500 text-xl">←</Text>
              </TouchableOpacity>
              
              <Text className="text-indigo-700 text-lg font-semibold">
                {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity
                onPress={() => {
                  const today = new Date();
                  const candidate = new Date(selectedDate);
                  candidate.setMonth(candidate.getMonth() + 1);
                  const isFutureMonth = candidate.getFullYear() > today.getFullYear() || (candidate.getFullYear() === today.getFullYear() && candidate.getMonth() > today.getMonth());
                  if (isFutureMonth) return;
                  setSelectedDate(candidate);
                }}
                className="p-2"
              >
                <Text className="text-indigo-500 text-xl">→</Text>
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View className="flex-row mb-2">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => (
                <View key={index} className="flex-1 items-center p-2">
                  <Text className="font-semibold text-indigo-500">{day}</Text>
                </View>
              ))}
            </View>

            {/* Días del calendario */}
            <View className="flex-row flex-wrap">
              {generateCalendarDays().map((day, index) => {
                const today = new Date();
                const candidate = !!day ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day) : null;
                const minDay = new Date(minSelectableDate);
                minDay.setHours(0, 0, 0, 0);
                const candMid = candidate ? new Date(candidate) : null;
                if (candMid) candMid.setHours(0, 0, 0, 0);
                const isFuture = !!candMid && (candMid > today);
                const isBeforeReg = !!candMid && (candMid < minDay);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => (!isFuture && !isBeforeReg ? selectDate(day) : null)}
                    className="w-1/7 aspect-square items-center justify-center"
                    style={{ width: '14.28%' }}
                  >
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                      day && customDateRange.start && 
                      day === customDateRange.start.getDate() && 
                      selectedDate.getMonth() === customDateRange.start.getMonth()
                        ? 'bg-indigo-400'
                        : ''
                    }`}>
                      <Text className={`${
                        day && customDateRange.start && 
                        day === customDateRange.start.getDate() && 
                        selectedDate.getMonth() === customDateRange.start.getMonth()
                          ? 'text-white font-bold'
                          : day ? ((isFuture || isBeforeReg) ? 'text-indigo-300' : 'text-indigo-700') : 'text-transparent'
                      }`}>
                        {day || ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botones del modal */}
            <View className="flex-row justify-end mt-4 space-x-3">
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="px-4 py-2 rounded-lg bg-white border border-indigo-200"
              >
                <Text className="text-indigo-700 font-medium">Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setSelectedFilter('all');
                  setCustomDateRange({ start: null, end: null });
                  setShowDatePicker(false);
                }}
                className="px-4 py-2 rounded-lg bg-indigo-400"
              >
                <Text className="text-white font-medium">Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}