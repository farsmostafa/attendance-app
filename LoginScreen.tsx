import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
        setError("Please enter your email and password");
        setLoading(false);
        return;
      }

      if (!email.includes("@")) {
        setError("Please enter a valid email");
        setLoading(false);
        return;
      }

      const userData: User = await signInAndBindDevice(email, password);
      setLoading(false);
      // Navigation handled by App.tsx auth state
    } catch (err) {
      const firebaseError = err as FirebaseErrorType;
      setError(firebaseError?.message || "Login failed");
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Login Card */}
        <View style={[styles.card, Platform.OS === "web" && { boxShadow: "0 15px 35px rgba(0, 0, 0, 0.5)" }]}>
          {/* Title */}
          <Text style={styles.title}>LOG IN</Text>

          {/* Email Input Group */}
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="email-outline" size={24} style={styles.icon} />
            <TextInput
              style={[styles.input, Platform.OS === "web" && { boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)" }]}
              placeholder="Email"
              placeholderTextColor="#c4c3ca"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          {/* Password Input Group */}
          <View style={styles.inputGroup}>
            <MaterialCommunityIcons name="lock-outline" size={24} style={styles.icon} />
            <TextInput
              style={[styles.input, Platform.OS === "web" && { boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)" }]}
              placeholder="Password"
              placeholderTextColor="#c4c3ca"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              secureTextEntry
              editable={!loading}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#ff6b6b" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.btn,
              loading && styles.btnDisabled,
              Platform.OS === "web" && { boxShadow: "0 8px 24px rgba(255, 235, 167, 0.2)" },
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#102770" size="small" /> : <Text style={styles.btnText}>SUBMIT</Text>}
          </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#2a2b38",
    borderRadius: 10,
    padding: 35,
    elevation: 25,
    ...(Platform.OS === "web" && {
      transform: [{ perspective: "1000px" }, { rotateX: "2deg" }],
      boxShadow: "0 15px 35px rgba(0, 0, 0, 0.5)",
    }),
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 1,
  },
  inputGroup: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#1f2029",
    color: "#c4c3ca",
    paddingVertical: 13,
    paddingHorizontal: 20,
    paddingLeft: 55,
    height: 48,
    fontSize: 14,
    borderRadius: 4,
    borderWidth: 0,
    textAlign: "left",
    elevation: 8,
    ...(Platform.OS === "web" && {
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    }),
  },
  icon: {
    position: "absolute",
    left: 18,
    top: 12,
    color: "#ffeba7",
    zIndex: 10,
  },
  errorContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    alignItems: "center",
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
    paddingVertical: 15,
    paddingHorizontal: 30,
    height: 44,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    elevation: 12,
    ...(Platform.OS === "web" && {
      boxShadow: "0 8px 24px rgba(255, 235, 167, 0.2)",
    }),
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#102770",
    fontWeight: "600",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});

export default LoginScreen;
