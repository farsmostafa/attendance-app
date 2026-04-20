import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { signInAndBindDevice } from "./services/authService";
import { User, RootStackParamList, FirebaseErrorType } from "./types";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
        setLoading(false);
        return;
      }

      if (!email.includes("@")) {
        setError("الرجاء إدخال بريد إلكتروني صحيح");
        setLoading(false);
        return;
      }

      const userData: User = await signInAndBindDevice(email, password);
      setLoading(false);
      // Navigation is handled by App.tsx auth state change
    } catch (err) {
      const firebaseError = err as FirebaseErrorType;
      setError(firebaseError?.message || "فشل تسجيل الدخول");
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    handleLogin();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* 3D Card Wrapper */}
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>تسجيل الدخول</Text>

            {/* Email Input Group */}
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                placeholderTextColor="#6b6b7b"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                testID="email-input"
              />
            </View>

            {/* Password Input Group */}
            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                placeholderTextColor="#6b6b7b"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry
                editable={!loading}
                onSubmitEditing={handlePasswordSubmit}
                returnKeyType="done"
                testID="password-input"
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#102770" size="small" />
              ) : (
                <>
                  <Ionicons name="arrow-forward" size={18} color="#102770" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>دخول</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Info Text */}
            <Text style={styles.infoText}>اضغط Enter أو اضغط الزر للدخول</Text>
          </View>
        </View>

        {/* Branding */}
        <View style={styles.brandingContainer}>
          <Text style={styles.brandTitle}>نظام الحضور والغياب</Text>
          <Text style={styles.brandSubtitle}>إدارة موحدة للموارد البشرية</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#1f2029",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 440,
    perspective: 1000,
  },
  card: {
    backgroundColor: "#2a2b38",
    borderRadius: 10,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    ...(Platform.OS === "web" && {
      transform: [{ perspective: "1000px" }, { rotateX: "2deg" }],
    }),
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 0.5,
  },
  inputGroup: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#1f2029",
    color: "#c4c3ca",
    padding: 15,
    paddingLeft: 50,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#3a3b48",
    outlineWidth: 0,
  },
  icon: {
    position: "absolute",
    left: 15,
    top: 12,
    color: "#ffeba7",
    zIndex: 10,
  },
  errorContainer: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#ff6b6b",
  },
  errorText: {
    color: "#ff9999",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  btn: {
    backgroundColor: "#ffeba7",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    flexDirection: "row-reverse",
    shadowColor: "#ffeba7",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: "#102770",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 14,
  },
  infoText: {
    color: "#8f8f9e",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  brandingContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  brandTitle: {
    color: "#ffeba7",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: "#8f8f9e",
    fontSize: 12,
    marginTop: 6,
    fontStyle: "italic",
  },
});

export default LoginScreen;
