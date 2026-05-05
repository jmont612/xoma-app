import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'therapist' | 'primary' | 'secondary';
}

export default function EmergencyContacts() {
  // Datos de ejemplo de contactos de emergencia
  const emergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'Dr. María González (Terapeuta)',
      phone: '+1234567890',
      type: 'therapist'
    },
    {
      id: '2',
      name: 'Ana Rodríguez (Contacto Principal)',
      phone: '+0987654321',
      type: 'primary'
    },
    {
      id: '3',
      name: 'Carlos Martínez (Contacto Secundario)',
      phone: '+1122334455',
      type: 'secondary'
    }
  ];

  const handleCall = async (phone: string, name: string) => {
    try {
      const phoneUrl = `tel:${phone}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'No se puede realizar la llamada en este dispositivo');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo realizar la llamada');
    }
  };

  const handleMessage = async (phone: string, name: string) => {
    try {
      const smsUrl = `sms:${phone}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'No se puede enviar mensajes en este dispositivo');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la aplicación de mensajes');
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'therapist':
        return 'medical';
      case 'primary':
        return 'person';
      case 'secondary':
        return 'people';
      default:
        return 'person';
    }
  };

  const getContactColor = (type: string) => {
    switch (type) {
      case 'therapist':
        return 'bg-blue-100 border-blue-300';
      case 'primary':
        return 'bg-green-100 border-green-300';
      case 'secondary':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-red-600 pt-12 pb-6 px-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Contactos de Emergencia</Text>
        </View>
        <Text className="text-red-100 text-sm">
          🚨 Contacta inmediatamente si necesitas ayuda urgente
        </Text>
      </View>

      {/* Emergency Message */}
      <View className="bg-red-50 border border-red-200 mx-4 mt-4 p-4 rounded-lg">
        <View className="flex-row items-center mb-2">
          <Ionicons name="warning" size={20} color="#dc2626" />
          <Text className="text-red-700 font-semibold ml-2">Situación de Crisis</Text>
        </View>
        <Text className="text-red-600 text-sm">
          Si estás en peligro inmediato, llama al 911 o acude al servicio de emergencias más cercano.
        </Text>
      </View>

      {/* Contacts List */}
      <View className="px-4 mt-6">
        <Text className="text-gray-700 font-semibold text-lg mb-4">Tus Contactos de Apoyo</Text>
        
        {emergencyContacts.map((contact) => (
          <View 
            key={contact.id} 
            className={`${getContactColor(contact.type)} border-2 rounded-lg p-4 mb-4`}
          >
            {/* Contact Info */}
            <View className="flex-row items-center mb-3">
              <View className="bg-white rounded-full p-2 mr-3">
                <Ionicons 
                  name={getContactIcon(contact.type) as any} 
                  size={24} 
                  color="#374151" 
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base">
                  {contact.name}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {contact.phone}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => handleCall(contact.phone, contact.name)}
                className="flex-1 bg-green-600 rounded-lg py-3 flex-row items-center justify-center"
              >
                <Ionicons name="call" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Llamar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleMessage(contact.phone, contact.name)}
                className="flex-1 bg-blue-600 rounded-lg py-3 flex-row items-center justify-center"
              >
                <Ionicons name="chatbubble" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Escribir</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Additional Help */}
      <View className="bg-gray-100 mx-4 mt-6 mb-8 p-4 rounded-lg">
        <View className="flex-row items-center mb-2">
          <Ionicons name="information-circle" size={20} color="#6b7280" />
          <Text className="text-gray-700 font-semibold ml-2">Recursos Adicionales</Text>
        </View>
        <Text className="text-gray-600 text-sm mb-2">
          • Línea Nacional de Prevención del Suicidio: 988
        </Text>
        <Text className="text-gray-600 text-sm mb-2">
          • Crisis Text Line: Envía &quot;HELLO&quot; al 741741
        </Text>
        <Text className="text-gray-600 text-sm">
          • Emergencias: 911
        </Text>
      </View>
    </ScrollView>
  );
}