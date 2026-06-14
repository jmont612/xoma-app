import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { get } from "../lib/api";
import {
  fromYYYYMMDDLocal,
  isSameLocalDay,
  toLocalYYYYMMDD,
  toDateFromUnknown,
} from "../lib/date";
import { loadUser } from "../lib/storage";

interface DiaryEntry {
  id: string;
  date: string;
  time: string;
  practiceSkills: string[];
  interventions: number;
  riskBehaviors: boolean;
  riskLevel: "low" | "moderate" | "high";
  emaRiskLevel: "BAJO" | "MEDIO" | "ALTO" | null;
}

export default function DiaryScreen() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [customDateRange, setCustomDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  const computeRiskLevel = (entry: any): "low" | "moderate" | "high" => {
    if (
      entry?.riskLevel === "low" ||
      entry?.riskLevel === "moderate" ||
      entry?.riskLevel === "high"
    ) {
      return entry.riskLevel as "low" | "moderate" | "high";
    }
    const behaviors = entry?.behaviors || [];
    const mapById = (id: number) =>
      behaviors.find((b: any) => b.behaviorId === id)?.hasHappened === true;
    const intentoSuicidio = mapById(4);
    const ideacionSuicida = mapById(3);
    const autolesion = mapById(2);
    const impulsiva = mapById(8);
    const sustancias = mapById(6) || mapById(5);
    if (intentoSuicidio || ideacionSuicida) return "high";
    if (autolesion || impulsiva || sustancias) return "moderate";
    return "low";
  };

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await loadUser<any>();
      const userId = (user?.id ?? user?.userId ?? 1) as number;
      const res = await get<{ data: any[] }>(`/diaries/user/${userId}`);
      const list = Array.isArray(res.data)
        ? res.data
        : (res as any)?.data || [];
      const mapped: DiaryEntry[] = list.map((d: any, idx: number) => {
        const dateStr: string =
          d.entryDate || d.createdAt || new Date().toISOString();
        const dt = new Date(dateStr);
        const practiceSkills: string[] = Array.isArray(d.skillActivities)
          ? d.skillActivities.map(
              (sa: any) => sa?.subSkill?.name || "Habilidad",
            )
          : [];
        const interventions: number = Array.isArray(d.skillActivities)
          ? d.skillActivities.length
          : 0;
        const riskBehaviors: boolean =
          Array.isArray(d.behaviors) &&
          d.behaviors.some((b: any) => b.hasHappened === true);
        const riskLevel = computeRiskLevel(d);
        return {
          id: String(d.id ?? idx + 1),
          date: toLocalYYYYMMDD(dt),
          time: dt.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          practiceSkills,
          interventions,
          riskBehaviors,
          riskLevel,
          emaRiskLevel: null,
        };
      });

      // Cargar EMA para cada fecha única del diario
      const uniqueDates = [...new Set(mapped.map((e) => e.date))];
      const emaByDate: Record<string, "BAJO" | "MEDIO" | "ALTO" | null> = {};
      await Promise.all(
        uniqueDates.map(async (dateKey) => {
          try {
            const localMidnight = fromYYYYMMDDLocal(dateKey);
            localMidnight.setHours(0, 0, 0, 0);
            const isoDate = encodeURIComponent(localMidnight.toISOString());
            const emaRes = await get<{ data: { lastEma: any[] } }>(
              `/ema-logs/user/${userId}/daily-summary?date=${isoDate}`,
            );
            const lastEma = emaRes?.data?.lastEma ?? [];
            const risk = lastEma.find((l: any) => l?.riskLevel)?.riskLevel ?? null;
            emaByDate[dateKey] = risk as "BAJO" | "MEDIO" | "ALTO" | null;
          } catch {
            emaByDate[dateKey] = null;
          }
        }),
      );

      setDiaryEntries(
        mapped.map((e) => ({ ...e, emaRiskLevel: emaByDate[e.date] ?? null })),
      );
      setError(null);
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar los diarios");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );

  useEffect(() => {
    (async () => {
      try {
        const me = await loadUser<any>();
        const raw =
          me?.createdAt ??
          me?.created_at ??
          me?.registrationDate ??
          me?.registeredAt;
        const reg = raw ? toDateFromUnknown(raw) : new Date();
        const mid = new Date(reg);
        mid.setHours(0, 0, 0, 0);
      } catch {
        const mid = new Date();
        mid.setHours(0, 0, 0, 0);
      }
    })();
  }, []);

  const formatDate = (dateString: string) => {
    const date = fromYYYYMMDDLocal(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isDateInRange = useMemo(() => {
    return (entryDate: string, filter: string) => {
      const entry = fromYYYYMMDDLocal(entryDate);
      const today = new Date();
      switch (filter) {
        case "week": {
          const dow = today.getDay();
          const mondayOffset = (dow + 6) % 7;
          const start = new Date(today);
          start.setHours(0, 0, 0, 0);
          start.setDate(today.getDate() - mondayOffset);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          return (
            entry.getTime() >= start.getTime() &&
            entry.getTime() <= end.getTime()
          );
        }
        case "month": {
          return (
            entry.getMonth() === today.getMonth() &&
            entry.getFullYear() === today.getFullYear()
          );
        }
        case "custom": {
          if (customDateRange.start) {
            return isSameLocalDay(entry, customDateRange.start);
          }
          return true;
        }
        case "all":
        default:
          return true;
      }
    };
  }, [customDateRange]);

  const filteredEntries = useMemo(
    () =>
      diaryEntries
        .filter((entry) => isDateInRange(entry.date, selectedFilter))
        .sort((a, b) => {
          const ta = new Date(`${a.date}T${a.time}`).getTime();
          const tb = new Date(`${b.date}T${b.time}`).getTime();
          return tb - ta;
        }),
    [diaryEntries, selectedFilter, isDateInRange],
  );

  const hasSelectedDateEntry = useMemo(() => {
    return diaryEntries.some((e) =>
      isSameLocalDay(fromYYYYMMDDLocal(e.date), selectedDate),
    );
  }, [diaryEntries, selectedDate]);

  useEffect(() => {
    if (customDateRange.start && selectedFilter !== "custom") {
      setSelectedFilter("custom");
    }
  }, [customDateRange.start, selectedFilter]);

  useEffect(() => {
    if (!showDatePicker) return;
    setCalendarMonth(new Date(selectedDate));
  }, [showDatePicker, selectedDate]);

  const generateCalendarDays = (monthDate: Date): (number | null)[] => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
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
      const newDate = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        day,
      );
      const today = new Date();
      const todayMid = new Date(today);
      todayMid.setHours(0, 0, 0, 0);
      const dMid = new Date(newDate);
      dMid.setHours(0, 0, 0, 0);
      if (dMid > todayMid) return;
      setSelectedDate(newDate);
      setCustomDateRange({ start: newDate, end: newDate });
      setSelectedFilter("custom");
      setShowDatePicker(false);
    }
  };

  return (
    <View className="flex-1 bg-neutral">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Superior */}
        <View className="px-6 pt-14 pb-4 flex-row items-center justify-between">
          <Text className="text-gray-800 text-xl font-bold">Mi Diario</Text>
        </View>

        {/* Título Principal */}
        <View className="px-6 mb-6">
          {/* Filtro Fecha (Botón) */}
          <View className="flex-row mb-4">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center bg-white rounded-full px-5 py-3 shadow-sm border border-gray-100"
            >
              <Image
                source={require("../../assets/images/icons/calendar-icon.png")}
                resizeMode="contain"
                style={{
                  width: 16,
                  height: 16,
                  marginRight: 8,
                  tintColor: "#2D5A6E",
                }}
              />
              <Text className="text-primary font-bold text-sm mr-2">
                Selecciona una fecha
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filtros (Todos, Mes, Semana) */}
          <View className="flex-row mb-8">
            {[
              { key: "all", label: "Todos" },
              { key: "month", label: "Mes" },
              { key: "week", label: "Semana" },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key)}
                className={`px-6 py-2.5 rounded-full mr-2 shadow-sm ${
                  selectedFilter === filter.key ? "bg-primary" : "bg-white"
                }`}
              >
                <Text
                  className={`font-bold text-sm ${
                    selectedFilter === filter.key
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-6 pb-32">
          {isLoading && (
            <View className="items-center justify-center py-8">
              <Text className="text-primary">Cargando diarios…</Text>
            </View>
          )}
          {!!error && !isLoading && (
            <View className="items-center justify-center py-8">
              <Text className="text-red-600">{error}</Text>
            </View>
          )}

          {/* Estado vacío "Tu espacio de desahogo" */}
          {!hasSelectedDateEntry && !isLoading && (
            <View className="bg-[#F8FAF9] rounded-[32px] p-8 items-center border border-gray-100 shadow-sm mb-10 relative overflow-hidden">
              {/* Círculo verde decorativo de fondo */}
              <View className="absolute w-64 h-64 rounded-full bg-[#EAF5F5] -top-32 -right-10 opacity-50" />

              <View className="w-16 h-16 bg-[#CFF1E2] rounded-full items-center justify-center mb-6 shadow-sm">
                <Text className="text-2xl text-primary">✏️</Text>
              </View>

              <Text className="text-xl font-extrabold text-gray-800 mb-3">
                Tu espacio de desahogo
              </Text>
              <Text className="text-gray-500 text-center mb-8 px-4 leading-relaxed">
                Aún no has escrito hoy. ¿Cómo te{"\n"}sientes?
              </Text>

              <Link href="/diary-form" asChild>
                <TouchableOpacity className="bg-primary px-8 py-4 rounded-full shadow-sm flex-row items-center">
                  <Text className="text-white text-lg mr-2 font-light">+</Text>
                  <Text className="text-white font-bold text-base">
                    Crear registro
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          {filteredEntries.length > 0 && (
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-2">
              ENTRADAS RECIENTES
            </Text>
          )}

          {filteredEntries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => router.push(`/diary-form?diaryId=${entry.id}`)}
              className="bg-white rounded-[32px] overflow-hidden mb-5 shadow-sm border border-gray-100 p-6"
            >
              {/* Fecha y Badge de estado */}
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-gray-500 text-sm font-medium">
                  {formatDate(entry.date)}
                </Text>
                {(() => {
                  const ema = entry.emaRiskLevel;
                  const isHigh = ema === "ALTO" || (!ema && entry.riskLevel === "high");
                  const isMid = ema === "MEDIO" || (!ema && entry.riskLevel === "moderate");
                  const bg = isHigh ? "bg-[#FEE2E2]" : isMid ? "bg-[#FEF0C7]" : "bg-[#CFF1E2]";
                  const textColor = isHigh ? "text-red-700" : isMid ? "text-orange-700" : "text-primary";
                  const icon = isHigh ? "🚨" : isMid ? "⚠️" : "🌿";
                  const label = isHigh ? "Crítico" : isMid ? "Alerta" : "Calma";
                  return (
                    <View className={`px-4 py-2 rounded-full flex-row items-center ${bg}`}>
                      <Text className={`mr-1 text-xs ${textColor}`}>{icon}</Text>
                      <Text className={`font-bold text-xs ${textColor}`}>{label}</Text>
                    </View>
                  );
                })()}
              </View>

              {/* Título */}
              <Text className="text-xl font-bold text-gray-800 mb-3">
                {entry.practiceSkills.length > 0
                  ? entry.practiceSkills[0]
                  : "Registro de diario"}
              </Text>

              {/* Extracto de texto (simulado por ahora) */}
              <Text
                className="text-gray-500 text-sm mb-6 leading-relaxed"
                numberOfLines={2}
              >
                Hoy pude practicar los ejercicios de respiración que aprendí. Me
                sentí mucho...
              </Text>

              {/* Separador */}
              <View className="h-px bg-gray-100 mb-4" />

              {/* Icono inferior e Indicador de flecha */}
              <View className="flex-row justify-between items-center">
                <View className="w-8 h-8 rounded-full bg-[#DFF4FC] items-center justify-center">
                  <Text className="text-xs">💭</Text>
                </View>
                <Text className="text-gray-400 text-xl">→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {showDatePicker && (
        <Modal
          visible
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-20">
            <View className="bg-white rounded-2xl p-6 m-4 w-80 border border-gray-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity
                  onPress={() => {
                    const candidate = new Date(calendarMonth);
                    candidate.setMonth(candidate.getMonth() - 1);
                    setCalendarMonth(candidate);
                  }}
                  className="p-2"
                >
                  <Text className="text-gray-500 text-xl">‹</Text>
                </TouchableOpacity>

                <Text className="text-primary text-lg font-bold capitalize">
                  {calendarMonth.toLocaleDateString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    const today = new Date();
                    const candidate = new Date(calendarMonth);
                    candidate.setMonth(candidate.getMonth() + 1);
                    const isFutureMonth =
                      candidate.getFullYear() > today.getFullYear() ||
                      (candidate.getFullYear() === today.getFullYear() &&
                        candidate.getMonth() > today.getMonth());
                    if (isFutureMonth) return;
                    setCalendarMonth(candidate);
                  }}
                  className="p-2"
                >
                  <Text className="text-gray-500 text-xl">›</Text>
                </TouchableOpacity>
              </View>

              {/* Días de la semana */}
              <View className="flex-row mb-2">
                {["D", "L", "M", "X", "J", "V", "S"].map((day, index) => (
                  <View key={index} className="flex-1 items-center p-2">
                    <Text className="text-gray-400 text-sm w-8 text-center font-bold">
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Días del calendario */}
              <View className="flex-row flex-wrap">
                {generateCalendarDays(calendarMonth).map((day, index) => {
                  const today = new Date();
                  const todayMid = new Date(today);
                  todayMid.setHours(0, 0, 0, 0);
                  const candidate = day
                    ? new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        day,
                      )
                    : null;
                  const candMid = candidate ? new Date(candidate) : null;
                  if (candMid) candMid.setHours(0, 0, 0, 0);
                  const isFuture = !!candMid && candMid > todayMid;
                  const isSelected =
                    !!candidate && isSameLocalDay(candidate, selectedDate);
                  const isToday =
                    !!candidate && isSameLocalDay(candidate, today);
                  const canPick = !!day && !isFuture;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => (canPick ? selectDate(day) : null)}
                      className="items-center justify-center"
                      style={{ width: "14.28%", aspectRatio: 1 }}
                    >
                      <View
                        className="items-center justify-center"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9999,
                          overflow: "hidden",
                          backgroundColor: isSelected
                            ? "#2D5A6E"
                            : isToday
                              ? "#8FB9A8"
                              : "transparent",
                        }}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected || isToday
                              ? "text-white"
                              : day
                                ? isFuture
                                  ? "text-gray-300"
                                  : "text-gray-600"
                                : "text-transparent"
                          }`}
                        >
                          {day || ""}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botones del modal */}
              <View className="flex-row justify-end mt-4">
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 mr-3"
                >
                  <Text className="text-gray-700 font-medium">Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedFilter("all");
                    setCustomDateRange({ start: null, end: null });
                    setShowDatePicker(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary"
                >
                  <Text className="text-white font-medium">Limpiar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
