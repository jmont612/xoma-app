import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { register as registerUser } from './lib/auth';

const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '\-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const USERNAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ._-]{3,20}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const sanitizeNameInput = (value: string) =>
  value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ '\-]/g, '');

const sanitizeUsernameInput = (value: string) =>
  value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ._-]/g, '');

const sanitizeEmailInput = (value: string) =>
  value.replace(/\s+/g, '').replace(/[^A-Za-z0-9@._%+-]/g, '');

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
  const genderOptions = [
    { label: 'Masculino', value: 'male' },
    { label: 'Femenino', value: 'female' },
    { label: 'No binario', value: 'non-binary' },
    { label: 'Otro', value: 'other' },
  ];
  const genderLabelByValue = new Map(genderOptions.map((o) => [o.value, o.label] as const));
  const selectedGenderLabel = formData.gender ? (genderLabelByValue.get(formData.gender) ?? formData.gender) : '';

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const username = formData.username.trim();
    const email = formData.email.trim();
    const age = formData.age.trim();

    if (!firstName) {
      newErrors.firstName = 'El nombre es requerido';
    } else if (!NAME_REGEX.test(firstName)) {
      newErrors.firstName = 'El nombre solo puede tener letras y espacios';
    }

    if (!lastName) {
      newErrors.lastName = 'El apellido es requerido';
    } else if (!NAME_REGEX.test(lastName)) {
      newErrors.lastName = 'El apellido solo puede tener letras y espacios';
    }

    if (!username) {
      newErrors.username = 'El alias es requerido';
    } else if (!USERNAME_REGEX.test(username)) {
      newErrors.username = 'El alias debe tener 3 a 20 caracteres sin números';
    }

    if (!email) {
      newErrors.email = 'El correo es requerido';
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = 'El correo no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!age) {
      newErrors.age = 'La edad es requerida';
    } else if (!/^\d+$/.test(age)) {
      newErrors.age = 'La edad debe ser un número';
    } else {
      const ageNum = Number(age);
      if (!Number.isFinite(ageNum) || ageNum < 21 || ageNum > 35) {
        newErrors.age = 'La edad debe estar entre 21 y 35';
      }
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
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
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
      Alert.alert('Error', msg);
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
      className="flex-1 bg-neutral"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-8 py-12">
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-6">
              <Image
                source={require('../assets/images/logo.png')}
                style={{ width: '60%', height: '60%', tintColor: 'white' }}
                contentFit="contain"
              />
            </View>
            <Text className="text-4xl font-extrabold text-primary mb-3">Crear cuenta</Text>
            <Text className="text-primary/70 text-center text-base px-4">
              Únete y comienza tu{'\n'}acompañamiento
            </Text>
          </View>

          <View className="w-full">
            <View className="mb-5">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Nombres</Text>
              <View className={`bg-white rounded-full shadow-sm border ${errors.firstName ? 'border-red-500' : 'border-transparent'}`}>
                <TextInput
                  className="px-6 py-4 text-gray-800 text-base"
                  placeholder="Juan"
                  placeholderTextColor="#9CA3AF"
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', sanitizeNameInput(value))}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
              {!!errors.firstName && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.firstName}</Text>}
            </View>

            <View className="mb-5">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Apellidos</Text>
              <View className={`bg-white rounded-full shadow-sm border ${errors.lastName ? 'border-red-500' : 'border-transparent'}`}>
                <TextInput
                  className="px-6 py-4 text-gray-800 text-base"
                  placeholder="Pérez"
                  placeholderTextColor="#9CA3AF"
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', sanitizeNameInput(value))}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
              {!!errors.lastName && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.lastName}</Text>}
            </View>

            <View className="mb-5">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Alias</Text>
              <View className={`bg-white rounded-full shadow-sm border ${errors.username ? 'border-red-500' : 'border-transparent'}`}>
                <TextInput
                  className="px-6 py-4 text-gray-800 text-base"
                  placeholder="Juancito"
                  placeholderTextColor="#9CA3AF"
                  value={formData.username}
                  onChangeText={(value) => updateFormData('username', sanitizeUsernameInput(value))}
                  autoCapitalize="none"
                />
              </View>
              {!!errors.username && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.username}</Text>}
            </View>

            <View className="mb-5">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Correo electrónico</Text>
              <View className={`bg-white rounded-full shadow-sm border ${errors.email ? 'border-red-500' : 'border-transparent'}`}>
                <TextInput
                  className="px-6 py-4 text-gray-800 text-base"
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', sanitizeEmailInput(value))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {!!errors.email && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.email}</Text>}
            </View>

            <View className="mb-5">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Contraseña</Text>
              <View className={`bg-white rounded-full shadow-sm border flex-row items-center ${errors.password ? 'border-red-500' : 'border-transparent'}`}>
                <TextInput
                  className="flex-1 px-6 py-4 text-gray-800 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-6 py-4">
                  <Text className="text-primary font-bold">{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
                </TouchableOpacity>
              </View>
              {!!errors.password && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.password}</Text>}
            </View>

            <View className="mb-5">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Confirmar contraseña</Text>
              <View className={`bg-white rounded-full shadow-sm border flex-row items-center ${errors.confirmPassword ? 'border-red-500' : 'border-transparent'}`}>
                <TextInput
                  className="flex-1 px-6 py-4 text-gray-800 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="px-6 py-4">
                  <Text className="text-primary font-bold">{showConfirmPassword ? 'Ocultar' : 'Mostrar'}</Text>
                </TouchableOpacity>
              </View>
              {!!errors.confirmPassword && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.confirmPassword}</Text>}
            </View>

            <View className="flex-row mb-5" style={{ gap: 12 }}>
              <View className="flex-1">
                <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Edad</Text>
                <View className={`bg-white rounded-full shadow-sm border ${errors.age ? 'border-red-500' : 'border-transparent'}`}>
                  <TextInput
                    className="px-6 py-4 text-gray-800 text-base"
                    placeholder="25"
                    placeholderTextColor="#9CA3AF"
                    value={formData.age}
                    onChangeText={(value) => updateFormData('age', value.replace(/[^\d]/g, '').slice(0, 2))}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                {!!errors.age && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.age}</Text>}
              </View>

              <View className="flex-1">
                <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Género</Text>
                <TouchableOpacity
                  onPress={() => setShowGenderPicker(true)}
                  className={`bg-white rounded-full shadow-sm border px-6 py-4 ${errors.gender ? 'border-red-500' : 'border-transparent'}`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className={formData.gender ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                      {selectedGenderLabel || 'Selecciona'}
                    </Text>
                    <Text className="text-gray-400">⌄</Text>
                  </View>
                </TouchableOpacity>
                {!!errors.gender && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.gender}</Text>}
              </View>
            </View>

            <View className="mt-4">
              <TouchableOpacity
                onPress={() => {
                  setConsentAccepted(!consentAccepted);
                  if (errors.consent) {
                    setErrors(prev => ({ ...prev, consent: '' }));
                  }
                }}
                className="flex-row items-start"
              >
                <View className={`w-7 h-7 rounded-lg border mr-3 items-center justify-center ${consentAccepted ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}>
                  <View />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600">
                    Acepto los{' '}
                    <Link href="/consent" asChild>
                      <Text className="text-primary font-bold underline">
                        términos y condiciones
                      </Text>
                    </Link>
                    {' '}y la política de privacidad
                  </Text>
                </View>
              </TouchableOpacity>
              {!!errors.consent && <Text className="text-red-500 text-xs mt-2 ml-10">{errors.consent}</Text>}
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={isSubmitting}
              className={`rounded-full py-4 shadow-sm flex-row justify-center items-center mt-8 ${isSubmitting ? 'bg-primary/70' : 'bg-primary active:bg-primary/90'}`}
            >
              <Text className="text-white text-center font-bold text-lg mr-2">
                {isSubmitting ? 'Creando…' : 'Crear cuenta'}
              </Text>
              {!isSubmitting && <Text className="text-white font-bold text-xl">→</Text>}
            </TouchableOpacity>

            <View className="items-center mt-6">
              <View className="flex-row items-center">
                <Text className="text-gray-500">¿Ya tienes cuenta? </Text>
                <Link href="/login" asChild>
                  <TouchableOpacity>
                    <Text className="text-primary font-bold">Inicia sesión</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </View>
        <Modal
          visible={showGenderPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGenderPicker(false)}
        >
          <View className="flex-1 bg-black bg-opacity-30 items-center justify-center">
            <View className="bg-white rounded-2xl p-6 w-11/12 max-w-sm border border-gray-100">
              <Text className="text-gray-800 font-bold mb-4">Selecciona género</Text>
              {genderOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { updateFormData('gender', opt.value); setShowGenderPicker(false); }}
                  className={`px-4 py-3 rounded-xl mb-2 border ${formData.gender === opt.value ? 'bg-[#EAF5F5] border-primary/20' : 'bg-white border-gray-200'}`}
                >
                  <Text className="text-gray-800">{opt.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setShowGenderPicker(false)}
                className="bg-primary rounded-xl py-3 mt-2"
              >
                <Text className="text-white text-center font-bold">Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
