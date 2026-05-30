import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DeviceEventEmitter,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { get } from "../lib/api";
import { getDefaultAvatarByGender } from "../lib/avatar";
import { isSameLocalDay, toDateFromUnknown, toLocalYYYYMMDD } from "../lib/date";
import { loadAvatarUri, loadUser } from "../lib/storage";

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [selectedDiaryId, setSelectedDiaryId] = useState<number | null>(null);

  // Función para generar el calendario del mes
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
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

  const [hasEma, setHasEma] = useState<boolean>(false);
  const [lastEmaRisk, setLastEmaRisk] = useState<string | null>(null);
  const [daySkillCount, setDaySkillCount] = useState<number>(0);
  const [daySkillNames, setDaySkillNames] = useState<string[]>([]);
  const dailySummaryFetchLockRef = useRef(false);
  const [recentSkills, setRecentSkills] = useState<
    { subSkillId: number; name: string }[]
  >([]);
  const recentSkillsFetchLockRef = useRef(false);
  const [subSkillIconById, setSubSkillIconById] = useState<
    Record<number, string>
  >({});
  const [subSkillSkillIdById, setSubSkillSkillIdById] = useState<
    Record<number, number>
  >({});
  const subSkillIconFetchLockRef = useRef(false);
  const [weekStreak, setWeekStreak] = useState<number>(0);
  const [consecutiveStreak, setConsecutiveStreak] = useState<number>(0);

  const getRiskPresentation = (risk: string | null) => {
    if (risk === "ALTO")
      return { label: "Riesgo alto", bg: "#FEE2E2", textClass: "text-red-700" };
    if (risk === "MEDIO")
      return {
        label: "Riesgo medio",
        bg: "#FEF0C7",
        textClass: "text-orange-700",
      };
    return { label: "Riesgo bajo", bg: "#EAF5F5", textClass: "text-primary" };
  };

  // Resumen del día (items 2 y 5): último EMA + habilidades de la fecha seleccionada
  const loadDailySummary = useCallback(
    async (date?: Date) => {
      if (dailySummaryFetchLockRef.current) return;
      dailySummaryFetchLockRef.current = true;
      try {
        const me = await loadUser<any>();
        const userId = (me?.id ?? me?.userId ?? 1) as number;
        const target = new Date(date ?? selectedDate);
        const dateStr = toLocalYYYYMMDD(target);
        const res = await get<{
          data: { lastEma: any[]; skillActivities: any[] };
        }>(`/ema-logs/user/${userId}/daily-summary?date=${dateStr}`);
        const summary = res?.data || { lastEma: [], skillActivities: [] };

        const lastEma = Array.isArray(summary.lastEma) ? summary.lastEma : [];
        setHasEma(lastEma.length > 0);
        const risk = lastEma.find((l: any) => l?.riskLevel)?.riskLevel ?? null;
        setLastEmaRisk(risk ? String(risk).toUpperCase() : null);

        const activities = Array.isArray(summary.skillActivities)
          ? summary.skillActivities
          : [];
        const names: string[] = [];
        let completedCount = 0;
        activities.forEach((sa: any) => {
          if (
            String(sa?.status ?? "")
              .trim()
              .toLowerCase() === "completed"
          ) {
            completedCount += 1;
            names.push(String(sa?.subSkill?.name || sa?.name || "Habilidad"));
          }
        });
        setDaySkillCount(completedCount);
        setDaySkillNames(Array.from(new Set(names)));
      } catch {
        setHasEma(false);
        setLastEmaRisk(null);
        setDaySkillCount(0);
        setDaySkillNames([]);
      } finally {
        dailySummaryFetchLockRef.current = false;
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    loadDailySummary(selectedDate);
  }, [selectedDate, loadDailySummary]);
  useFocusEffect(
    useCallback(() => {
      loadDailySummary(selectedDate);
    }, [selectedDate, loadDailySummary]),
  );

  // Diario del día seleccionado (items 4 y 5): saber si ya existe para
  // ofrecer editar en lugar de crear, y evitar duplicados.
  const loadSelectedDayDiary = useCallback(
    async (date?: Date) => {
      try {
        const me = await loadUser<any>();
        const userId = (me?.id ?? me?.userId ?? 1) as number;
        const target = new Date(date ?? selectedDate);
        const res = await get<{ data: any[] }>(`/diaries/user/${userId}`);
        const list = Array.isArray(res?.data) ? res.data : [];
        const match = list.find((d: any) =>
          isSameLocalDay(
            toDateFromUnknown(d?.entryDate ?? d?.createdAt),
            target,
          ),
        );
        setSelectedDiaryId(match ? Number(match.id) : null);
      } catch {
        setSelectedDiaryId(null);
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    loadSelectedDayDiary(selectedDate);
  }, [selectedDate, loadSelectedDayDiary]);
  useFocusEffect(
    useCallback(() => {
      loadSelectedDayDiary(selectedDate);
    }, [selectedDate, loadSelectedDayDiary]),
  );

  // Racha semanal (item 3)
  const loadWeeklyStreak = useCallback(async () => {
    try {
      const me = await loadUser<any>();
      const userId = (me?.id ?? me?.userId ?? 1) as number;
      const res = await get<{
        data: { weekStreak: number; consecutiveStreak: number };
      }>(`/diaries/user/${userId}/weekly-streak`);
      setWeekStreak(Number(res?.data?.weekStreak ?? 0));
      setConsecutiveStreak(Number(res?.data?.consecutiveStreak ?? 0));
    } catch {
      setWeekStreak(0);
      setConsecutiveStreak(0);
    }
  }, []);

  useEffect(() => {
    loadWeeklyStreak();
  }, [loadWeeklyStreak]);
  useFocusEffect(
    useCallback(() => {
      loadWeeklyStreak();
    }, [loadWeeklyStreak]),
  );

  const mapSkillBgById = (id: number) => {
    if (id === 1) return "#DFF4FC";
    if (id === 2) return "#CFF1E2";
    return "#EAF5F5";
  };

  const getFallbackPoolBySkillId = (skillId: number) => {
    if (skillId === 1) return ["❄️", "🧊", "💧", "🫧", "🌡️", "🧴", "🧼", "🧽"];
    if (skillId === 2) return ["🏃", "🤸", "🧗", "🚶", "🏋️", "🥊", "🧎", "⚡"];
    return ["🫁", "🌬️", "🧘", "👁️", "💪", "🧍", "🧠", "🌿"];
  };

  const pickTechniqueIcon = (
    name: string,
    used: Set<string>,
    fallbackPool: string[],
  ) => {
    const n = String(name || "").toLowerCase();
    const preferred: string[] = [];

    if (n.includes("diafrag")) preferred.push("🫁");
    if (n.includes("cuadr")) preferred.push("⬛");
    if (n.includes("muscul")) preferred.push("💪");
    if (n.includes("visual")) preferred.push("👁️");
    if (n.includes("escaneo") || n.includes("corporal") || n.includes("cuerpo"))
      preferred.push("🧍");
    if (n.includes("mindful") || n.includes("atención plena"))
      preferred.push("🧘");
    if (n.includes("respira") || n.includes("inhal") || n.includes("exhal"))
      preferred.push("🌬️");

    if (n.includes("frío") || n.includes("frio") || n.includes("hielo"))
      preferred.push("🧊");
    if (n.includes("temperat") || n.includes("agua")) preferred.push("💧");

    if (n.includes("ejerc") || n.includes("correr") || n.includes("camin"))
      preferred.push("🏃");
    if (n.includes("salt") || n.includes("burpee") || n.includes("sentad"))
      preferred.push("🤸");

    const candidates = [...preferred, ...fallbackPool];
    for (const icon of candidates) {
      if (!used.has(icon)) {
        used.add(icon);
        return icon;
      }
    }

    const icon = fallbackPool[0] || "•";
    used.add(icon);
    return icon;
  };

  const loadSubSkillIcons = useCallback(async () => {
    if (subSkillIconFetchLockRef.current) return;
    subSkillIconFetchLockRef.current = true;
    try {
      const res = await get<{
        data: {
          id: number;
          name: string;
          deletedAt: any;
          subSkills: { id: number; name: string; deletedAt: any }[];
        }[];
      }>("/skills");
      const list = res.data || [];
      const iconMap: Record<number, string> = {};
      const skillIdMap: Record<number, number> = {};
      list.forEach((skill) => {
        const used = new Set<string>();
        const fallbackPool = getFallbackPoolBySkillId(skill.id);
        (skill.subSkills || []).forEach((ss) => {
          iconMap[ss.id] = pickTechniqueIcon(ss.name, used, fallbackPool);
          skillIdMap[ss.id] = skill.id;
        });
      });
      setSubSkillIconById(iconMap);
      setSubSkillSkillIdById(skillIdMap);
    } catch {
      setSubSkillIconById({});
      setSubSkillSkillIdById({});
    } finally {
      subSkillIconFetchLockRef.current = false;
    }
  }, []);

  // Últimas 4 habilidades del día (item 4)
  const loadRecentSkills = useCallback(async () => {
    if (recentSkillsFetchLockRef.current) return;
    recentSkillsFetchLockRef.current = true;
    try {
      const me = await loadUser<any>();
      const userId = (me?.id ?? me?.userId ?? 1) as number;
      const res = await get<{ data: any[] }>(
        `/user-skill-activities/user/${userId}/today?limit=4`,
      );
      const list = Array.isArray(res?.data) ? res.data : [];
      const out = list
        .map((sa: any) => ({
          subSkillId: Number(sa?.subSkill?.id ?? sa?.subSkillId ?? 0),
          name:
            String(sa?.subSkill?.name ?? sa?.name ?? "Habilidad").trim() ||
            "Habilidad",
        }))
        .filter((s) => Number.isFinite(s.subSkillId) && s.subSkillId > 0);
      setRecentSkills(out);
    } catch {
      setRecentSkills([]);
    } finally {
      recentSkillsFetchLockRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadSubSkillIcons();
  }, [loadSubSkillIcons]);
  useFocusEffect(
    useCallback(() => {
      loadSubSkillIcons();
    }, [loadSubSkillIcons]),
  );
  useEffect(() => {
    loadRecentSkills();
  }, [loadRecentSkills]);
  useFocusEffect(
    useCallback(() => {
      loadRecentSkills();
    }, [loadRecentSkills]),
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("skill-completed", () => {
      const today = new Date();
      loadDailySummary(today);
      loadSubSkillIcons();
      loadRecentSkills();
      loadWeeklyStreak();
      loadSelectedDayDiary(selectedDate);
    });
    return () => {
      sub.remove();
    };
  }, [
    loadDailySummary,
    loadRecentSkills,
    loadSubSkillIcons,
    loadWeeklyStreak,
    loadSelectedDayDiary,
    selectedDate,
  ]);

  useEffect(() => {
    (async () => {
      try {
        const me = await loadUser<any>();
        const alias = String(me?.username || me?.alias || "").trim();
        const name = String(
          me?.firstName || me?.nombres || me?.name || "",
        ).trim();
        setDisplayName(alias || name || "");
        setGender(String(me?.gender || me?.genero || "").trim());
      } catch {
        setDisplayName("");
        setGender("");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const uri = await loadAvatarUri();
      setAvatarUri(uri);
    })();
    const sub = DeviceEventEmitter.addListener(
      "avatar-updated",
      (payload?: any) => {
        setAvatarUri(payload?.uri || null);
      },
    );
    return () => {
      sub.remove();
    };
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
    const dayNames = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sáb", "Do"];
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
  const isTodaySelected =
    toLocalYYYYMMDD(selectedDate) === toLocalYYYYMMDD(new Date());

  const handleWriteDiary = (type: string) => {
    if (type === "evaluacion-emocional") {
      router.push("/ema");
    } else {
      console.log(`Comenzar evaluación ${type}`);
    }
  };

  return (
    <View className="flex-1 bg-neutral">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header con Perfil y Calendario */}
        <View className="px-6 pt-16 mb-8 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-gray-300 mr-4 overflow-hidden border-2 border-white shadow-sm">
              <Image
                source={
                  avatarUri ? { uri: avatarUri } : getDefaultAvatarByGender(gender)
                }
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <Text className="text-primary text-xl font-bold">
              {`Hola, ${displayName || "Elena"}`}
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
                onPress={() =>
                  !day.isFuture ? setSelectedDate(day.fullDate) : null
                }
              >
                <Text className="text-gray-500 text-xs font-medium uppercase mb-3">
                  {day.day.substring(0, 2)}
                </Text>
                <View
                  className="items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 9999,
                    overflow: "hidden",
                    backgroundColor: day.isSelected
                      ? "#2D5A6E"
                      : day.isToday
                        ? "#8FB9A8"
                        : "transparent",
                  }}
                >
                  <Text
                    className={`font-bold text-base ${
                      day.isSelected || day.isToday
                        ? "text-white"
                        : day.isFuture
                          ? "text-gray-300"
                          : "text-gray-600"
                    }`}
                  >
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
                ¿Cómo te sientes{"\n"}ahora?
              </Text>
              <Text className="text-gray-500 text-center text-sm mb-8 px-4">
                Tómate un momento para conectar con tus emociones actuales.
              </Text>
              <TouchableOpacity
                onPress={() => handleWriteDiary("evaluacion-emocional")}
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
                {selectedDate.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                })}
              </Text>
              <Text className="text-gray-500 mb-6">
                {selectedDate.toLocaleDateString("es-ES", { weekday: "long" })}
              </Text>

              {hasEma || daySkillCount > 0 ? (
                <View className="mb-6">
                  <View className="flex-row mb-5" style={{ gap: 10 }}>
                    <View
                      className="flex-1 rounded-full px-4 py-3 border border-primary/10"
                      style={{
                        backgroundColor: hasEma
                          ? getRiskPresentation(lastEmaRisk).bg
                          : "#EAF5F5",
                      }}
                    >
                      <Text
                        className={`font-bold text-center ${hasEma ? getRiskPresentation(lastEmaRisk).textClass : "text-primary/50"}`}
                      >
                        {hasEma
                          ? getRiskPresentation(lastEmaRisk).label
                          : "Sin evaluación"}
                      </Text>
                    </View>
                    <View className="flex-1 bg-[#CFF1E2] rounded-full px-4 py-3 border border-primary/10">
                      <Text className="text-primary font-bold text-center">
                        {daySkillCount} habilidad
                        {daySkillCount === 1 ? "" : "es"}
                      </Text>
                    </View>
                  </View>

                  {daySkillNames.length > 0 && (
                    <View className="bg-[#F8FAF9] rounded-[24px] p-5 border border-gray-100">
                      <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-3">
                        HABILIDADES COMPLETADAS
                      </Text>
                      <Text className="text-gray-700 leading-6">
                        {daySkillNames.slice(0, 3).join(", ")}
                        {daySkillNames.length > 3 ? "…" : ""}
                      </Text>
                    </View>
                  )}
                </View>
              ) : !selectedDiaryId ? (
                <Text className="text-gray-500 mb-6 leading-6">
                  No hay registros para este día.
                </Text>
              ) : null}

              {selectedDiaryId ? (
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/diary-form?diaryId=${selectedDiaryId}`)
                  }
                  className="bg-primary rounded-full py-4 shadow-sm"
                >
                  <Text className="text-white text-center font-bold text-lg">
                    Editar registro
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/diary-form?date=${toLocalYYYYMMDD(selectedDate)}`,
                    )
                  }
                  className="bg-primary rounded-full py-4 shadow-sm"
                >
                  <Text className="text-white text-center font-bold text-lg">
                    Crear registro
                  </Text>
                </TouchableOpacity>
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
                  Progreso{"\n"}semanal
                </Text>
                <Text className="text-gray-500 text-xs">
                  {consecutiveStreak > 0
                    ? `Llevas ${consecutiveStreak} día${consecutiveStreak === 1 ? "" : "s"} seguidos.`
                    : weekStreak > 0
                      ? `${weekStreak} día${weekStreak === 1 ? "" : "s"} con registro esta semana.`
                      : "Aún no tienes registros esta semana."}
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
                {hasEma ? (
                  <View
                    className="self-start rounded-full px-3 py-1"
                    style={{ backgroundColor: getRiskPresentation(lastEmaRisk).bg }}
                  >
                    <Text
                      className={`text-xs font-bold ${getRiskPresentation(lastEmaRisk).textClass}`}
                    >
                      {getRiskPresentation(lastEmaRisk).label}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-500 text-xs">
                    Sin evaluación este día.
                  </Text>
                )}
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
              <Text className="text-gray-800 text-xl font-bold">
                Habilidades realizadas
              </Text>
              <TouchableOpacity onPress={() => router.push("/habilities")}>
                <Text className="text-secondary text-sm font-medium">
                  Ver todas
                </Text>
              </TouchableOpacity>
            </View>

            {recentSkills.length === 0 ? (
              <View className="bg-white rounded-[28px] p-6 border border-gray-100">
                <Text className="text-gray-500 leading-6">
                  Aún no tienes habilidades realizadas. Explora una habilidad y
                  completa una técnica para verla aquí.
                </Text>
              </View>
            ) : (
              <View className="flex-row justify-between" style={{ gap: 14 }}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const item = recentSkills[i];
                  if (!item) {
                    return (
                      <View
                        key={`placeholder-${i}`}
                        className="items-center opacity-40 flex-1"
                      >
                        <View className="w-16 h-16 rounded-full bg-[#F3F4F6] items-center justify-center mb-2 shadow-sm" />
                        <Text className="text-[10px] font-bold text-gray-400 uppercase">
                          —
                        </Text>
                      </View>
                    );
                  }

                  const skillId = subSkillSkillIdById[item.subSkillId] ?? 3;
                  const icon =
                    subSkillIconById[item.subSkillId] ||
                    pickTechniqueIcon(
                      item.name,
                      new Set<string>(),
                      getFallbackPoolBySkillId(skillId),
                    );
                  return (
                    <TouchableOpacity
                      key={`${item.subSkillId}-${i}`}
                      className="items-center flex-1"
                      onPress={() =>
                        router.push(`/sub-skill?subSkillId=${item.subSkillId}`)
                      }
                      activeOpacity={0.9}
                    >
                      <View
                        className="w-16 h-16 rounded-full items-center justify-center mb-2 shadow-sm"
                        style={{ backgroundColor: mapSkillBgById(skillId) }}
                      >
                        <Text className="text-primary text-2xl">{icon}</Text>
                      </View>
                      <Text
                        className="text-[10px] font-bold text-gray-800 uppercase"
                        numberOfLines={1}
                      >
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
                {currentMonth.toLocaleDateString("es-ES", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Text className="text-gray-500 text-xl">›</Text>
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View className="flex-row justify-between mb-2">
              {["D", "L", "M", "X", "J", "V", "S"].map((day, index) => (
                <Text
                  key={index}
                  className="text-gray-400 text-sm w-8 text-center font-bold"
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Días del calendario */}
            <View className="flex-row flex-wrap">
              {generateCalendar().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() =>
                    day.isCurrentMonth && !day.isFuture
                      ? handleDateSelect(day.date)
                      : null
                  }
                  className="items-center justify-center m-1"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9999,
                    overflow: "hidden",
                    backgroundColor: day.isSelected
                      ? "#2D5A6E"
                      : day.isToday
                        ? "#8FB9A8"
                        : day.isCurrentMonth
                          ? day.isFuture
                            ? "rgba(255,255,255,0.4)"
                            : "#FFFFFF"
                          : "transparent",
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      day.isSelected || day.isToday
                        ? "text-white"
                        : day.isCurrentMonth
                          ? day.isFuture
                            ? "text-gray-300"
                            : "text-gray-600"
                          : "text-gray-300"
                    }`}
                  >
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
