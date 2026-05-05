import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { login } from './lib/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const showError = (title: string, message: string) => {
    setError({ title, message });
  };

  const handleLogin = async () => {
    // Validación básica
    if (!email || !password) {
      showError('Faltan datos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      const rawMessage = String(err?.message || '');
      const normalized = rawMessage.trim().toLowerCase();
      const friendly =
        err?.code === 'NETWORK_ERROR'
          ? { title: 'Sin conexión', message: 'No hay conexión a internet.' }
          : err?.status === 401
            ? { title: 'Datos incorrectos', message: 'El correo o la contraseña no coinciden.' }
            : normalized === 'user not found'
              ? { title: 'No se pudo iniciar sesión', message: 'El usuario no se encuentra registrado' }
              : { title: 'No se pudo iniciar sesión', message: rawMessage || 'Ocurrió un error inesperado. Inténtalo de nuevo.' };

      showError(friendly.title, friendly.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    const trimmed = email.trim();
    if (trimmed) {
      router.push(`/forgot-password?email=${encodeURIComponent(trimmed)}`);
      return;
    }
    router.push('/forgot-password');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-neutral"
    >
      <Modal
        visible={!!error}
        transparent
        animationType="fade"
        onRequestClose={() => setError(null)}
      >
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-6" onPress={() => setError(null)}>
          <Pressable className="w-full bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm" onPress={() => {}}>
            <View className="items-center">
              <View className="w-14 h-14 rounded-full bg-[#F9EAEA] items-center justify-center mb-4">
                <Text className="text-[#C84A4A] text-2xl font-extrabold">!</Text>
              </View>
              <Text className="text-gray-900 text-lg font-extrabold text-center">{error?.title}</Text>
              <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">{error?.message}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setError(null)}
              className="mt-6 rounded-full py-4 bg-primary active:bg-primary/90"
            >
              <Text className="text-white text-center font-bold text-base">Entendido</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-8 py-12">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-6">
              <Image 
                source={require('../assets/images/logo.png')} 
                style={{ width: '60%', height: '60%', tintColor: 'white' }}
                contentFit="contain"
              />
            </View>
            <Text className="text-4xl font-extrabold text-primary mb-3">Estamos contigo</Text>
            <Text className="text-primary/70 text-center text-base px-4">
              Inicia sesión para comenzar tu{'\n'}acompañamiento
            </Text>
          </View>

          {/* Form */}
          <View className="w-full">
            {/* Email Input */}
            <View className="mb-5">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Correo electrónico</Text>
              <View className="bg-white rounded-full shadow-sm">
                <TextInput
                  className="px-6 py-4 text-gray-800 text-base"
                  placeholder="ejemplo@correo.com"
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
            <View className="mb-8">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Contraseña</Text>
              <View className="bg-white rounded-full shadow-sm flex-row items-center">
                <TextInput
                  className="flex-1 px-6 py-4 text-gray-800 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isSubmitting}
              className={`rounded-full py-4 shadow-sm flex-row justify-center items-center ${isSubmitting ? 'bg-primary/70' : 'bg-primary active:bg-primary/90'}`}
            >
              <Text className="text-white text-center font-bold text-lg mr-2">
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Text>
              {!isSubmitting && <Text className="text-white font-bold text-xl">→</Text>}
            </TouchableOpacity>

            {/* Forgot Password */}
            <View className="items-center mt-6">
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text className="text-primary/70 font-medium">
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up */}
            <View className="items-center mt-4">
              <View className="flex-row items-center">
                <Text className="text-gray-500">¿No tienes cuenta? </Text>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text className="text-primary font-bold">Regístrate</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

            {/* Divider */}
            <View className="items-center my-8">
              <View className="w-12 h-px bg-gray-300" />
            </View>

            {/* Emergency Button */}
            {/* <TouchableOpacity className="bg-[#F9EAEA] rounded-full py-4 flex-row justify-center items-center mb-4">
              <Text className="text-[#C84A4A] font-extrabold text-xl mr-2 mt-1">*</Text>
              <Text className="text-[#C84A4A] font-bold text-sm tracking-widest">AYUDA DE EMERGENCIA</Text>
            </TouchableOpacity> */}
            
            <Text className="text-center text-gray-400 text-xs">
              Estamos aquí las 24 horas del día.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
