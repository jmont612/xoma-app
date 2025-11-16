import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { register as registerUser } from './lib/auth';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const genderOptions = ['masculino', 'femenino', 'otro'];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'El alias es requerido';
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

    if (!formData.age.trim()) {
      newErrors.age = 'La edad es requerida';
    } else if (!/^\d+$/.test(formData.age)) {
      newErrors.age = 'La edad debe ser un número';
    }

    if (!formData.gender.trim()) {
      newErrors.gender = 'El género es requerido';
    }

    if (!consentAccepted) {
      newErrors.consent = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      age: Number(formData.age),
      gender: formData.gender,
      consentAccepted,
    };
    try {
      setIsSubmitting(true);
      await registerUser(payload);
      router.replace('/login');
    } catch (err: any) {
      const msg = err?.code === 'NETWORK_ERROR'
        ? `No se pudo conectar con el servidor${err?.url ? `: ${err.url}` : ''}`
        : err?.message || 'No se pudo crear la cuenta';
      // Mostrar mensaje de error simple
      // eslint-disable-next-line no-alert
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
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
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground 
          source={require('../assets/images/background/bg1.png')} 
          resizeMode="cover"
          style={{ flex: 1 }}
          imageStyle={{ opacity: 0.9 }}
        >
          <View className="flex-1 justify-center px-6 py-12">
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-indigo-600 mb-2">Registro</Text>
              <Text className="text-indigo-400 text-center">
                Únete y comienza tu viaje
              </Text>
            </View>

            <View className="space-y-4">
              <View className="space-y-4">
                <View>
                  <Text className="text-indigo-600 font-medium mb-2">Nombres</Text>
                  <View className={`bg-white rounded-2xl border border-indigo-100 shadow-sm ${errors.firstName ? 'border-red-500' : ''}`}>
                    <TextInput
                      className="px-4 py-4 text-gray-800 text-base"
                      placeholder="Juan"
                      placeholderTextColor="#9CA3AF"
                      value={formData.firstName}
                      onChangeText={(value) => updateFormData('firstName', value)}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>
                  {errors.firstName && <Text className="text-red-500 text-sm mt-1">{errors.firstName}</Text>}
                </View>
                <View>
                  <Text className="text-indigo-600 font-medium mb-2">Apellidos</Text>
                  <View className={`bg-white rounded-2xl border border-indigo-100 shadow-sm ${errors.lastName ? 'border-red-500' : ''}`}>
                    <TextInput
                      className="px-4 py-4 text-gray-800 text-base"
                      placeholder="Pérez"
                      placeholderTextColor="#9CA3AF"
                      value={formData.lastName}
                      onChangeText={(value) => updateFormData('lastName', value)}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>
                  {errors.lastName && <Text className="text-red-500 text-sm mt-1">{errors.lastName}</Text>}
                </View>
              </View>

              <View>
                <Text className="text-indigo-600 font-medium mb-2">Alias</Text>
                <View className={`bg-white rounded-2xl border border-indigo-100 shadow-sm ${errors.username ? 'border-red-500' : ''}`}>
                  <TextInput
                    className="px-4 py-4 text-gray-800 text-base"
                    placeholder="Juancito"
                    placeholderTextColor="#9CA3AF"
                    value={formData.username}
                    onChangeText={(value) => updateFormData('username', value)}
                    autoCapitalize="none"
                  />
                </View>
                {errors.username && <Text className="text-red-500 text-sm mt-1">{errors.username}</Text>}
              </View>
              <View>
                <Text className="text-indigo-600 font-medium mb-2">Correo electrónico</Text>
                <View className={`bg-white rounded-2xl border border-indigo-100 shadow-sm ${errors.email ? 'border-red-500' : ''}`}>
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

              <View>
                <Text className="text-indigo-600 font-medium mb-2">Contraseña</Text>
                <View className={`bg-white rounded-2xl border border-indigo-100 shadow-sm flex-row items-center ${errors.password ? 'border-red-500' : ''}`}>
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
                    <Text className="text-indigo-600 font-medium">
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>}
              </View>

              <View>
                <Text className="text-indigo-600 font-medium mb-2">Confirmar contraseña</Text>
                <View className={`bg-white rounded-2xl border border-indigo-100 shadow-sm flex-row items-center ${errors.confirmPassword ? 'border-red-500' : ''}`}>
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
                    <Text className="text-indigo-600 font-medium">
                      {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text className="text-red-500 text-sm mt-1">{errors.confirmPassword}</Text>}
              </View>

              <View className="flex-row">
                <View className="flex-1 mr-2">
                  <Text className="text-indigo-600 font-medium mb-2">Edad</Text>
                  <View className={`bg-white rounded-2xl border border-indigo-100 shadow-sm ${errors.age ? 'border-red-500' : ''}`}>
                    <TextInput
                      className="px-4 py-4 text-gray-800 text-base"
                      placeholder="25"
                      placeholderTextColor="#9CA3AF"
                      value={formData.age}
                      onChangeText={(value) => updateFormData('age', value)}
                      keyboardType="numeric"
                    />
                  </View>
                  {errors.age && <Text className="text-red-500 text-sm mt-1">{errors.age}</Text>}
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-indigo-600 font-medium mb-2">Género</Text>
                  <TouchableOpacity
                    onPress={() => setShowGenderPicker(true)}
                    className={`bg-white rounded-2xl border border-indigo-100 shadow-sm px-4 py-4 ${errors.gender ? 'border-red-500' : ''}`}
                  >
                    <Text className={formData.gender ? 'text-gray-800' : 'text-gray-400'}>
                      {formData.gender || 'Selecciona'}
                    </Text>
                  </TouchableOpacity>
                  {errors.gender && <Text className="text-red-500 text-sm mt-1">{errors.gender}</Text>}
                </View>
              </View>

              <View className="mt-6">
                <TouchableOpacity
                  onPress={() => {
                    setConsentAccepted(!consentAccepted);
                    if (errors.consent) {
                      setErrors(prev => ({ ...prev, consent: '' }));
                    }
                  }}
                  className="flex-row items-center"
                >
                  <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                    consentAccepted ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'
                  }`}>
                    {consentAccepted && (
                      <Text className="text-white text-xs font-bold">✓</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-indigo-700">
                      Acepto los{' '}
                      <Link href="/consent" asChild>
                        <Text className="text-indigo-600 font-medium underline">
                          términos y condiciones
                        </Text>
                      </Link>
                      {' '}y la política de privacidad
                    </Text>
                  </View>
                </TouchableOpacity>
                {errors.consent && <Text className="text-red-500 text-sm mt-1">{errors.consent}</Text>}
              </View>

              <TouchableOpacity
                onPress={handleRegister}
                disabled={isSubmitting}
                className={`rounded-2xl py-4 shadow-lg mt-6 ${isSubmitting ? 'bg-indigo-300' : 'bg-indigo-600 active:bg-indigo-700'}`}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  {isSubmitting ? 'Creando…' : 'Crear Cuenta'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-8">
              <Link href="/" asChild>
                <TouchableOpacity className="items-center py-3">
                  <Text className="text-indigo-500">← Volver al inicio</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ImageBackground>
        <Modal
          visible={showGenderPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGenderPicker(false)}
        >
          <View className="flex-1 bg-black bg-opacity-30 items-center justify-center">
            <View className="bg-white rounded-2xl p-6 w-11/12 max-w-sm border border-indigo-100">
              <Text className="text-indigo-700 font-semibold mb-4">Selecciona género</Text>
              {genderOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => { updateFormData('gender', opt); setShowGenderPicker(false); }}
                  className={`px-4 py-3 rounded-xl mb-2 ${formData.gender === opt ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-gray-200'}`}
                >
                  <Text className="text-gray-800">{opt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setShowGenderPicker(false)}
                className="bg-indigo-600 rounded-xl py-3 mt-2"
              >
                <Text className="text-white text-center font-medium">Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}