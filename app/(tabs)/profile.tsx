import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Alert, Image, ImageBackground, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { get, post } from '../lib/api';
import { getMe, logout, updateUser } from '../lib/auth';

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
  };

  const [userId, setUserId] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
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

  const isDirty = useMemo(() => {
    if (!baselineRef.current) return false;
    try {
      return JSON.stringify(profile) !== JSON.stringify(baselineRef.current);
    } catch {
      return false;
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'Usuario no cargado');
        return;
      }
      const payload = {
        firstName: profile.nombres,
        lastName: profile.apellidos,
        username: profile.alias,
        email: profile.email,
        age: profile.edad ? Number(profile.edad) : undefined,
        gender: profile.genero,
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
        alias: updated.username || prev.alias,
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
      Alert.alert('Éxito', 'Perfil y contactos actualizados correctamente');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo actualizar el perfil');
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <ImageBackground
      source={require('../../assets/images/background/bg2.png')}
      resizeMode="cover"
      className="flex-1"
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header over pastel background */}
        <View className="px-6 pt-16 pb-8">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-4 shadow-sm">
              <Image
                source={require('../../assets/images/perfil.png')}
                resizeMode="contain"
                className="w-16 h-16"
              />
            </View>
            <Text className="text-2xl font-bold text-indigo-700 mb-1">
              {getDisplayName()}
            </Text>
            <Text className="text-indigo-600">
              {profile.email}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 py-8">
          {/* Información Personal */}
          <View className="bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-4">
            <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-6">
              <Text className="text-white font-semibold text-base">Información personal</Text>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-indigo-700 font-medium mb-2">Nombres</Text>
                <TextInput
                  value={profile.nombres}
                  onChangeText={(text) => updateProfile('nombres', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Ingresa tus nombres"
                />
              </View>

              <View>
                <Text className="text-indigo-700 font-medium mb-2">Apellidos</Text>
                <TextInput
                  value={profile.apellidos}
                  onChangeText={(text) => updateProfile('apellidos', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Ingresa tus apellidos"
                />
              </View>

              <View>
                <Text className="text-indigo-700 font-medium mb-2">Alias</Text>
                <TextInput
                  value={profile.alias}
                  onChangeText={(text) => updateProfile('alias', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Ingresa tu alias (opcional)"
                />
              </View>

              <View>
                <Text className="text-indigo-700 font-medium mb-2">Correo electrónico</Text>
                <TextInput
                  value={profile.email}
                  onChangeText={(text) => updateProfile('email', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-indigo-700 font-medium mb-2">Edad</Text>
                <TextInput
                  value={profile.edad}
                  onChangeText={(text) => updateProfile('edad', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Ingresa tu edad"
                  keyboardType="numeric"
                />
              </View>

              <View>
                <Text className="text-indigo-700 font-medium mb-2">Género</Text>
                <TextInput
                  value={profile.genero}
                  onChangeText={(text) => updateProfile('genero', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Ingresa tu género"
                />
              </View>
            </View>
          </View>

          {/* Consentimiento Informado */}
          <View className="bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-4">
            <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-4">
              <Text className="text-white font-semibold text-base">Consentimiento informado</Text>
            </View>
            
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded border-2 mr-3 items-center justify-center bg-indigo-400 border-indigo-400">
                <Text className="text-white text-sm font-bold">✓</Text>
              </View>
              <TouchableOpacity 
                className="flex-1"
                onPress={() => router.push('/consent')}
              >
                <Text className="text-indigo-600 underline">
                  Acepto el consentimiento informado para el uso de esta aplicación
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contacto de Emergencia - Terapeuta */}
          <View className="bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-4">
            <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-6">
              <Text className="text-white font-semibold text-base">Contacto de Emergencia - Terapeuta</Text>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-indigo-700 font-medium mb-2">Nombre</Text>
                <TextInput
                  value={profile.terapeutaNombre}
                  onChangeText={(text) => updateProfile('terapeutaNombre', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Nombre"
                />
              </View>
              <View>
                <Text className="text-indigo-700 font-medium mb-2">Apellido</Text>
                <TextInput
                  value={profile.terapeutaApellido}
                  onChangeText={(text) => updateProfile('terapeutaApellido', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Apellido"
                />
              </View>

              <View>
                <Text className="text-indigo-700 font-medium mb-2">Número de contacto</Text>
                <TextInput
                  value={profile.terapeutaTelefono}
                  onChangeText={(text) => updateProfile('terapeutaTelefono', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="999 666 999"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Contacto de Emergencia Principal */}
          <View className="bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-4">
            <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-6">
              <Text className="text-white font-semibold text-base">Contacto de Emergencia - Principal</Text>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-indigo-700 font-medium mb-2">Nombre</Text>
                <TextInput
                  value={profile.emergenciaPrincipalNombre}
                  onChangeText={(text) => updateProfile('emergenciaPrincipalNombre', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Nombre"
                />
              </View>
              <View>
                <Text className="text-indigo-700 font-medium mb-2">Apellido</Text>
                <TextInput
                  value={profile.emergenciaPrincipalApellido}
                  onChangeText={(text) => updateProfile('emergenciaPrincipalApellido', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Apellido"
                />
              </View>

              <View>
                <Text className="text-indigo-700 font-medium mb-2">Número de contacto</Text>
                <TextInput
                  value={profile.emergenciaPrincipalTelefono}
                  onChangeText={(text) => updateProfile('emergenciaPrincipalTelefono', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="993 992 991"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Contacto de Emergencia Secundario */}
          <View className="bg-white/80 rounded-2xl p-6 border border-indigo-100 shadow-sm mb-4">
            <View className="bg-indigo-400 rounded-xl px-4 py-2 mb-6">
              <Text className="text-white font-semibold text-base">Contacto de Emergencia - Secundario</Text>
            </View>
            
            <View className="space-y-4">
              <View>
                <Text className="text-indigo-700 font-medium mb-2">Nombre</Text>
                <TextInput
                  value={profile.emergenciaSecundariaNombre}
                  onChangeText={(text) => updateProfile('emergenciaSecundariaNombre', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Nombre"
                />
              </View>
              <View>
                <Text className="text-indigo-700 font-medium mb-2">Apellido</Text>
                <TextInput
                  value={profile.emergenciaSecundariaApellido}
                  onChangeText={(text) => updateProfile('emergenciaSecundariaApellido', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="Apellido"
                />
              </View>

              <View>
                <Text className="text-indigo-700 font-medium mb-2">Número de contacto</Text>
                <TextInput
                  value={profile.emergenciaSecundariaTelefono}
                  onChangeText={(text) => updateProfile('emergenciaSecundariaTelefono', text)}
                  className="border border-indigo-100 rounded-xl px-4 py-3 text-indigo-700 bg-white shadow-sm"
                  placeholder="993 992 991"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Guardar Cambios */}
          <TouchableOpacity className={`rounded-2xl px-6 py-4 shadow-sm ${isDirty ? 'bg-indigo-400 active:bg-indigo-500' : 'bg-indigo-300'}`} onPress={handleSave} disabled={!isDirty}>
            <View className="flex-row items-center justify-center">
              <Text className="text-lg mr-3">💾</Text>
              <Text className="text-white font-semibold text-lg">Guardar cambios</Text>
            </View>
          </TouchableOpacity>

          {/* Cerrar sesión */}
          {/* Reemplaza el Link por un botón con handler */}
          <TouchableOpacity 
            className="bg-pink-100 rounded-2xl px-6 py-4 shadow-sm mt-4 border border-pink-200 active:bg-pink-200"
            onPress={handleLogout}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-pink-700 font-semibold text-lg">Cerrar sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </ImageBackground>
  );
}