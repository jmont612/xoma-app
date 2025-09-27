import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El correo no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!consentAccepted) {
      newErrors.consent = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validateForm()) return;
    
    // Aquí iría la lógica de registro cuando se implemente el backend
    console.log('Register attempt:', { name: formData.name, email: formData.email, password: formData.password, consentAccepted });
    
    // Simular registro exitoso y redirigir
    router.push('/(tabs)');
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-gradient-to-br from-green-50 to-emerald-100"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Back Button */}
          {/* <View className="mb-8">
            <Link href="/" asChild>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-blue-600 text-lg">← Atrás</Text>
              </TouchableOpacity>
            </Link>
          </View> */}

          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-800 mb-2">Crear Cuenta</Text>
            <Text className="text-gray-600 text-center">
              Únete a nuestra comunidad y comienza tu viaje
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Name Input */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Nombre completo</Text>
              <View className={`bg-white rounded-xl border shadow-sm ${errors.name ? 'border-red-500' : 'border-gray-200'}`}>
                <TextInput
                  className="px-4 py-4 text-gray-800 text-base"
                  placeholder="Tu nombre completo"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
              {errors.name && <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>}
            </View>

            {/* Email Input */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Correo electrónico</Text>
              <View className={`bg-white rounded-xl border shadow-sm ${errors.email ? 'border-red-500' : 'border-gray-200'}`}>
                <TextInput
                  className="px-4 py-4 text-gray-800 text-base"
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>}
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Contraseña</Text>
              <View className={`bg-white rounded-xl border shadow-sm flex-row items-center ${errors.password ? 'border-red-500' : 'border-gray-200'}`}>
                <TextInput
                  className="flex-1 px-4 py-4 text-gray-800 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-4 py-4"
                >
                  <Text className="text-green-600 font-medium">
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>}
            </View>

            {/* Confirm Password Input */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Confirmar contraseña</Text>
              <View className={`bg-white rounded-xl border shadow-sm flex-row items-center ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}>
                <TextInput
                  className="flex-1 px-4 py-4 text-gray-800 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="px-4 py-4"
                >
                  <Text className="text-green-600 font-medium">
                    {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text className="text-red-500 text-sm mt-1">{errors.confirmPassword}</Text>}
            </View>

            {/* Consent Checkbox */}
            <View className="mt-6">
              <TouchableOpacity
                onPress={() => {
                  setConsentAccepted(!consentAccepted);
                  if (errors.consent) {
                    setErrors(prev => ({ ...prev, consent: '' }));
                  }
                }}
                className="flex-row items-start"
              >
                <View className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 items-center justify-center ${
                  consentAccepted ? 'bg-green-600 border-green-600' : 'border-gray-400'
                }`}>
                  {consentAccepted && (
                    <Text className="text-white text-xs font-bold">✓</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 leading-5">
                    Acepto los{' '}
                    <Link href="/consent" asChild>
                      <TouchableOpacity>
                        <Text className="text-green-600 font-medium underline">
                          términos y condiciones
                        </Text>
                      </TouchableOpacity>
                    </Link>
                    {' '}y la política de privacidad
                  </Text>
                </View>
              </TouchableOpacity>
              {errors.consent && <Text className="text-red-500 text-sm mt-1">{errors.consent}</Text>}
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              className="bg-green-600 rounded-xl py-4 shadow-lg active:bg-green-700 mt-6"
            >
              <Text className="text-white text-center font-semibold text-lg">
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back to Home */}
          <View className="mt-8">
            <Link href="/" asChild>
              <TouchableOpacity className="items-center py-3">
                <Text className="text-gray-500">← Volver al inicio</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}