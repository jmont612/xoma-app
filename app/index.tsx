import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 px-6">
      {/* Logo/Brand */}
      <View className="items-center mb-12">
        <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-6 shadow-lg">
          <Text className="text-white text-3xl font-bold">X</Text>
        </View>
        <Text className="text-4xl font-bold text-gray-800 mb-2">XOMA</Text>
      </View>

      {/* Welcome Message */}
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-gray-800 mb-4 text-center">
          ¡Bienvenido a XOMA!
        </Text>
        <Text className="text-gray-600 text-center px-4 leading-6">
          Monitorea tu estado emocional en tiempo real, detecta señales tempranas de crisis y recibe intervenciones prácticas basadas en DBT.
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="w-full max-w-sm space-y-4">
        <Link href="/login" asChild>
          <TouchableOpacity className="bg-blue-600 rounded-xl py-4 shadow-lg active:bg-blue-700">
            <Text className="text-white text-center font-semibold text-lg">
              Iniciar Sesión
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/register" asChild>
          <TouchableOpacity className="bg-white border-2 border-blue-600 rounded-xl py-4 shadow-sm active:bg-blue-50">
            <Text className="text-blue-600 text-center font-semibold text-lg">
              Crear Cuenta
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Footer */}
      <View className="absolute bottom-8">
        <Text className="text-gray-400 text-sm text-center">
          Versión 1.0.0 • Hecho por JM
        </Text>
      </View>
    </View>
  );
}
