import { Link, router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ConsentScreen() {
  const handleAccept = () => {
    // Regresar a la pantalla anterior con consentimiento aceptado
    router.back();
  };

  return (
    <View className="flex-1 bg-white">
      {/* Content */}
      <ScrollView className="flex-1 px-6 py-12" showsVerticalScrollIndicator={false}>
        <View className="space-y-6">
          {/* Back Button */}
          {/* <View className="mb-4">
            <Link href="/register" asChild>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-blue-600 text-lg">← Atrás</Text>
              </TouchableOpacity>
            </Link>
          </View> */}

          {/* Introduction */}
          <View>
            <Text className="text-2xl font-bold text-gray-800 mb-4">
              Términos y Condiciones de Uso
            </Text>
            <Text className="text-gray-600 leading-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </Text>
          </View>

          {/* Section 1 */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              1. Aceptación de los Términos
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </Text>
            <Text className="text-gray-600 leading-6">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </Text>
          </View>

          {/* Section 2 */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              2. Uso del Servicio
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </Text>
            <Text className="text-gray-600 leading-6">
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
            </Text>
          </View>

          {/* Section 3 */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              3. Privacidad y Datos Personales
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
            </Text>
            <Text className="text-gray-600 leading-6">
              Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.
            </Text>
          </View>

          {/* Section 4 */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              4. Responsabilidades del Usuario
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
            </Text>
            <Text className="text-gray-600 leading-6">
              Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
            </Text>
          </View>

          {/* Section 5 */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              5. Limitación de Responsabilidad
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
            </Text>
            <Text className="text-gray-600 leading-6">
              Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
            </Text>
          </View>

          {/* Section 6 */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              6. Modificaciones
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.
            </Text>
            <Text className="text-gray-600 leading-6">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
          </View>

          {/* Section 7 */}
          <View>
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              7. Contacto
            </Text>
            <Text className="text-gray-600 leading-6 mb-4">
              Si tienes preguntas sobre estos términos y condiciones, puedes contactarnos a través de:
            </Text>
            <View className="bg-gray-50 p-4 rounded-lg">
              <Text className="text-gray-700 font-medium">Email: legal@xoma.com</Text>
              <Text className="text-gray-700 font-medium">Teléfono: +1 (555) 123-4567</Text>
              <Text className="text-gray-700 font-medium">Dirección: 123 Lorem Street, Ipsum City, LC 12345</Text>
            </View>
          </View>

          {/* Last Updated */}
          <View className="border-t border-gray-200 pt-6">
            <Text className="text-gray-500 text-sm text-center">
              Última actualización: 15 de enero de 2024
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="bg-white border-t border-gray-200 px-6 py-4">
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleAccept}
            className="bg-blue-600 rounded-xl py-4 shadow-lg active:bg-blue-700"
          >
            <Text className="text-white text-center font-semibold text-lg">
              Acepto los Términos
            </Text>
          </TouchableOpacity>

          <Link href="/register" asChild>
            <TouchableOpacity className="bg-gray-100 rounded-xl py-4">
              <Text className="text-gray-700 text-center font-medium text-lg">
                Volver sin Aceptar
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}