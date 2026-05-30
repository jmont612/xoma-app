import { ImageSourcePropType } from "react-native";

const AVATARS = {
  man: require("../../assets/images/man.webp") as ImageSourcePropType,
  woman: require("../../assets/images/woman.webp") as ImageSourcePropType,
  nonBinary: require("../../assets/images/non-binary.webp") as ImageSourcePropType,
};

/**
 * Devuelve el avatar por defecto según el género del usuario.
 * Se usa como fallback cuando el usuario no ha subido un avatar propio.
 * masculino -> man, femenino -> woman, otro/no especificado -> non-binary.
 */
export function getDefaultAvatarByGender(
  gender?: string | null,
): ImageSourcePropType {
  const g = String(gender || "")
    .trim()
    .toLowerCase();
  if (["masculino", "male", "hombre", "m"].includes(g)) return AVATARS.man;
  if (["femenino", "female", "mujer", "f"].includes(g)) return AVATARS.woman;
  return AVATARS.nonBinary;
}
