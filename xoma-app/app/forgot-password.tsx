import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { requestPasswordReset } from './lib/auth';

type DialogState =
  | { type: 'error'; title: string; message: string }
  | { type: 'success'; title: string; message: string }
  | null;

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    const paramEmail = typeof params.email === 'string' ? params.email : '';
    if (paramEmail && !email) setEmail(paramEmail);
  }, [params.email, email]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownSeconds]);

  const emailRegex = useMemo(() => /^\S+@\S+\.\S+$/, []);

  const validate = (value: string) => {
    const v = value.trim();
    if (!v) return 'El correo es requerido';
    if (!emailRegex.test(v)) return 'El correo no es válido';
    return null;
  };

  const showDialog = (next: Exclude<DialogState, null>) => {
    setDialog(next);
  };

  const handleSubmit = async () => {
    if (cooldownSeconds > 0 || isSubmitting) return;
    const err = validate(email);
    if (err) {
      setEmailError(err);
      showDialog({ type: 'error', title: 'Revisa tu correo', message: err });
      return;
    }

    try {
      setIsSubmitting(true);
      setEmailError(null);
      await requestPasswordReset(email.trim());
      setCooldownSeconds(60);
      showDialog({
        type: 'success',
        title: 'Código enviado',
        message: 'Te enviamos un código de 6 dígitos a tu correo. Úsalo para crear tu nueva contraseña.',
      });
    } catch (e: any) {
      const message = String(e?.message || 'No se pudo procesar tu solicitud. Inténtalo de nuevo.');
      const status = e?.status as number | undefined;
      const normalized = message.toLowerCase();
      const looksUnregistered =
        status === 404 ||
        (status === 400 && (normalized.includes('no') && (normalized.includes('existe') || normalized.includes('registr')))) ||
        normalized.includes('not found');

      if (looksUnregistered) {
        setEmailError('Este correo no está registrado');
        showDialog({
          type: 'error',
          title: 'Correo no registrado',
          message: 'El correo ingresado no coincide con ninguna cuenta activa.',
        });
        return;
      }

      const friendly =
        e?.code === 'NETWORK_ERROR'
          ? { title: 'Sin conexión', message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.' }
          : { title: 'No se pudo enviar', message };

      showDialog({ type: 'error', title: friendly.title, message: friendly.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-neutral">
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-6"
          onPress={() => {
            if (dialog?.type !== 'success') setDialog(null);
          }}
        >
          <Pressable className="w-full bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm" onPress={() => {}}>
            <View className="items-center">
              <View
                className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${dialog?.type === 'success' ? 'bg-[#EAF5F5]' : 'bg-[#F9EAEA]'}`}
              >
                <Text
                  className={`text-2xl font-extrabold ${dialog?.type === 'success' ? 'text-primary' : 'text-[#C84A4A]'}`}
                >
                  {dialog?.type === 'success' ? '✓' : '!'}
                </Text>
              </View>
              <Text className="text-gray-900 text-lg font-extrabold text-center">{dialog?.title}</Text>
              <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">{dialog?.message}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                const wasSuccess = dialog?.type === 'success';
                setDialog(null);
                if (wasSuccess) {
                  router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
                }
              }}
              className="mt-6 rounded-full py-4 bg-primary active:bg-primary/90"
            >
              <Text className="text-white text-center font-bold text-base">
                {dialog?.type === 'success' ? 'Ingresar código' : 'Entendido'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-8 py-12">
          <View className="pt-4">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center h-10">
              <Text className="text-primary text-sm font-bold" style={{ includeFontPadding: false, lineHeight: 16 }}>Volver</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mt-10 mb-10">
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-6">
              <Image
                source={require('../assets/images/logo.png')}
                style={{ width: '60%', height: '60%', tintColor: 'white' }}
                contentFit="contain"
              />
            </View>
            <Text className="text-3xl font-extrabold text-primary mb-3 text-center">Recuperar contraseña</Text>
            <Text className="text-primary/70 text-center text-base px-4">
              Ingresa tu correo para enviarte instrucciones.
            </Text>
          </View>

          <View className="w-full">
            <View className="mb-6">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">Correo electrónico</Text>
              <View className={`bg-white rounded-full shadow-sm border ${emailError ? 'border-red-500' : 'border-transparent'}`}>
                <TextInput
                  className="px-6 py-4 text-gray-800 text-base"
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (emailError) setEmailError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {!!emailError && <Text className="text-red-500 text-xs mt-2 ml-4">{emailError}</Text>}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || cooldownSeconds > 0}
              className={`rounded-full py-4 shadow-sm flex-row justify-center items-center ${isSubmitting || cooldownSeconds > 0 ? 'bg-primary/70' : 'bg-primary active:bg-primary/90'}`}
            >
              <Text className="text-white text-center font-bold text-lg mr-2">
                {isSubmitting ? 'Enviando...' : cooldownSeconds > 0 ? `Reenviar en ${cooldownSeconds}s` : 'Enviar enlace'}
              </Text>
              {!isSubmitting && cooldownSeconds === 0 && <Text className="text-white font-bold text-xl">→</Text>}
            </TouchableOpacity>

            <View className="items-center mt-6">
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text className="text-primary/70 font-medium">Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
