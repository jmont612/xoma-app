import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, DeviceEventEmitter, Image, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { get, post } from '../lib/api';
import { getMe, logout, updateUser } from '../lib/auth';
import { loadAvatarUri, saveAvatarUri } from '../lib/storage';

interface UserProfile {
  nombres: string;
  apellidos: string;
  alias: string;
  email: string;
  edad: string;
  genero: string;
  consentimiento: boolean;
  terapeutaNombre: string;
  terapeutaApellido: string;
  terapeutaTelefono: string;
  emergenciaPrincipalNombre: string;
  emergenciaPrincipalApellido: string;
  emergenciaPrincipalTelefono: string;
  emergenciaSecundariaNombre: string;
  emergenciaSecundariaApellido: string;
  emergenciaSecundariaTelefono: string;
}

type DialogState =
  | { type: 'error'; title: string; message: string }
  | { type: 'success'; title: string; message: string }
  | null;

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    nombres: 'María José',
    apellidos: 'González López',
    alias: 'Majo',
    email: 'mariagonzalez@gmail.com',
    edad: '22',
    genero: 'Femenino',
    consentimiento: true,
    terapeutaNombre: '',
    terapeutaApellido: '',
    terapeutaTelefono: '',
    emergenciaPrincipalNombre: '',
    emergenciaPrincipalApellido: '',
    emergenciaPrincipalTelefono: '',
    emergenciaSecundariaNombre: '',
    emergenciaSecundariaApellido: '',
    emergenciaSecundariaTelefono: ''
  });
  const baselineRef = useRef<UserProfile | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [dialog, setDialog] = useState<DialogState>(null);

  const getAvatarInitial = () => {
    if (profile.alias && profile.alias.trim()) {
      return profile.alias.charAt(0).toUpperCase();
    }
    return profile.nombres.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (profile.alias && profile.alias.trim()) {
      return profile.alias;
    }
    return profile.nombres.split(' ')[0];
  };

  const updateProfile = (field: keyof UserProfile, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setErrors(prev => (prev[String(field)] ? { ...prev, [String(field)]: '' } : prev));
  };

  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const storedAvatar = await loadAvatarUri();
        setAvatarUri(storedAvatar);

        const me = await getMe();
        setUserId(me.id);
        const baseUpdated: UserProfile = {
          nombres: me.firstName || '',
          apellidos: me.lastName || '',
          alias: me.username || '',
          email: me.email || '',
          edad: me.age ? String(me.age) : '',
          genero: me.gender || '',
          consentimiento: !!me.consentAccepted,
          terapeutaNombre: '',
          terapeutaApellido: '',
          terapeutaTelefono: '',
          emergenciaPrincipalNombre: '',
          emergenciaPrincipalApellido: '',
          emergenciaPrincipalTelefono: '',
          emergenciaSecundariaNombre: '',
          emergenciaSecundariaApellido: '',
          emergenciaSecundariaTelefono: ''
        };

        let contacts: any[] = [];
        try {
          const res = await get<{ data: any[]; message?: string }>(`/emergency-contacts/user/${me.id}`);
          contacts = Array.isArray(res?.data) ? res.data : [];
        } catch {}

        const finalProfile: UserProfile = { ...baseUpdated };
        if (Array.isArray(contacts)) {
          contacts.forEach((c: any) => {
            const typeRaw = c?.contactType || c?.type;
            const type = String(typeRaw || '').toLowerCase();
            const firstName = c?.firstName || '';
            const lastName = c?.lastName || '';
            const phoneNumber = c?.phoneNumber || c?.phone || '';
            if (type.includes('therapist')) {
              finalProfile.terapeutaNombre = firstName;
              finalProfile.terapeutaApellido = lastName;
              finalProfile.terapeutaTelefono = phoneNumber;
            } else if (type.includes('primary')) {
              finalProfile.emergenciaPrincipalNombre = firstName;
              finalProfile.emergenciaPrincipalApellido = lastName;
              finalProfile.emergenciaPrincipalTelefono = phoneNumber;
            } else if (type.includes('secondary')) {
              finalProfile.emergenciaSecundariaNombre = firstName;
              finalProfile.emergenciaSecundariaApellido = lastName;
              finalProfile.emergenciaSecundariaTelefono = phoneNumber;
            }
          });
        }

        setProfile(finalProfile);
        baselineRef.current = finalProfile;
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'No se pudo cargar el perfil');
      }
    })();
  }, []);

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos para seleccionar un avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;

      setAvatarUri(uri);
      await saveAvatarUri(uri);
      DeviceEventEmitter.emit('avatar-updated', { uri });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo seleccionar la imagen');
    }
  };

  const isDirty = useMemo(() => {
    if (!baselineRef.current) return false;
    try {
      return JSON.stringify(profile) !== JSON.stringify(baselineRef.current);
    } catch {
      return false;
    }
  }, [profile]);

  const validatePersonalInfo = () => {
    const newErrors: { [key: string]: string } = {};

    if (!profile.nombres.trim()) newErrors.nombres = 'Ingresa tus nombres';
    if (!profile.apellidos.trim()) newErrors.apellidos = 'Ingresa tus apellidos';

    if (!profile.email.trim()) {
      newErrors.email = 'Ingresa tu correo';
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      newErrors.email = 'Ingresa un correo válido';
    }

    if (!profile.edad.trim()) {
      newErrors.edad = 'Ingresa tu edad';
    } else if (!/^\d+$/.test(profile.edad)) {
      newErrors.edad = 'La edad solo acepta números';
    } else {
      const ageNum = Number(profile.edad);
      if (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 100) {
        newErrors.edad = 'La edad debe estar entre 13 y 100';
      }
    }

    if (!profile.genero.trim()) {
      newErrors.genero = 'Selecciona tu género';
    }

    if (profile.terapeutaNombre.trim() && !profile.terapeutaTelefono.trim()) {
      newErrors.terapeutaTelefono = 'Ingresa el número de teléfono';
    }
    if (profile.emergenciaPrincipalNombre.trim() && !profile.emergenciaPrincipalTelefono.trim()) {
      newErrors.emergenciaPrincipalTelefono = 'Ingresa el número de teléfono';
    }
    if (profile.emergenciaSecundariaNombre.trim() && !profile.emergenciaSecundariaTelefono.trim()) {
      newErrors.emergenciaSecundariaTelefono = 'Ingresa el número de teléfono';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      if (!userId) {
        setDialog({ type: 'error', title: 'No se pudo guardar', message: 'No pudimos cargar tu usuario. Inténtalo de nuevo.' });
        return;
      }
      if (!validatePersonalInfo()) {
        setDialog({ type: 'error', title: 'Revisa tus datos', message: 'Corrige los campos marcados para continuar.' });
        return;
      }
      const payload = {
        firstName: profile.nombres.trim(),
        lastName: profile.apellidos.trim(),
        username: profile.alias.trim(),
        email: profile.email.trim(),
        age: Number(profile.edad),
        gender: profile.genero.trim(),
        consentAccepted: profile.consentimiento,
      };
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const updated = await updateUser(userId, cleanPayload);
      setProfile(prev => ({
        ...prev,
        nombres: updated.firstName || prev.nombres,
        apellidos: updated.lastName || prev.apellidos,
        alias: updated.username ?? prev.alias,
        email: updated.email || prev.email,
        edad: updated.age ? String(updated.age) : prev.edad,
        genero: updated.gender || prev.genero,
        consentimiento: !!updated.consentAccepted,
      }));

      const toCreate: { firstName: string; lastName?: string; phoneNumber: string; contactType: 'Therapist' | 'Primary' | 'Secondary' }[] = [];
      const isValidContact = (fn?: string, ln?: string, ph?: string) => !!(ph && ph.trim() && fn && fn.trim());
      if (isValidContact(profile.terapeutaNombre, profile.terapeutaApellido, profile.terapeutaTelefono)) {
        toCreate.push({ firstName: profile.terapeutaNombre.trim(), lastName: (profile.terapeutaApellido || '').trim(), phoneNumber: profile.terapeutaTelefono.trim(), contactType: 'Therapist' });
      }
      if (isValidContact(profile.emergenciaPrincipalNombre, profile.emergenciaPrincipalApellido, profile.emergenciaPrincipalTelefono)) {
        toCreate.push({ firstName: profile.emergenciaPrincipalNombre.trim(), lastName: (profile.emergenciaPrincipalApellido || '').trim(), phoneNumber: profile.emergenciaPrincipalTelefono.trim(), contactType: 'Primary' });
      }
      if (isValidContact(profile.emergenciaSecundariaNombre, profile.emergenciaSecundariaApellido, profile.emergenciaSecundariaTelefono)) {
        toCreate.push({ firstName: profile.emergenciaSecundariaNombre.trim(), lastName: (profile.emergenciaSecundariaApellido || '').trim(), phoneNumber: profile.emergenciaSecundariaTelefono.trim(), contactType: 'Secondary' });
      }

      if (toCreate.length > 0) {
        await Promise.all(
          toCreate.map(c => post('/emergency-contacts', { userId, ...c }))
        );
      }
      baselineRef.current = {
        ...profile,
        nombres: updated.firstName || profile.nombres,
        apellidos: updated.lastName || profile.apellidos,
        alias: updated.username ?? profile.alias,
        email: updated.email || profile.email,
        edad: updated.age ? String(updated.age) : profile.edad,
        genero: updated.gender || profile.genero,
        consentimiento: !!updated.consentAccepted,
      };
      setDialog({ type: 'success', title: 'Cambios guardados', message: 'Actualizamos tu información correctamente.' });
    } catch (e: any) {
      const friendly =
        e?.code === 'NETWORK_ERROR'
          ? { title: 'Sin conexión', message: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.' }
          : { title: 'No se pudo guardar', message: e?.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.' };
      setDialog({ type: 'error', title: friendly.title, message: friendly.message });
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <View className="flex-1 bg-neutral">
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-6" onPress={() => setDialog(null)}>
          <Pressable className="w-full bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm" onPress={() => {}}>
            <View className="items-center">
              <View
                className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${dialog?.type === 'success' ? 'bg-[#EAF5F5]' : 'bg-[#F9EAEA]'}`}
              >
                <Text className={`text-2xl font-extrabold ${dialog?.type === 'success' ? 'text-primary' : 'text-[#C84A4A]'}`}>
                  {dialog?.type === 'success' ? '✓' : '!'}
                </Text>
              </View>
              <Text className="text-gray-900 text-lg font-extrabold text-center">{dialog?.title}</Text>
              <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">{dialog?.message}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setDialog(null)}
              className="mt-6 rounded-full py-4 bg-primary active:bg-primary/90"
            >
              <Text className="text-white text-center font-bold text-base">{dialog?.type === 'success' ? 'Listo' : 'Entendido'}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-6" onPress={() => setShowLogoutConfirm(false)}>
          <Pressable className="w-full bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm" onPress={() => {}}>
            <View className="items-center">
              <View className="w-14 h-14 rounded-full bg-[#F9EAEA] items-center justify-center mb-4">
                <Text className="text-[#C84A4A] text-2xl font-extrabold">!</Text>
              </View>
              <Text className="text-gray-900 text-lg font-extrabold text-center">¿Cerrar sesión?</Text>
              <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">
                Tendrás que volver a iniciar sesión para acceder a tu cuenta.
              </Text>
            </View>

            <View className="mt-6" style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowLogoutConfirm(false)}
                className="rounded-full py-4 bg-white border border-gray-200 active:bg-gray-50"
              >
                <Text className="text-gray-700 text-center font-bold text-base">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  router.replace('/login');
                }}
                className="rounded-full py-4 bg-[#C84A4A] active:bg-[#B94141]"
              >
                <Text className="text-white text-center font-bold text-base">Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="px-6 pt-14">

          <View className="items-center mt-8 mb-8">
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.9} className="relative">
              <View className="w-20 h-20 rounded-full bg-primary items-center justify-center overflow-hidden">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text className="text-white text-3xl font-extrabold">{getAvatarInitial()}</Text>
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary items-center justify-center border-2 border-neutral">
                <Text className="text-white text-base">✎</Text>
              </View>
            </TouchableOpacity>
            <Text className="text-gray-900 text-xl font-extrabold mt-4">{getDisplayName()}</Text>
            <Text className="text-gray-400 text-sm mt-1">{profile.email}</Text>
          </View>
        </View>

        <View className="px-6">
          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-5">
            <View className="flex-row items-center mb-5">
              <Text className="text-primary mr-2">👤</Text>
              <Text className="text-gray-800 font-bold">Información personal</Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-2">Nombres</Text>
              <View className={`bg-[#F8FAF9] rounded-full border ${errors.nombres ? 'border-red-500' : 'border-gray-100'}`}>
                <TextInput
                  value={profile.nombres}
                  onChangeText={(text) => updateProfile('nombres', text)}
                  className="rounded-full px-5 py-4 text-gray-800"
                  placeholder="Nombres"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {!!errors.nombres && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.nombres}</Text>}
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-2">Apellidos</Text>
              <View className={`bg-[#F8FAF9] rounded-full border ${errors.apellidos ? 'border-red-500' : 'border-gray-100'}`}>
                <TextInput
                  value={profile.apellidos}
                  onChangeText={(text) => updateProfile('apellidos', text)}
                  className="rounded-full px-5 py-4 text-gray-800"
                  placeholder="Apellidos"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {!!errors.apellidos && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.apellidos}</Text>}
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-2">Alias</Text>
              <View className={`bg-[#F8FAF9] rounded-full border ${errors.alias ? 'border-red-500' : 'border-gray-100'}`}>
                <TextInput
                  value={profile.alias}
                  onChangeText={(text) => updateProfile('alias', text)}
                  className="rounded-full px-5 py-4 text-gray-800"
                  placeholder="Alias"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
              </View>
              {!!errors.alias && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.alias}</Text>}
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-2">Email</Text>
              <View className={`bg-[#F8FAF9] rounded-full border ${errors.email ? 'border-red-500' : 'border-gray-100'}`}>
                <TextInput
                  value={profile.email}
                  onChangeText={(text) => updateProfile('email', text)}
                  className="rounded-full px-5 py-4 text-gray-800"
                  placeholder="email@correo.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {!!errors.email && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.email}</Text>}
            </View>

            <View className="mb-4">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-2">Edad</Text>
              <View className={`bg-[#F8FAF9] rounded-full border ${errors.edad ? 'border-red-500' : 'border-gray-100'}`}>
                <TextInput
                  value={profile.edad}
                  onChangeText={(text) => updateProfile('edad', text.replace(/[^\d]/g, ''))}
                  className="rounded-full px-5 py-4 text-gray-800"
                  placeholder="Edad"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              {!!errors.edad && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.edad}</Text>}
            </View>

            <View>
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-2">Género</Text>
              <View className="relative">
                <View className={`bg-[#F8FAF9] rounded-full border ${errors.genero ? 'border-red-500' : 'border-gray-100'}`}>
                  <TextInput
                    value={profile.genero}
                    onChangeText={(text) => updateProfile('genero', text)}
                    className="rounded-full px-5 py-4 pr-12 text-gray-800"
                    placeholder="Género"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View className="absolute right-5 top-0 bottom-0 items-center justify-center">
                  <Text className="text-gray-400">⌄</Text>
                </View>
              </View>
              {!!errors.genero && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.genero}</Text>}
            </View>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-5">
            <View className="flex-row items-center mb-4">
              <Text className="text-gray-800 font-bold">Consentimiento</Text>
            </View>
            <View className="flex-row items-start">
              <TouchableOpacity
                onPress={() => {}}
                disabled
                activeOpacity={1}
                className={`w-7 h-7 rounded-lg border items-center justify-center mr-3 opacity-60 ${profile.consentimiento ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
              >
                <View />
              </TouchableOpacity>
              <TouchableOpacity className="flex-1" onPress={() => router.push('/consent')}>
                <Text className="text-gray-600 text-sm">
                  Acepto el consentimiento informado para el uso de esta aplicación.
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-5">
            <View className="flex-row items-center mb-5">
              <Text className="text-primary mr-2">🛟</Text>
              <Text className="text-gray-800 font-bold">Red de apoyo</Text>
            </View>

            <View className="bg-[#F8FAF9] rounded-[24px] p-5 border border-gray-100 mb-4">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-4">Terapeuta</Text>
              <TextInput
                value={profile.terapeutaNombre}
                onChangeText={(text) => updateProfile('terapeutaNombre', text)}
                className="bg-white rounded-full px-5 py-3 text-gray-800 border border-gray-100 mb-3"
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                value={profile.terapeutaApellido}
                onChangeText={(text) => updateProfile('terapeutaApellido', text)}
                className="bg-white rounded-full px-5 py-3 text-gray-800 border border-gray-100 mb-3"
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                value={profile.terapeutaTelefono}
                onChangeText={(text) => updateProfile('terapeutaTelefono', text.replace(/[^\d]/g, ''))}
                className={`bg-white rounded-full px-5 py-3 text-gray-800 border ${errors.terapeutaTelefono ? 'border-red-500' : 'border-gray-100'}`}
                placeholder="999666999"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={15}
              />
              {!!errors.terapeutaTelefono && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.terapeutaTelefono}</Text>}
            </View>

            <View className="bg-[#F8FAF9] rounded-[24px] p-5 border border-gray-100 mb-4">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-4">Contacto de emergencia - Principal</Text>
              <TextInput
                value={profile.emergenciaPrincipalNombre}
                onChangeText={(text) => updateProfile('emergenciaPrincipalNombre', text)}
                className="bg-white rounded-full px-5 py-3 text-gray-800 border border-gray-100 mb-3"
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                value={profile.emergenciaPrincipalApellido}
                onChangeText={(text) => updateProfile('emergenciaPrincipalApellido', text)}
                className="bg-white rounded-full px-5 py-3 text-gray-800 border border-gray-100 mb-3"
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                value={profile.emergenciaPrincipalTelefono}
                onChangeText={(text) => updateProfile('emergenciaPrincipalTelefono', text.replace(/[^\d]/g, ''))}
                className={`bg-white rounded-full px-5 py-3 text-gray-800 border ${errors.emergenciaPrincipalTelefono ? 'border-red-500' : 'border-gray-100'}`}
                placeholder="999666999"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={15}
              />
              {!!errors.emergenciaPrincipalTelefono && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.emergenciaPrincipalTelefono}</Text>}
            </View>

            <View className="bg-[#F8FAF9] rounded-[24px] p-5 border border-gray-100">
              <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-4">Contacto de emergencia - Secundario</Text>
              <TextInput
                value={profile.emergenciaSecundariaNombre}
                onChangeText={(text) => updateProfile('emergenciaSecundariaNombre', text)}
                className="bg-white rounded-full px-5 py-3 text-gray-800 border border-gray-100 mb-3"
                placeholder="Nombre"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                value={profile.emergenciaSecundariaApellido}
                onChangeText={(text) => updateProfile('emergenciaSecundariaApellido', text)}
                className="bg-white rounded-full px-5 py-3 text-gray-800 border border-gray-100 mb-3"
                placeholder="Apellido"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                value={profile.emergenciaSecundariaTelefono}
                onChangeText={(text) => updateProfile('emergenciaSecundariaTelefono', text.replace(/[^\d]/g, ''))}
                className={`bg-white rounded-full px-5 py-3 text-gray-800 border ${errors.emergenciaSecundariaTelefono ? 'border-red-500' : 'border-gray-100'}`}
                placeholder="999666999"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={15}
              />
              {!!errors.emergenciaSecundariaTelefono && <Text className="text-red-500 text-xs mt-2 ml-4">{errors.emergenciaSecundariaTelefono}</Text>}
            </View>
          </View>

          <TouchableOpacity
            className={`rounded-full px-6 py-5 shadow-sm ${isDirty ? 'bg-primary active:bg-primary/90' : 'bg-primary/60'}`}
            onPress={handleSave}
            disabled={!isDirty}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white font-bold text-base">Guardar cambios</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-full px-6 py-5 shadow-sm mt-4 border border-red-200 active:bg-red-50"
            onPress={handleLogout}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-red-600 font-bold text-base">Cerrar sesión</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
