import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { requestPasswordReset, verifyResetCode } from "./lib/auth";

type DialogState =
  | { type: "error"; title: string; message: string }
  | { type: "success"; title: string; message: string }
  | null;

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    code?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const id = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownSeconds]);

  const validate = useMemo(
    () => () => {
      const next: {
        code?: string;
        password?: string;
        confirmPassword?: string;
      } = {};
      const c = code.trim();
      if (!c) next.code = "Ingresa el código que recibiste";
      else if (!/^\d{6}$/.test(c)) next.code = "El código debe tener 6 dígitos";

      if (!password) next.password = "Ingresa tu nueva contraseña";
      else if (password.length < 6)
        next.password = "Debe tener al menos 6 caracteres";

      if (!confirmPassword) next.confirmPassword = "Repite tu nueva contraseña";
      else if (password && confirmPassword !== password)
        next.confirmPassword = "Las contraseñas no coinciden";

      return next;
    },
    [code, password, confirmPassword],
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (!email) {
      setDialog({
        type: "error",
        title: "Falta el correo",
        message: "Vuelve a solicitar el código desde la pantalla anterior.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyResetCode(email, code.trim(), password);
      setDialog({
        type: "success",
        title: "Contraseña actualizada",
        message: "Ya puedes iniciar sesión con tu nueva contraseña.",
      });
    } catch (e: any) {
      const message = String(
        e?.message ||
          "No se pudo actualizar tu contraseña. Inténtalo de nuevo.",
      );
      const friendly =
        e?.code === "NETWORK_ERROR"
          ? {
              title: "Sin conexión",
              message:
                "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
            }
          : { title: "Código inválido", message };
      setDialog({
        type: "error",
        title: friendly.title,
        message: friendly.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending || !email) return;
    try {
      setIsResending(true);
      await requestPasswordReset(email);
      setCooldownSeconds(60);
      setDialog({
        type: "success",
        title: "Código reenviado",
        message: "Te enviamos un nuevo código a tu correo.",
      });
    } catch (e: any) {
      const message = String(e?.message || "No se pudo reenviar el código.");
      setDialog({ type: "error", title: "No se pudo reenviar", message });
    } finally {
      setIsResending(false);
    }
  };

  const handleDialogClose = () => {
    const wasSuccess =
      dialog?.type === "success" && dialog.title === "Contraseña actualizada";
    setDialog(null);
    if (wasSuccess) router.replace("/login");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-neutral"
    >
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={handleDialogClose}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-6"
          onPress={handleDialogClose}
        >
          <Pressable
            className="w-full bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm"
            onPress={() => {}}
          >
            <View className="items-center">
              <View
                className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${dialog?.type === "success" ? "bg-[#EAF5F5]" : "bg-[#F9EAEA]"}`}
              >
                <Text
                  className={`text-2xl font-extrabold ${dialog?.type === "success" ? "text-primary" : "text-[#C84A4A]"}`}
                >
                  {dialog?.type === "success" ? "✓" : "!"}
                </Text>
              </View>
              <Text className="text-gray-900 text-lg font-extrabold text-center">
                {dialog?.title}
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-2 leading-relaxed">
                {dialog?.message}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDialogClose}
              className="mt-6 rounded-full py-4 bg-primary active:bg-primary/90"
            >
              <Text className="text-white text-center font-bold text-base">
                Entendido
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-8 py-12">
          <View className="pt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center h-10"
            >
              <Text
                className="text-primary text-sm font-bold"
                style={{ includeFontPadding: false, lineHeight: 16 }}
              >
                Volver
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mt-10 mb-10">
            <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-6">
              <Image
                source={require("../assets/images/logo.png")}
                style={{ width: "60%", height: "60%", tintColor: "white" }}
                contentFit="contain"
              />
            </View>
            <Text className="text-3xl font-extrabold text-primary mb-3 text-center">
              Nueva contraseña
            </Text>
            <Text className="text-primary/70 text-center text-base px-4">
              {email
                ? `Ingresa el código de 6 dígitos que enviamos a ${email} y tu nueva contraseña.`
                : "Ingresa el código de 6 dígitos que recibiste y tu nueva contraseña."}
            </Text>
          </View>

          <View className="w-full">
            <View className="mb-6">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">
                Código de verificación
              </Text>
              <View
                className={`bg-white rounded-full shadow-sm border ${errors.code ? "border-red-500" : "border-transparent"}`}
              >
                <TextInput
                  className="px-6 py-4 text-gray-800 text-base tracking-[8px]"
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  value={code}
                  onChangeText={(v) => {
                    setCode(v.replace(/[^\d]/g, "").slice(0, 6));
                    if (errors.code)
                      setErrors((prev) => ({ ...prev, code: undefined }));
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              {!!errors.code && (
                <Text className="text-red-500 text-xs mt-2 ml-4">
                  {errors.code}
                </Text>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">
                Nueva contraseña
              </Text>
              <View
                className={`bg-white rounded-full shadow-sm flex-row items-center border ${errors.password ? "border-red-500" : "border-transparent"}`}
              >
                <TextInput
                  className="flex-1 px-6 py-4 text-gray-800 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  className="px-5"
                >
                  <Text className="text-primary/60 text-xs font-bold">
                    {showPassword ? "Ocultar" : "Ver"}
                  </Text>
                </TouchableOpacity>
              </View>
              {!!errors.password && (
                <Text className="text-red-500 text-xs mt-2 ml-4">
                  {errors.password}
                </Text>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-primary font-bold text-xs uppercase mb-2 ml-4 tracking-widest">
                Confirmar contraseña
              </Text>
              <View
                className={`bg-white rounded-full shadow-sm border ${errors.confirmPassword ? "border-red-500" : "border-transparent"}`}
              >
                <TextInput
                  className="px-6 py-4 text-gray-800 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={(v) => {
                    setConfirmPassword(v);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
              {!!errors.confirmPassword && (
                <Text className="text-red-500 text-xs mt-2 ml-4">
                  {errors.confirmPassword}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`rounded-full py-4 shadow-sm flex-row justify-center items-center ${isSubmitting ? "bg-primary/70" : "bg-primary active:bg-primary/90"}`}
            >
              <Text className="text-white text-center font-bold text-lg mr-2">
                {isSubmitting ? "Guardando..." : "Cambiar contraseña"}
              </Text>
              {!isSubmitting && (
                <Text className="text-white font-bold text-xl">→</Text>
              )}
            </TouchableOpacity>

            <View className="items-center mt-6">
              <TouchableOpacity
                onPress={handleResend}
                disabled={cooldownSeconds > 0 || isResending}
              >
                <Text className="text-primary/70 font-medium">
                  {isResending
                    ? "Reenviando..."
                    : cooldownSeconds > 0
                      ? `Reenviar código en ${cooldownSeconds}s`
                      : "¿No recibiste el código? Reenviar"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="items-center mt-4">
              <TouchableOpacity onPress={() => router.replace("/login")}>
                <Text className="text-primary/70 font-medium">
                  Iniciar sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
