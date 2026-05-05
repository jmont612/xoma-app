import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ConsentScreen() {
  const handleAccept = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-neutral">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="px-6 pt-14 pb-8">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2 mr-2">
              <Text className="text-primary text-xl" style={{ includeFontPadding: false, lineHeight: 20 }}>←</Text>
            </TouchableOpacity>
            <Text className="text-gray-800 font-bold text-base">Términos y condiciones</Text>
          </View>

          <Text className="text-3xl font-extrabold text-gray-900 mt-6 mb-3">
            Términos y Condiciones de Uso – Xoma App
          </Text>
          <Text className="text-gray-500 leading-6">Última actualización: 1 de mayo de 2026</Text>
        </View>

        <View className="px-6">
          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-4">
            <Text className="text-gray-900 font-extrabold text-lg mb-3">1. Naturaleza del Servicio y Alcance Técnico</Text>
            <Text className="text-gray-600 leading-6">
              Xoma App es una plataforma tecnológica de soporte terapéutico basada en la Terapia Dialéctico Conductual (DBT) y la Evaluación Ecológica Momentánea (EMA). El software actúa como una herramienta de auto-monitoreo y gestión emocional.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">No es un servicio clínico</Text>
            <Text className="text-gray-600 leading-6">
              El usuario reconoce que la aplicación no constituye un servicio de telemedicina, ni reemplaza la relación médico-paciente. Xoma App no realiza diagnósticos clínicos vinculantes ni prescribe medicación.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Algoritmo de riesgo</Text>
            <Text className="text-gray-600 leading-6">
              El sistema utiliza un algoritmo propietario para categorizar el bienestar del usuario en niveles (Bajo, Medio, Alto). El usuario acepta que estos niveles son indicadores referenciales basados exclusivamente en la información suministrada por él mismo.
            </Text>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-4">
            <Text className="text-gray-900 font-extrabold text-lg mb-3">2. Protocolo de Emergencias y Función “Botón SOS”</Text>
            <Text className="text-gray-600 leading-6">
              Xoma App incluye funcionalidades diseñadas para situaciones de crisis, sujetas a las siguientes condiciones:
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Limitación de respuesta</Text>
            <Text className="text-gray-600 leading-6">
              La aplicación es una herramienta de facilitación de comunicación, no un centro de despacho de emergencias.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Responsabilidad de conectividad</Text>
            <Text className="text-gray-600 leading-6">
              La efectividad de estas funciones depende de la conexión a internet y de los servicios de telefonía del dispositivo. Xoma App no se responsabiliza por fallas técnicas ajenas al software que impidan la comunicación en momentos de crisis.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Uso responsable</Text>
            <Text className="text-gray-600 leading-6">
              El uso malintencionado o lúdico de las funciones de emergencia podrá resultar en la suspensión permanente de la cuenta.
            </Text>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-4">
            <Text className="text-gray-900 font-extrabold text-lg mb-3">3. Gestión de Datos Sensibles y Privacidad</Text>
            <Text className="text-gray-600 leading-6">
              Dada la naturaleza de la información (salud mental), el tratamiento de datos se rige bajo los más altos estándares de seguridad:
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Cifrado y sincronización</Text>
            <Text className="text-gray-600 leading-6">
              Todos los datos, incluyendo el diario terapéutico y registros emocionales, se cifran mediante protocolos HTTPS/TLS durante el tránsito y se almacenan en una infraestructura de nube que actúa como la “fuente única de verdad”.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Confidencialidad de los registros</Text>
            <Text className="text-gray-600 leading-6">
              Las reflexiones libres y etiquetas de sentimientos son privadas. El sistema no comparte estos contenidos con terceros sin la acción explícita de “Exportación Clínica” realizada por el usuario.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Responsabilidad de exportación</Text>
            <Text className="text-gray-600 leading-6">
              Al generar reportes (PDF/Excel), el usuario asume la total responsabilidad sobre la custodia y el envío de dicho documento a terceros (terapeutas, familiares, etc.).
            </Text>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-4">
            <Text className="text-gray-900 font-extrabold text-lg mb-3">4. Obligaciones del Usuario</Text>
            <Text className="text-gray-600 leading-6">
              Para garantizar la integridad del soporte terapéutico, el usuario se compromete a:
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Veracidad de la información</Text>
            <Text className="text-gray-600 leading-6">
              Proporcionar datos honestos en las evaluaciones EMA, ya que la precisión del algoritmo de riesgo y las recomendaciones de regulación emocional dependen de ello.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Seguridad del acceso</Text>
            <Text className="text-gray-600 leading-6">
              Mantener la confidencialidad de sus credenciales y métodos de autenticación (PIN o biometría). El usuario es responsable de cualquier actividad realizada bajo su cuenta.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Integridad técnica</Text>
            <Text className="text-gray-600 leading-6">
              No intentar manipular la API del sistema ni ingresar valores fuera de los rangos establecidos (ej. intensidades emocionales menores a 0 o mayores a 10).
            </Text>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-4">
            <Text className="text-gray-900 font-extrabold text-lg mb-3">5. Red de Apoyo y Contactos de Confianza</Text>
            <Text className="text-gray-900 font-bold mb-2">Consentimiento de terceros</Text>
            <Text className="text-gray-600 leading-6">
              El usuario declara haber obtenido el consentimiento de las personas que registra como “Contactos de Confianza” para recibir notificaciones en caso de crisis.
            </Text>
            <Text className="text-gray-900 font-bold mt-4 mb-2">Eliminación de datos</Text>
            <Text className="text-gray-600 leading-6">
              Al eliminar un contacto de la red de apoyo, Xoma App garantiza la remoción inmediata de sus datos de la base de datos activa para proteger la privacidad de dichos terceros.
            </Text>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-4">
            <Text className="text-gray-900 font-extrabold text-lg mb-3">6. Limitación de Responsabilidad</Text>
            <Text className="text-gray-600 leading-6">
              En ningún caso los desarrolladores de Xoma App serán responsables por daños indirectos, incidentales o consecuentes derivados del uso de la aplicación, incluyendo, pero no limitado a, la interpretación errónea de los indicadores de riesgo por parte del usuario o la falta de disponibilidad de la red de apoyo en un momento determinado.
            </Text>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-6">
            <Text className="text-gray-900 font-extrabold text-lg mb-3">7. Propiedad Intelectual</Text>
            <Text className="text-gray-600 leading-6">
              El diseño de la interfaz, el código fuente, los algoritmos de evaluación de riesgo y el catálogo de herramientas de regulación emocional son propiedad exclusiva de los desarrolladores de Xoma App y están protegidos por las leyes de propiedad intelectual.
            </Text>
          </View>

          <View className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 mb-6">
            <Text className="text-gray-900 font-extrabold text-lg mb-3">8. Aceptación y Modificaciones</Text>
            <Text className="text-gray-600 leading-6">
              El acceso y uso de Xoma App implica la aceptación total de estos términos. El sistema registrará la versión de los términos aceptados y la marca de tiempo (timestamp) en el perfil del usuario para fines de trazabilidad y cumplimiento legal.
            </Text>
          </View>

          <View className="items-center mb-10">
            <Text className="text-gray-400 text-xs">
              Última actualización: 1 de mayo de 2026
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="bg-neutral px-6 pb-6 pt-3 border-t border-gray-100">
        <TouchableOpacity
          onPress={handleAccept}
          className="bg-primary rounded-full py-5 shadow-sm"
        >
          <Text className="text-white text-center font-bold text-base">
            Acepto los términos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white rounded-full py-5 mt-3 border border-gray-200"
        >
          <Text className="text-gray-700 text-center font-bold text-base">
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
