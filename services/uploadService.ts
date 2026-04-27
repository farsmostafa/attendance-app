import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export const pickAndUploadImage = async (): Promise<string | null> => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    Alert.alert("Permission required", "Please allow photo library access to choose an avatar image.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });

  if (result.canceled || !result.assets?.length || !result.assets[0].base64) {
    return null;
  }

  const formData = new FormData();
  formData.append("key", "ae278b681e54e16b49e1847aedb23305");
  formData.append("image", result.assets[0].base64);

  try {
    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    const json = await response.json();

    if (json?.success && json?.data?.url) {
      return json.data.url as string;
    }

    return null;
  } catch (error) {
    console.error("Error uploading image to ImgBB:", error);
    return null;
  }
};
