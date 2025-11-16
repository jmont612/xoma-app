import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { login } from './lib/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    // Validación básica
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    try {
      setIsSubmitting(true);
      const { user } = await login(email, password); // usa backend real
      Alert.alert('Éxito', 'Iniciando sesión...', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(tabs)');
          }
        }
      ]);
    } catch (err: any) {
      const msg = err?.code === 'NETWORK_ERROR'
        ? `No se pudo conectar con el servidor${err?.url ? `: ${err.url}` : ''}`
        : err?.status === 401
          ? 'Correo o contraseña incorrectos'
          : err?.message || 'No se pudo iniciar sesión';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    // Aquí iría la lógica de recuperación de contraseña
    console.log('Forgot password for:', email);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground 
          source={require('../assets/images/background/bg1.png')} 
          resizeMode="cover"
          style={{ flex: 1 }}
          imageStyle={{ opacity: 0.9 }}
        >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 rounded-full bg-white shadow-lg items-center justify-center overflow-hidden mb-6 border border-indigo-100 p-2">
              <Image 
                source={require('../assets/images/logo.png')} 
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            </View>
            <Text className="text-4xl font-bold text-indigo-600 mb-2">Bienvenido</Text>
            <Text className="text-indigo-400 text-center">
              Inicia sesión en tu cuenta para continuar
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Email Input */}
            <View>
              <Text className="text-indigo-600 font-medium mb-2">Correo electrónico</Text>
              <View className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
                <TextInput
                  className="px-4 py-4 text-gray-800 text-base"
                  placeholder="usuario@correo.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-indigo-600 font-medium mb-2">Contraseña</Text>
              <View className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-row items-center">
                <TextInput
                  className="flex-1 px-4 py-4 text-gray-800 text-base"
                  placeholder="••••••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-4 py-4"
                >
                  <Text className="text-indigo-600 font-medium">
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <View className="items-end">
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text className="text-indigo-600 font-medium">
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isSubmitting}
              className={`rounded-2xl py-4 shadow-lg mt-6 ${isSubmitting ? 'bg-indigo-300' : 'bg-indigo-600 active:bg-indigo-700'}`}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {isSubmitting ? 'Ingresando…' : 'Iniciar Sesión'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-gray-500">o</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center mt-0">
              <Text className="text-gray-600">¿No tienes cuenta? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text className="text-indigo-600 font-medium">Regístrate</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
        </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}