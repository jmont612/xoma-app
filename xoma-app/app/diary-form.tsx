import Slider from "@react-native-community/slider";
import { router, useLocalSearchParams } from "expo-router";
import { post, patch, get } from "./lib/api";
import { loadUser } from "./lib/storage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

const DEFAULT_EMOTIONS: EmotionState = {
  alegria: 5,
  tristeza: 5,
  miedo: 5,
  ira: 5,
  culpa: 5,
  verguenza: 5,
  rechazo: 5,
};
const DEFAULT_YESNO: YesNoQuestions = {
  pensoAutolesion: null,
  autolesion: null,
  ideacionSuicida: null,
  intentoSuicidio: null,
  pensoSustancias: null,
  usoSustancias: null,
  pensoConductaImpulsiva: null,
  conductaImpulsiva: null,
};

type EmotionKey = keyof EmotionState;
type YesNoKey = keyof YesNoQuestions;

type DialogState =
  | { type: "success" | "error"; title: string; message: string; closeAction?: "back" }
  | null;

const EmotionSliderRow = React.memo(function EmotionSliderRow(props: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onCommit: (value: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  const { label, icon, value, onCommit, leftLabel, rightLabel } = props;
  const [tempValue, setTempValue] = useState<number>(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  return (
    <View className="bg-white rounded-[28px] p-5 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-[#CFF1E2] items-center justify-center mr-3">
            {icon}
          </View>
          <Text className="text-gray-800 font-bold">{label}</Text>
        </View>
        <Text className="text-primary font-bold">{Math.round(tempValue)}</Text>
      </View>

      <View className="mt-3">
        <Slider
          style={{ width: "100%", height: 40 }}
          minimumValue={0}
          maximumValue={10}
          value={tempValue}
          onValueChange={(v) => setTempValue(v)}
          onSlidingComplete={(v) => onCommit(Math.round(v))}
          minimumTrackTintColor="#2D5A6E"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#2D5A6E"
          step={1}
        />
        <View className="flex-row justify-between mt-1">
          <Text className="text-gray-400 text-[10px] font-semibold">
            {leftLabel}
          </Text>
          <Text className="text-gray-400 text-[10px] font-semibold">
            {rightLabel}
          </Text>
        </View>
      </View>
    </View>
  );
});

const YesNoRow = React.memo(function YesNoRow(props: {
  label: string;
  value: boolean | null;
  onChange: (next: boolean) => void;
}) {
  const { label, value, onChange } = props;
  const yesSelected = value === true;
  const noSelected = value === false;

  return (
    <View className="flex-row items-center justify-between bg-white/70 rounded-[22px] px-4 py-4 border border-primary/10 mb-3">
      <Text className="text-gray-800 font-medium flex-1 pr-4">{label}</Text>
      <View className="flex-row bg-white rounded-full p-1 border border-gray-100">
        <TouchableOpacity
          onPress={() => onChange(false)}
          className={`px-4 py-2 rounded-full ${noSelected ? "bg-primary" : "bg-transparent"}`}
        >
          <Text
            className={`text-xs font-bold ${noSelected ? "text-white" : "text-gray-500"}`}
          >
            No
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onChange(true)}
          className={`px-4 py-2 rounded-full ${yesSelected ? "bg-primary" : "bg-transparent"}`}
        >
          <Text
            className={`text-xs font-bold ${yesSelected ? "text-white" : "text-gray-500"}`}
          >
            Sí
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function DiaryFormScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId?: string }>();
  const editingDiaryId = diaryId ? Number(diaryId) : null;
  const [emotions, setEmotions] = useState<EmotionState>(DEFAULT_EMOTIONS);

  const [yesNoAnswers, setYesNoAnswers] =
    useState<YesNoQuestions>(DEFAULT_YESNO);

  const [textAnswers, setTextAnswers] = useState({
    dificultad: "",
    ayuda: "",
  });
  const MAX_REFLEXION_CHARS = 300;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const baselineRef = useRef<{
    emotions: EmotionState;
    yesNo: YesNoQuestions;
    text: { dificultad: string; ayuda: string };
  }>({
    emotions: DEFAULT_EMOTIONS,
    yesNo: DEFAULT_YESNO,
    text: { dificultad: "", ayuda: "" },
  });

  useEffect(() => {
    (async () => {
      if (!editingDiaryId) return;
      try {
        const user = await loadUser<any>();
        const userId = (user?.id ?? user?.userId ?? 1) as number;
        const res = await get<{ data: any[] }>(`/diaries/user/${userId}`);
        const list = Array.isArray(res.data)
          ? res.data
          : (res as any)?.data || [];
        const found = list.find((d: any) => Number(d.id) === editingDiaryId);
        if (!found) return;
        const moodKeyById: Record<number, keyof EmotionState> = {
          1: "alegria",
          2: "tristeza",
          3: "miedo",
          4: "ira",
          5: "culpa",
          6: "verguenza",
          7: "rechazo",
        };
        const newEmotions: EmotionState = {
          alegria: 5,
          tristeza: 5,
          miedo: 5,
          ira: 5,
          culpa: 5,
          verguenza: 5,
          rechazo: 5,
        };
        (found.moodStates || []).forEach((ms: any) => {
          const key = moodKeyById[ms.moodStateId as number];
          if (key) newEmotions[key] = Number(ms.rating) || 0;
        });
        setEmotions(newEmotions);

        const behaviorKeyById: Record<number, keyof YesNoQuestions> = {
          1: "pensoAutolesion",
          2: "autolesion",
          3: "ideacionSuicida",
          4: "intentoSuicidio",
          5: "pensoSustancias",
          6: "usoSustancias",
          7: "pensoConductaImpulsiva",
          8: "conductaImpulsiva",
        };
        const newYesNo: YesNoQuestions = {
          pensoAutolesion: null,
          autolesion: null,
          ideacionSuicida: null,
          intentoSuicidio: null,
          pensoSustancias: null,
          usoSustancias: null,
          pensoConductaImpulsiva: null,
          conductaImpulsiva: null,
        };
        (found.behaviors || []).forEach((b: any) => {
          const key = behaviorKeyById[b.behaviorId as number];
          if (key) newYesNo[key] = !!b.hasHappened;
        });
        setYesNoAnswers(newYesNo);

        const filledText = {
          dificultad: found.reflections?.mostDifficultToday || "",
          ayuda: found.reflections?.mostHelpfulToday || "",
        };
        setTextAnswers(filledText);
        baselineRef.current = {
          emotions: newEmotions,
          yesNo: newYesNo,
          text: filledText,
        };
      } catch {}
    })();
  }, [editingDiaryId]);

  const textFilled = useMemo(() => {
    return (
      textAnswers.dificultad.trim().length > 0 &&
      textAnswers.ayuda.trim().length > 0
    );
  }, [textAnswers]);

  const isComplete = useMemo(() => {
    const yesnoOk = Object.values(yesNoAnswers).every((v) => v !== null);
    return yesnoOk && textFilled;
  }, [yesNoAnswers, textFilled]);

  const isDirty = useMemo(() => {
    const emotionsChanged =
      JSON.stringify(emotions) !== JSON.stringify(baselineRef.current.emotions);
    const yesNoChanged =
      JSON.stringify(yesNoAnswers) !==
      JSON.stringify(baselineRef.current.yesNo);
    const textChanged =
      JSON.stringify(textAnswers) !== JSON.stringify(baselineRef.current.text);
    return emotionsChanged || yesNoChanged || textChanged;
  }, [emotions, yesNoAnswers, textAnswers]);

  const emotionConfig: {
    key: EmotionKey;
    label: string;
    icon: string;
    left: string;
    right: string;
  }[] = [
    {
      key: "alegria",
      label: "Alegría",
      icon: "😊",
      left: "CALMA",
      right: "INTENSIDAD 0-10",
    },
    {
      key: "tristeza",
      label: "Tristeza",
      icon: "😢",
      left: "LEVE",
      right: "PROFUNDA",
    },
    {
      key: "miedo",
      label: "Miedo",
      icon: "😨",
      left: "LEVE",
      right: "INTENSO",
    },
    { key: "ira", label: "Ira", icon: "🔥", left: "CALMA", right: "INTENSA" },
    {
      key: "culpa",
      label: "Culpa",
      icon: "😔",
      left: "LEVE",
      right: "INTENSA",
    },
    {
      key: "verguenza",
      label: "Vergüenza",
      icon: "😳",
      left: "LEVE",
      right: "INTENSA",
    },
    {
      key: "rechazo",
      label: "Rechazo",
      icon: "🤢",
      left: "LEVE",
      right: "INTENSO",
    },
  ];

  const yesNoQuestions = [
    { key: "pensoAutolesion", label: "Pensaste en autolesionarte?" },
    { key: "autolesion", label: "Te autolesionaste?" },
    { key: "ideacionSuicida", label: "Tuviste ideación suicida?" },
    { key: "intentoSuicidio", label: "Lo intentaste?" },
    { key: "pensoSustancias", label: "Pensaste en usar sustancias?" },
    { key: "usoSustancias", label: "Usaste sustancias?" },
    {
      key: "pensoConductaImpulsiva",
      label: "Pensaste en realizar alguna conducta impulsiva?",
    },
    {
      key: "conductaImpulsiva",
      label:
        "Tuviste alguna conducta impulsiva (ej. atracones, compras, peleas)?",
    },
  ];

  const handleEmotionChange = useCallback(
    (emotion: EmotionKey, value: number) => {
      setEmotions((prev) => ({ ...prev, [emotion]: value }));
    },
    [],
  );

  const handleYesNoChange = useCallback(
    (question: YesNoKey, value: boolean) => {
      setYesNoAnswers((prev) => ({ ...prev, [question]: value }));
    },
    [],
  );

  const handleSubmit = async () => {
    // Validar que todas las preguntas de sí/no estén respondidas
    const unansweredQuestions = Object.values(yesNoAnswers).some(
      (answer) => answer === null,
    );

    if (unansweredQuestions) {
      Alert.alert(
        "Formulario incompleto",
        "Por favor responde todas las preguntas de sí/no.",
      );
      return;
    }

    if (!isComplete) {
      Alert.alert(
        "Formulario incompleto",
        "Por favor completa todos los campos requeridos.",
      );
      return;
    }
    try {
      if (isSubmitting) return;
      setIsSubmitting(true);
      const user = await loadUser<any>();
      const userId = (user?.id ?? user?.userId ?? 1) as number;

      const moodStateOrder: (keyof EmotionState)[] = [
        "alegria",
        "tristeza",
        "miedo",
        "ira",
        "culpa",
        "verguenza",
        "rechazo",
      ];
      const moodStates = moodStateOrder.map((key, idx) => ({
        moodStateId: idx + 1,
        rating: Math.round(emotions[key]),
      }));

      const behaviorOrder: (keyof YesNoQuestions)[] = [
        "pensoAutolesion",
        "autolesion",
        "ideacionSuicida",
        "intentoSuicidio",
        "pensoSustancias",
        "usoSustancias",
        "pensoConductaImpulsiva",
        "conductaImpulsiva",
      ];
      const behaviors = behaviorOrder.map((key, idx) => ({
        behaviorId: idx + 1,
        hasHappened: yesNoAnswers[key] === true,
      }));

      const payload = {
        userId,
        moodStates,
        behaviors,
        reflections: {
          mostDifficultToday: textAnswers.dificultad.trim(),
          mostHelpfulToday: textAnswers.ayuda.trim(),
        },
      };

      if (editingDiaryId) {
        await patch<any>(`/diaries/${editingDiaryId}`, payload);
        setDialog({
          type: "success",
          title: "Cambios guardados",
          message: "Tu registro ha sido actualizado.",
          closeAction: "back",
        });
      } else {
        await post<any>("/diaries", payload);
        setDialog({
          type: "success",
          title: "Registro guardado",
          message: "Tu entrada del diario ha sido guardada exitosamente.",
          closeAction: "back",
        });
      }
    } catch (err: any) {
      const msg =
        err?.code === "NETWORK_ERROR"
          ? `No se pudo conectar con el servidor${err?.url ? `: ${err.url}` : ""}`
          : err?.message || "No se pudo guardar el diario";
      setDialog({ type: "error", title: "Error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-neutral">
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-6"
          onPress={() => {
            if (dialog?.closeAction === "back") {
              setDialog(null);
              router.back();
              return;
            }
            setDialog(null);
          }}
        >
          <Pressable
            className="w-full bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm"
            onPress={() => {}}
          >
            <View className="items-center">
              <View
                className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${dialog?.type === "success" ? "bg-[#EAF5F5]" : "bg-[#F9EAEA]"}`}
              >
                <Text
                  className={`text-2xl font-extrabold ${dialog?.type === "success" ? "text-primary" : "text-[#C84A4A]"}`}
                >
                  {dialog?.type === "success" ? "✓" : "!"}
                </Text>
              </View>
              <Text className="text-gray-900 text-lg font-extrabold text-center">
                {dialog?.title}
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">
                {dialog?.message}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (dialog?.closeAction === "back") {
                  setDialog(null);
                  router.back();
                  return;
                }
                setDialog(null);
              }}
              className="mt-6 rounded-full py-4 bg-primary active:bg-primary/90"
            >
              <Text className="text-white text-center font-bold text-base">
                {dialog?.type === "success" ? "Listo" : "Entendido"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <View className="px-6 pt-14 pb-2">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center h-10"
            >
              <View className="w-10 h-10 items-center justify-center -ml-2 mr-1">
                <Text
                  className="text-primary text-xl"
                  style={{ includeFontPadding: false, lineHeight: 20 }}
                >
                  ←
                </Text>
              </View>
              <Text
                className="text-primary text-sm font-bold"
                style={{ includeFontPadding: false, lineHeight: 16 }}
              >
                Volver
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-3xl font-extrabold text-gray-900 mt-4">
            {editingDiaryId ? "Editar Registro" : "Nuevo Registro"}
          </Text>
          <Text className="text-gray-400 text-sm mt-2 leading-relaxed">
            Tómate un momento para conectar contigo mismo.
          </Text>
        </View>

        <View className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-800 font-extrabold text-lg">
              Mis Emociones
            </Text>
            <View className="bg-[#EAF5F5] px-4 py-2 rounded-full border border-primary/10">
              <Text className="text-primary text-xs font-bold">
                Intensidad 0-10
              </Text>
            </View>
          </View>

          {emotionConfig.map((e) => (
            <EmotionSliderRow
              key={e.key}
              label={e.label}
              icon={<Text className="text-base">{e.icon}</Text>}
              value={emotions[e.key]}
              onCommit={(v) => handleEmotionChange(e.key, v)}
              leftLabel={e.left}
              rightLabel={e.right}
            />
          ))}

          <View className="bg-[#DDF4F3] rounded-[28px] p-6 mt-4 mb-6 border border-primary/10">
            <Text className="text-gray-800 font-extrabold text-base mb-2">
              Comportamientos y Promocionismo
            </Text>
            <Text className="text-gray-600 text-xs mb-5">
              Responde con honestidad, este es un espacio seguro para ti.
            </Text>

            {yesNoQuestions.map((q) => (
              <YesNoRow
                key={q.key}
                label={q.label}
                value={yesNoAnswers[q.key as YesNoKey]}
                onChange={(next) => handleYesNoChange(q.key as YesNoKey, next)}
              />
            ))}
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-6">
            <Text className="text-gray-800 font-extrabold text-base mb-6">
              Reflexiones del día
            </Text>

            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-3">
                Lo que más me costó hoy fue...
              </Text>
              <View className="bg-[#F8FAF9] rounded-[22px] border border-gray-100">
                <TextInput
                  value={textAnswers.dificultad}
                  onChangeText={(text) =>
                    setTextAnswers((prev) => ({ ...prev, dificultad: text }))
                  }
                  placeholder="Escribe aquí..."
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#2D5A6E"
                  multiline
                  numberOfLines={4}
                  maxLength={MAX_REFLEXION_CHARS}
                  className="p-4 text-gray-700"
                  textAlignVertical="top"
                />
              </View>
              <View className="flex-row justify-between mt-2 px-1">
                <Text className="text-gray-400 text-xs">
                  Máx. {MAX_REFLEXION_CHARS} caracteres
                </Text>
                <Text className="text-gray-400 text-xs">
                  {textAnswers.dificultad.length}/{MAX_REFLEXION_CHARS}
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-gray-700 font-semibold mb-3">
                Lo que me ayudó hoy fue...
              </Text>
              <View className="bg-[#F8FAF9] rounded-[22px] border border-gray-100">
                <TextInput
                  value={textAnswers.ayuda}
                  onChangeText={(text) =>
                    setTextAnswers((prev) => ({ ...prev, ayuda: text }))
                  }
                  placeholder="Escribe aquí..."
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#2D5A6E"
                  multiline
                  numberOfLines={4}
                  maxLength={MAX_REFLEXION_CHARS}
                  className="p-4 text-gray-700"
                  textAlignVertical="top"
                />
              </View>
              <View className="flex-row justify-between mt-2 px-1">
                <Text className="text-gray-400 text-xs">
                  Máx. {MAX_REFLEXION_CHARS} caracteres
                </Text>
                <Text className="text-gray-400 text-xs">
                  {textAnswers.ayuda.length}/{MAX_REFLEXION_CHARS}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-[#EAF5F5] rounded-[28px] h-32 mb-6 overflow-hidden">
            <View className="absolute w-64 h-64 rounded-full bg-[#CFF1E2] -top-32 -left-32 opacity-60" />
            <View className="absolute w-64 h-64 rounded-full bg-[#DFF4FC] -bottom-40 -right-32 opacity-60" />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !isComplete || !isDirty}
            className={`rounded-full py-5 shadow-sm ${isSubmitting || !isComplete || !isDirty ? "bg-primary/60" : "bg-primary active:bg-primary/90"}`}
          >
            <Text className="text-white text-center font-bold text-base">
              {isSubmitting
                ? "Guardando…"
                : editingDiaryId
                  ? "Guardar Registro"
                  : "Guardar Registro"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
