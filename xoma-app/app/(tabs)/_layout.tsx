import { Image } from "expo-image";
import { Tabs } from "expo-router";
import React from "react";
import { View, Text } from "react-native";

export default function TabLayout() {
  return (
    <View className="flex-1 bg-neutral">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "white",
            borderTopWidth: 0,
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            height: 72,
            marginHorizontal: 16, // Reducido para hacer la barra más ancha
            paddingHorizontal: 8, // Agregado padding interno para empujar los íconos
            marginBottom: 24,
            borderRadius: 40,
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 0, // Evita que se sume el safe area inset abajo
          },
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
            height: 72,
            paddingTop: 0,
            paddingBottom: 0,
          },
          tabBarIconStyle: {
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
          },
          tabBarShowLabel: false, // We will render the label manually inside the icon wrapper
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ focused }) => (
              <View
                className={`w-[76px] h-[52px] rounded-[24px] items-center justify-center ${focused ? "bg-[#EAF5F5]" : "bg-transparent"}`}
              >
                <Image
                  source={require("../../assets/images/home.png")}
                  contentFit="contain"
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: focused ? "#2D5A6E" : "#9CA3AF",
                  }}
                />
                <Text
                  className={`text-[11px] mt-0.5 font-bold ${focused ? "text-primary" : "text-gray-400"}`}
                >
                  Inicio
                </Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="diary"
          options={{
            title: "Diario",
            tabBarIcon: ({ focused }) => (
              <View
                className={`w-[76px] h-[52px] rounded-[24px] items-center justify-center ${focused ? "bg-[#EAF5F5]" : "bg-transparent"}`}
              >
                <Image
                  source={require("../../assets/images/diary.png")}
                  contentFit="contain"
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: focused ? "#2D5A6E" : "#9CA3AF",
                  }}
                />
                <Text
                  className={`text-[11px] mt-0.5 font-bold ${focused ? "text-primary" : "text-gray-400"}`}
                >
                  Diario
                </Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="habilities"
          options={{
            title: "Habilidades",
            tabBarIcon: ({ focused }) => (
              <View
                className={`w-[76px] h-[52px] rounded-[24px] items-center justify-center ${focused ? "bg-[#EAF5F5]" : "bg-transparent"}`}
              >
                <Image
                  source={require("../../assets/images/habilities.png")}
                  contentFit="contain"
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: focused ? "#2D5A6E" : "#9CA3AF",
                  }}
                />
                <Text
                  className={`text-[11px] mt-0.5 font-bold ${focused ? "text-primary" : "text-gray-400"}`}
                >
                  Habilidades
                </Text>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ focused }) => (
              <View
                className={`w-[76px] h-[52px] rounded-[24px] items-center justify-center ${focused ? "bg-[#EAF5F5]" : "bg-transparent"}`}
              >
                <Image
                  source={require("../../assets/images/perfil.png")}
                  contentFit="contain"
                  style={{
                    width: 22,
                    height: 22,
                    tintColor: focused ? "#2D5A6E" : "#9CA3AF",
                  }}
                />
                <Text
                  className={`text-[11px] mt-0.5 font-bold ${focused ? "text-primary" : "text-gray-400"}`}
                >
                  Perfil
                </Text>
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
