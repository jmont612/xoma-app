import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { get } from "../lib/api";

interface SkillCard {
  id: string;
  title: string;
  icon: ImageSourcePropType;
  description: string;
}

function mapIconById(id: number): ImageSourcePropType {
  if (id === 1)
    return require("../../assets/images/icons/temperature-icon.png");
  if (id === 2) return require("../../assets/images/icons/intense-icon.png");
  return require("../../assets/images/icons/breath-icon.png");
}

function mapRouteIdById(id: number): string {
  if (id === 1) return "temperature";
  if (id === 2) return "exercise";
  return "breathing";
}

function mapDescriptionById(id: number): string {
  if (id === 1)
    return "Refresca el cuerpo para calmar la intensidad emocional.";
  if (id === 2) return "Activa tu energía con movimiento físico breve.";
  return "Inhala y reten el oxigeno por unos segundos, luego exhala.";
}

export default function HabilitiesScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<
    { id: number; name: string; subSkills: { id: number; name: string }[] }[]
  >([]);

  const handleVerMas = (skillId: string) => {
    router.push(`/skill-detail?skillId=${skillId}`);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await get<{
          data: {
            id: number;
            name: string;
            deletedAt: any;
            subSkills: { id: number; name: string; deletedAt: any }[];
          }[];
        }>("/skills");
        setSkills(res.data || []);
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar habilidades");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View className="flex-1 bg-neutral">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        <View className="px-6 pt-14">
          <Text className="text-4xl font-extrabold text-gray-900 mb-3">
            Habilidades
          </Text>
          <Text className="text-gray-500 leading-6">
            Usa estas técnicas para regular{"\n"}emociones intensas.
          </Text>
        </View>

        <View className="px-6 mt-8">
          {loading && (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#2D5A6E" />
              <Text className="text-primary mt-4 font-semibold">
                Cargando habilidades…
              </Text>
            </View>
          )}

          {error && !loading && (
            <View className="bg-white rounded-[28px] p-6 border border-red-200">
              <Text className="text-red-600">{error}</Text>
            </View>
          )}

          {!loading &&
            !error &&
            skills.map((s) => {
              const routeId = mapRouteIdById(s.id);
              const card: SkillCard = {
                id: routeId,
                title: s.name,
                icon: mapIconById(s.id),
                description: mapDescriptionById(s.id),
              };

              return (
                <View
                  key={card.id}
                  className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-6"
                >
                  <View className="w-12 h-12 rounded-full bg-[#EAF5F5] items-center justify-center mb-4">
                    <Image
                      source={card.icon}
                      resizeMode="contain"
                      style={{ width: 22, height: 22, tintColor: "#2D5A6E" }}
                    />
                  </View>

                  <Text className="text-gray-900 text-lg font-extrabold mb-2">
                    {card.title}
                  </Text>
                  <Text className="text-gray-500 mb-6 leading-6">
                    {card.description}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleVerMas(card.id)}
                    className="bg-primary rounded-full py-4 items-center"
                  >
                    <Text className="text-white font-bold">Ver más</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

          <View className="bg-[#EAF5F5] rounded-[32px] h-44 overflow-hidden">
            <View className="absolute w-72 h-72 rounded-full bg-[#CFF1E2] -top-44 -left-44 opacity-70" />
            <View className="absolute w-72 h-72 rounded-full bg-[#DFF4FC] -bottom-44 -right-44 opacity-70" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
