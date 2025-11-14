import { Link } from "expo-router";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <ImageBackground 
      source={require('../assets/images/background/bg2.png')}
      resizeMode="cover"
      style={{ flex: 1 }}
      imageStyle={{ opacity: 1 }}
    >
      <View className="flex-1 justify-center items-center px-6">
        {/* Logo/Brand */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 bg-indigo-400 rounded-full items-center justify-center mb-6 shadow-lg">
            <Text className="text-white text-3xl font-bold">X</Text>
          </View>
          <Text className="text-4xl font-bold text-indigo-700 mb-2">XOMA</Text>
        </View>

        {/* Welcome Message */}
        <View className="items-center mb-8">
          <Text className="text-2xl font-bold text-indigo-700 mb-4 text-center">
            ¡Bienvenido a XOMA!
          </Text>
          <Text className="text-indigo-600 text-center px-4 leading-6">
            Monitorea tu estado emocional en tiempo real, detecta señales tempranas de crisis y recibe intervenciones prácticas basadas en DBT.
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="w-full max-w-sm space-y-4">
          <Link href="/login" asChild>
            <TouchableOpacity className="bg-indigo-400 rounded-2xl py-4 shadow-sm active:bg-indigo-500">
              <Text className="text-white text-center font-semibold text-lg">
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/register" asChild>
            <TouchableOpacity className="bg-white border border-indigo-300 rounded-2xl py-4 shadow-sm active:bg-indigo-50">
              <Text className="text-indigo-600 text-center font-semibold text-lg">
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Footer */}
        <View className="absolute bottom-8">
          <Text className="text-indigo-400 text-sm text-center">
            Versión 1.0.1 • Hecho por JM
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}
