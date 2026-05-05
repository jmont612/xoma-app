import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { get } from '../lib/api';
import { toDateFromUnknown, toLocalYYYYMMDD } from '../lib/date';
import { loadAvatarUri, loadUser } from '../lib/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayName, setDisplayName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

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
    const todayMid = new Date(today);
    todayMid.setHours(0, 0, 0, 0);
    
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
        isFuture: curMid > todayMid,
        isBeforeReg: false,
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
  const [recentSkills, setRecentSkills] = useState<{ subSkillId: number; name: string; skillId: number }[]>([]);
  const recentSkillsFetchLockRef = useRef(false);
  const recentSkillsPendingRef = useRef(false);
  const recentSkillsRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [subSkillIconById, setSubSkillIconById] = useState<Record<number, string>>({});
  const subSkillIconFetchLockRef = useRef(false);

  

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

  useEffect(() => { loadDaySkills(selectedDate); }, [selectedDate, loadDaySkills]);
  
  useFocusEffect(useCallback(() => { loadDaySkills(); }, [loadDaySkills]));

  const mapSkillBgById = (id: number) => {
    if (id === 1) return '#DFF4FC';
    if (id === 2) return '#CFF1E2';
    return '#EAF5F5';
  };

  const getFallbackPoolBySkillId = (skillId: number) => {
    if (skillId === 1) return ['❄️', '🧊', '💧', '🫧', '🌡️', '🧴', '🧼', '🧽'];
    if (skillId === 2) return ['🏃', '🤸', '🧗', '🚶', '🏋️', '🥊', '🧎', '⚡'];
    return ['🫁', '🌬️', '🧘', '👁️', '💪', '🧍', '🧠', '🌿'];
  };

  const pickTechniqueIcon = (name: string, used: Set<string>, fallbackPool: string[]) => {
    const n = String(name || '').toLowerCase();
    const preferred: string[] = [];

    if (n.includes('diafrag')) preferred.push('🫁');
    if (n.includes('cuadr')) preferred.push('⬛');
    if (n.includes('muscul')) preferred.push('💪');
    if (n.includes('visual')) preferred.push('👁️');
    if (n.includes('escaneo') || n.includes('corporal') || n.includes('cuerpo')) preferred.push('🧍');
    if (n.includes('mindful') || n.includes('atención plena')) preferred.push('🧘');
    if (n.includes('respira') || n.includes('inhal') || n.includes('exhal')) preferred.push('🌬️');

    if (n.includes('frío') || n.includes('frio') || n.includes('hielo')) preferred.push('🧊');
    if (n.includes('temperat') || n.includes('agua')) preferred.push('💧');

    if (n.includes('ejerc') || n.includes('correr') || n.includes('camin')) preferred.push('🏃');
    if (n.includes('salt') || n.includes('burpee') || n.includes('sentad')) preferred.push('🤸');

    const candidates = [...preferred, ...fallbackPool];
    for (const icon of candidates) {
      if (!used.has(icon)) {
        used.add(icon);
        return icon;
      }
    }

    const icon = fallbackPool[0] || '•';
    used.add(icon);
    return icon;
  };

  const loadSubSkillIcons = useCallback(async () => {
    if (subSkillIconFetchLockRef.current) return;
    subSkillIconFetchLockRef.current = true;
    try {
      const res = await get<{ data: { id: number; name: string; deletedAt: any; subSkills: { id: number; name: string; deletedAt: any }[] }[] }>('/skills');
      const list = res.data || [];
      const map: Record<number, string> = {};
      list.forEach((skill) => {
        const used = new Set<string>();
        const fallbackPool = getFallbackPoolBySkillId(skill.id);
        (skill.subSkills || []).forEach((ss) => {
          map[ss.id] = pickTechniqueIcon(ss.name, used, fallbackPool);
        });
      });
      setSubSkillIconById(map);
    } catch {
      setSubSkillIconById({});
    } finally {
      subSkillIconFetchLockRef.current = false;
    }
  }, []);

  const loadRecentSkills = useCallback(async () => {
    if (recentSkillsFetchLockRef.current) {
      recentSkillsPendingRef.current = true;
      return;
    }
    recentSkillsFetchLockRef.current = true;
    try {
      const me = await loadUser<any>();
      const userId = (me?.id ?? me?.userId ?? 1) as number;

      let rawActivities: any[] = [];
      try {
        const res = await get<{ data: any[] }>(`/user-skill-activities/user/${userId}`);
        rawActivities = Array.isArray(res?.data) ? res.data : (res as any)?.data || [];
      } catch {
        const merged: any[] = [];
        for (let i = 0; i < 14 && merged.length < 80; i += 1) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = toLocalYYYYMMDD(d);
          try {
            const res = await get<{ data: any[] }>(`/user-skill-activities/user/${userId}?date=${ds}`);
            const arr: any[] = Array.isArray(res?.data) ? res.data : (res as any)?.data || [];
            merged.push(...arr);
          } catch {}
        }
        rawActivities = merged;
      }

      const normalized: { key: string; subSkillId: number; name: string; skillId: number; createdAt: Date }[] = [];
      rawActivities.forEach((sa: any, idx: number) => {
        const status = String(sa?.status ?? '').trim().toLowerCase();
        if (status !== 'completed') return;

        const subSkillId = Number(sa?.subSkill?.id ?? sa?.subSkillId ?? sa?.sub_skill_id ?? 0);
        if (!Number.isFinite(subSkillId) || subSkillId <= 0) return;

        const createdAt = toDateFromUnknown(sa?.completedAt ?? sa?.createdAt ?? sa?.created_at ?? sa?.date ?? sa?.timestamp ?? new Date());
        const name = String(sa?.subSkill?.name ?? sa?.subSkillName ?? sa?.name ?? 'Habilidad').trim() || 'Habilidad';
        const skillIdRaw = Number(sa?.subSkill?.skill?.id ?? sa?.subSkill?.skillId ?? sa?.skill?.id ?? sa?.skillId ?? sa?.skill_id ?? 0);
        const skillId = Number.isFinite(skillIdRaw) && skillIdRaw > 0 ? skillIdRaw : 3;
        const key = String(sa?.id ?? `${subSkillId}-${createdAt.getTime()}-${idx}`);
        normalized.push({ key, subSkillId, name, skillId, createdAt });
      });

      normalized.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const out: { subSkillId: number; name: string; skillId: number }[] = [];
      const seen = new Set<string>();
      for (const item of normalized) {
        if (seen.has(item.key)) continue;
        seen.add(item.key);
        out.push({ subSkillId: item.subSkillId, name: item.name, skillId: item.skillId });
        if (out.length >= 4) break;
      }
      setRecentSkills(out);
    } catch {
      setRecentSkills([]);
    } finally {
      recentSkillsFetchLockRef.current = false;
      if (recentSkillsPendingRef.current) {
        recentSkillsPendingRef.current = false;
        if (recentSkillsRefreshTimerRef.current) clearTimeout(recentSkillsRefreshTimerRef.current);
        recentSkillsRefreshTimerRef.current = setTimeout(() => {
          loadRecentSkills();
        }, 800);
      }
    }
  }, []);

  useEffect(() => { loadSubSkillIcons(); }, [loadSubSkillIcons]);
  useFocusEffect(useCallback(() => { loadSubSkillIcons(); }, [loadSubSkillIcons]));
  useEffect(() => { loadRecentSkills(); }, [loadRecentSkills]);
  useFocusEffect(useCallback(() => { loadRecentSkills(); }, [loadRecentSkills]));

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('skill-completed', () => {
      const today = new Date();
      loadDaySkills(today);
      loadEmaCount(today);
      loadSubSkillIcons();
      loadRecentSkills();
      recentSkillsPendingRef.current = true;
      if (recentSkillsRefreshTimerRef.current) clearTimeout(recentSkillsRefreshTimerRef.current);
      recentSkillsRefreshTimerRef.current = setTimeout(() => {
        loadRecentSkills();
      }, 900);
    });
    return () => { sub.remove(); };
  }, [loadDaySkills, loadEmaCount, loadRecentSkills, loadSubSkillIcons]);

  useEffect(() => {
    (async () => {
      try {
        const me = await loadUser<any>();
        const alias = String(me?.username || me?.alias || '').trim();
        const name = String(me?.firstName || me?.nombres || me?.name || '').trim();
        setDisplayName(alias || name || '');
      } catch {
        setDisplayName('');
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const uri = await loadAvatarUri();
      setAvatarUri(uri);
    })();
    const sub = DeviceEventEmitter.addListener('avatar-updated', (payload?: any) => {
      setAvatarUri(payload?.uri || null);
    });
    return () => { sub.remove(); };
  }, []);

  // Función para manejar selección de fecha
  const handleDateSelect = (date: Date) => {
    const today = new Date();
    const todayMid = new Date(today);
    todayMid.setHours(0, 0, 0, 0);
    const dMid = new Date(date);
    dMid.setHours(0, 0, 0, 0);
    if (dMid > todayMid) return;
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
    const todayMid = new Date(today);
    todayMid.setHours(0, 0, 0, 0);

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
        isFuture: curMid > todayMid,
        isBeforeReg: false,
      });
    }

    return weekDays;
  };

  const weekDays = generateWeekDays();
  const isTodaySelected = toLocalYYYYMMDD(selectedDate) === toLocalYYYYMMDD(new Date());

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
    <View className="flex-1 bg-neutral">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header con Perfil y Calendario */}
        <View className="px-6 pt-16 mb-8 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-gray-300 mr-4 overflow-hidden border-2 border-white shadow-sm">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Image source={require('../../assets/images/logo.png')} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              )}
            </View>
            <Text className="text-primary text-xl font-bold">
              {`Hola, ${displayName || 'Elena'}`}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowCalendar(true)}>
            <Text className="text-primary text-2xl">📅</Text>
          </TouchableOpacity>
        </View>

        {/* Calendario semanal */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between">
            {weekDays.map((day, index) => (
              <TouchableOpacity 
                key={index} 
                className="items-center"
                onPress={() => (!day.isFuture ? setSelectedDate(day.fullDate) : null)}
              >
                <Text className="text-gray-500 text-xs font-medium uppercase mb-3">{day.day.substring(0, 2)}</Text>
                <View
                  className="items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9999,
                    overflow: 'hidden',
                    backgroundColor: day.isSelected ? '#2D5A6E' : (day.isToday ? '#8FB9A8' : 'transparent'),
                  }}
                >
                  <Text className={`font-bold text-base ${
                    day.isSelected || day.isToday
                      ? 'text-white'
                      : (day.isFuture ? 'text-gray-300' : 'text-gray-600')
                  }`}>
                    {day.date}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Secciones principales */}
        <View className="px-6 space-y-6">
          
          {isTodaySelected ? (
            <View className="bg-white rounded-[32px] mb-2 p-8 shadow-sm">
              <Text className="text-primary text-3xl font-extrabold text-center mb-4 leading-tight">
                ¿Cómo te sientes{'\n'}ahora?
              </Text>
              <Text className="text-gray-500 text-center text-sm mb-8 px-4">
                Tómate un momento para conectar con tus emociones actuales.
              </Text>
              <TouchableOpacity
                onPress={() => handleWriteDiary('evaluacion-emocional')}
                className="bg-primary rounded-full py-4 shadow-sm"
              >
                <Text className="text-white text-center font-bold text-lg">
                  Comenzar evaluación
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white rounded-[32px] mb-2 p-8 shadow-sm">
              <Text className="text-primary text-xs font-bold uppercase tracking-widest mb-4">
                RESUMEN DEL DÍA
              </Text>
              <Text className="text-gray-800 text-3xl font-extrabold mb-2">
                {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </Text>
              <Text className="text-gray-500 mb-6">
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long' })}
              </Text>

              {(emaCount > 0 || daySkillCount > 0) ? (
                <View>
                  <View className="flex-row mb-5" style={{ gap: 10 }}>
                    <View className="flex-1 bg-[#EAF5F5] rounded-full px-4 py-3 border border-primary/10">
                      <Text className="text-primary font-bold text-center">
                        {emaCount} evaluación{emaCount === 1 ? '' : 'es'}
                      </Text>
                    </View>
                    <View className="flex-1 bg-[#CFF1E2] rounded-full px-4 py-3 border border-primary/10">
                      <Text className="text-primary font-bold text-center">
                        {daySkillCount} habilidad{daySkillCount === 1 ? '' : 'es'}
                      </Text>
                    </View>
                  </View>

                  {daySkillNames.length > 0 && (
                    <View className="bg-[#F8FAF9] rounded-[24px] p-5 border border-gray-100">
                      <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-3">
                        HABILIDADES COMPLETADAS
                      </Text>
                      <Text className="text-gray-700 leading-6">
                        {daySkillNames.slice(0, 3).join(', ')}{daySkillNames.length > 3 ? '…' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  <Text className="text-gray-500 mb-6 leading-6">
                    No hay registros para este día.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/diary-form')}
                    className="bg-primary rounded-full py-4 shadow-sm"
                  >
                    <Text className="text-white text-center font-bold text-lg">
                      Crear registro
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View>
            {/* Estadísticas/Widgets (Agregados para coincidir con el diseño) */}
            <View className="flex-row mt-4 mb-8">
              {/* Widget 1: Progreso semanal */}
              <View className="flex-1 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 overflow-hidden relative mr-4">
                <View className="absolute w-32 h-32 rounded-full bg-[#EAF5F5] -bottom-10 -right-10 opacity-50" />
                <View className="mb-4">
                  <Text className="text-2xl text-primary">✨</Text>
                </View>
                <Text className="text-gray-800 font-bold text-base mb-2">
                  Progreso{'\n'}semanal
                </Text>
                <Text className="text-gray-500 text-xs">
                  Has mantenido tu racha por 5 días.
                </Text>
              </View>

              {/* Widget 2: Estado de ánimo */}
              <View className="flex-1 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 overflow-hidden relative">
                <View className="absolute w-32 h-32 rounded-full bg-[#CFF1E2] -bottom-10 -right-10 opacity-30" />
                <View className="mb-4">
                  <Text className="text-2xl text-primary">💚</Text>
                </View>
                <Text className="text-gray-800 font-bold text-base mb-2">
                  Estado de ánimo
                </Text>
                <Text className="text-gray-500 text-xs">
                  Predominantemente estable.
                </Text>
              </View>
            </View>
          </View>

          {/* Tarjeta 2: Frase del día */}
          <View className="bg-white rounded-[32px] mb-2 p-8 shadow-sm">
            <Text className="text-primary text-xs font-bold uppercase tracking-widest mb-6">
              FRASE DEL DÍA
            </Text>
            <Text className="text-gray-800 text-2xl italic font-serif mb-6 leading-relaxed">
              “El descanso es una forma de resistencia.”
            </Text>
            <View className="flex-row items-center">
              <View className="w-8 h-px bg-gray-300 mr-3" />
              <Text className="text-gray-400 text-sm italic">
                Tricia Hersey
              </Text>
            </View>
          </View>

          {/* Tarjeta 3: Habilidades realizadas */}
          <View className="mb-2 mt-4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-gray-800 text-xl font-bold">Habilidades realizadas</Text>
              <TouchableOpacity onPress={() => router.push('/habilities')}>
                <Text className="text-secondary text-sm font-medium">Ver todas</Text>
              </TouchableOpacity>
            </View>
            
            {recentSkills.length === 0 ? (
              <View className="bg-white rounded-[28px] p-6 border border-gray-100">
                <Text className="text-gray-500 leading-6">
                  Aún no tienes habilidades realizadas. Explora una habilidad y completa una técnica para verla aquí.
                </Text>
              </View>
            ) : (
              <View className="flex-row justify-between" style={{ gap: 14 }}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const item = recentSkills[i];
                  if (!item) {
                    return (
                      <View key={`placeholder-${i}`} className="items-center opacity-40 flex-1">
                        <View className="w-16 h-16 rounded-full bg-[#F3F4F6] items-center justify-center mb-2 shadow-sm" />
                        <Text className="text-[10px] font-bold text-gray-400 uppercase">—</Text>
                      </View>
                    );
                  }

                  const icon = subSkillIconById[item.subSkillId] || pickTechniqueIcon(item.name, new Set<string>(), getFallbackPoolBySkillId(item.skillId));
                  return (
                    <TouchableOpacity
                      key={`${item.subSkillId}-${i}`}
                      className="items-center flex-1"
                      onPress={() => router.push(`/sub-skill?subSkillId=${item.subSkillId}`)}
                      activeOpacity={0.9}
                    >
                      <View
                        className="w-16 h-16 rounded-full items-center justify-center mb-2 shadow-sm"
                        style={{ backgroundColor: mapSkillBgById(item.skillId) }}
                      >
                        <Text className="text-primary text-2xl">{icon}</Text>
                      </View>
                      <Text className="text-[10px] font-bold text-gray-800 uppercase" numberOfLines={1}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Tarjeta 4: Respira con suavidad */}
          <View className="bg-[#EAF5F5] rounded-[32px] p-10 items-center justify-center mb-6 shadow-sm overflow-hidden relative">
            <View className="absolute w-40 h-40 rounded-full border border-primary/10 items-center justify-center">
              <View className="w-24 h-24 rounded-full border border-primary/20 items-center justify-center">
                <View className="w-16 h-16 rounded-full bg-primary/10" />
              </View>
            </View>
            <Text className="text-primary font-medium text-lg z-10 mt-12">
              Respira con suavidad
            </Text>
          </View>
          
        </View>

        {/* Espaciado inferior para la barra de navegación absoluta */}
        <View className="h-32" />
      </ScrollView>

      {/* Modal del calendario */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View className="flex-1 bg-black bg-opacity-20 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 m-4 w-11/12 max-w-sm shadow-sm">
            {/* Header del calendario */}
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Text className="text-gray-500 text-xl">‹</Text>
              </TouchableOpacity>
              <Text className="text-primary text-lg font-bold capitalize">
                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Text className="text-gray-500 text-xl">›</Text>
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View className="flex-row justify-between mb-2">
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, index) => (
                <Text key={index} className="text-gray-400 text-sm w-8 text-center font-bold">
                  {day}
                </Text>
              ))}
            </View>

            {/* Días del calendario */}
            <View className="flex-row flex-wrap">
              {generateCalendar().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => (day.isCurrentMonth && !day.isFuture) ? handleDateSelect(day.date) : null}
                  className="items-center justify-center m-1"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9999,
                    overflow: 'hidden',
                    backgroundColor: day.isSelected ? '#2D5A6E'
                      : day.isToday ? '#8FB9A8'
                        : day.isCurrentMonth ? (day.isFuture ? 'rgba(255,255,255,0.4)' : '#FFFFFF')
                          : 'transparent',
                  }}
                >
                  <Text className={`text-sm font-medium ${
                    day.isSelected || day.isToday ? 'text-white' :
                    day.isCurrentMonth ? (day.isFuture ? 'text-gray-300' : 'text-gray-600') : 'text-gray-300'
                  }`}>
                    {day.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity
              onPress={() => setShowCalendar(false)}
              className="bg-primary rounded-xl py-3 mt-4"
            >
              <Text className="text-white text-center font-medium">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
