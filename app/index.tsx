import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-100">
      <Text className="text-2xl font-bold text-blue-600 mb-4">
        ¡NativeWind está funcionando!
      </Text>
      <Text className="text-gray-700 text-center px-4">
        Esta pantalla usa clases de Tailwind CSS a través de NativeWind
      </Text>
    </View>
  );
}
