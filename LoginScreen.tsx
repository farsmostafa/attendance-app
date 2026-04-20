import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.appTitle}>تطبيق الحضور والغياب</Text>
          <Text style={styles.appSubtitle}>نظام إدارة الموارد البشرية</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formContent}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>البريد الإلكتروني</Text>
              <TextInput
                style={[styles.input, !!error && !password ? styles.inputError : undefined]}
                placeholder="أدخل بريدك الإلكتروني"
                placeholderTextColor="#999"
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

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور</Text>
              <TextInput
                style={[styles.input, !!error && password ? styles.inputError : undefined]}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="#999"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry
                editable={!loading}
                testID="password-input"
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>دخول</Text>}
            </TouchableOpacity>

            {/* Info Text */}
            <Text style={styles.infoText}>استخدم بيانات اعتمادك للدخول إلى النظام</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1976d2",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  formContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  formContent: {
    padding: 28,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#d32f2f",
    backgroundColor: "#ffebee",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#d32f2f",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  button: {
    backgroundColor: "#1976d2",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  infoText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});

export default LoginScreen;
