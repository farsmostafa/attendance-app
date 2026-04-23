import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Animated, Dimensions, useWindowDimensions, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width < 768;

  // Animation values for floating orbs
  const orb1TranslateX = useRef(new Animated.Value(0)).current;
  const orb1TranslateY = useRef(new Animated.Value(0)).current;
  const orb1Rotate = useRef(new Animated.Value(0)).current;
  const orb2TranslateX = useRef(new Animated.Value(0)).current;
  const orb2TranslateY = useRef(new Animated.Value(0)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;
  const orb3Rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Orb 1: Smooth translation + rotation (25s cycle)
    const orb1Animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb1TranslateX, {
            toValue: 150,
            duration: 25000,
            useNativeDriver: false,
          }),
          Animated.timing(orb1TranslateY, {
            toValue: 100,
            duration: 25000,
            useNativeDriver: false,
          }),
          Animated.timing(orb1Rotate, {
            toValue: 10,
            duration: 25000,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb1TranslateX, {
            toValue: 0,
            duration: 25000,
            useNativeDriver: false,
          }),
          Animated.timing(orb1TranslateY, {
            toValue: 0,
            duration: 25000,
            useNativeDriver: false,
          }),
          Animated.timing(orb1Rotate, {
            toValue: 0,
            duration: 25000,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    // Orb 2: Smooth scale + translation (30s cycle, reverse)
    const orb2Animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(orb2TranslateX, {
            toValue: -100,
            duration: 30000,
            useNativeDriver: false,
          }),
          Animated.timing(orb2TranslateY, {
            toValue: -80,
            duration: 30000,
            useNativeDriver: false,
          }),
          Animated.timing(orb2Scale, {
            toValue: 1.2,
            duration: 30000,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(orb2TranslateX, {
            toValue: 0,
            duration: 30000,
            useNativeDriver: false,
          }),
          Animated.timing(orb2TranslateY, {
            toValue: 0,
            duration: 30000,
            useNativeDriver: false,
          }),
          Animated.timing(orb2Scale, {
            toValue: 1,
            duration: 30000,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    // Orb 3: Gentle rotation (20s cycle, delayed)
    const orb3Animation = Animated.loop(
      Animated.sequence([
        Animated.timing(orb3Rotate, {
          toValue: 360,
          duration: 20000,
          useNativeDriver: false,
        }),
        Animated.timing(orb3Rotate, {
          toValue: 0,
          duration: 20000,
          useNativeDriver: false,
        }),
      ])
    );

    Animated.parallel([orb1Animation, orb2Animation, orb3Animation]).start();
  }, []);

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

  const orb1Rotation = orb1Rotate.interpolate({
    inputRange: [0, 10],
    outputRange: ["0deg", "10deg"],
  });

  const orb3Rotation = orb3Rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: "#1f2029" }}>
      <View style={styles.screen}>
        {/* Animated Background */}
        <View style={styles.bgAnimation} />

      {/* Floating Orbs */}
      <Animated.View
        style={[
          styles.floatingOrb,
          styles.orb1,
          {
            transform: [
              { translateX: orb1TranslateX },
              { translateY: orb1TranslateY },
              { rotate: orb1Rotation },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingOrb,
          styles.orb2,
          {
            transform: [
              { translateX: orb2TranslateX },
              { translateY: orb2TranslateY },
              { scale: orb2Scale },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.floatingOrb,
          styles.orb3,
          {
            transform: [{ rotate: orb3Rotation }],
          },
        ]}
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 24 }} style={{ width: '100%', zIndex: 10 }} showsVerticalScrollIndicator={false}>
        {/* Content Container */}
        <View style={styles.container}>
        {/* Brand Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.brandName}>دوّمت</Text>
          <Text style={styles.brandSubtitle}>ATTENDANCE.SYS</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>تسجيل الدخول</Text>
            <Text style={styles.cardSubtitle}>مرحباً بك مجدداً في بوابة الموظفين</Text>
          </View>

          {/* Email Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <View style={[styles.inputContainer, emailFocused && styles.inputContainerFocused]}>
              <TextInput
                style={styles.input}
                placeholder="example@domain.com"
                placeholderTextColor="#969081"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
              <Ionicons name="person-outline" size={20} color="#969081" style={styles.inputIconRight} />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>كلمة المرور</Text>
            </View>
            <View style={[styles.inputContainer, passwordFocused && styles.inputContainerFocused]}>
              <TextInput
                style={styles.inputPassword}
                placeholder="••••••••"
                placeholderTextColor="#969081"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                editable={!loading}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
              <Pressable
                style={styles.visibilityBtnLeft}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={showPassword ? "#ffeba7" : "#969081"}
                />
              </Pressable>
              <Ionicons name="lock-closed-outline" size={20} color="#969081" style={styles.inputIconRight} />
            </View>
          </View>

          {/* Remember Me Checkbox */}
          <View style={styles.checkboxRow}>
            <Pressable
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
            <Pressable onPress={() => setRememberMe(!rememberMe)}>
              <Text style={styles.checkboxLabel}>تذكرني على هذا الجهاز</Text>
            </Pressable>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#ffb4ab" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              loading && styles.submitBtnDisabled,
              pressed && !loading && styles.submitBtnPressed,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Text>
            {!loading && <Ionicons name="log-in-outline" size={24} color="#1f2029" />}
          </Pressable>
        </View>

        {/* System Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>System Status: Operational</Text>
        </View>
        
        </View>
      </ScrollView>

      {/* Security Card - Desktop Only */}
      {!isMobile && (
        <View style={styles.securityCard}>
          <View style={styles.securityCardHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#ffeba7" />
            <Text style={styles.securityCardTitle}>أمان تام</Text>
          </View>
          <Text style={styles.securityCardSubtitle}>تشفير بيانات نهاية لنهاية</Text>
          <Text style={styles.securityCardText}>
            يستخدم نظام "دوّمت" أحدث تقنيات التشفير لضمان سرية بيانات الحضور والانصراف والبيانات الشخصية للموظفين.
          </Text>
        </View>
      )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  bgAnimation: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: -2,
    backgroundColor: "#1f2029",
  },
  floatingOrb: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.35,
    zIndex: -1,
  },
  orb1: {
    width: 500,
    height: 500,
    backgroundColor: "rgba(45, 48, 62, 0.5)",
    top: "-15%",
    right: "-15%",
  },
  orb2: {
    width: 400,
    height: 400,
    backgroundColor: "rgba(26, 27, 38, 0.5)",
    bottom: "-10%",
    left: "-10%",
  },
  orb3: {
    width: 300,
    height: 300,
    backgroundColor: "rgba(36, 38, 51, 0.4)",
    top: "45%",
    left: "30%",
  },
  container: {
    width: "100%",
    maxWidth: 448,
    zIndex: 10,
    alignItems: "center",
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: "center",
    width: "100%",
  },
  brandName: {
    color: "#ffeba7",
    fontSize: 48,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.96,
  },
  brandSubtitle: {
    color: "#cdc6b6",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(42, 43, 56, 0.8)",
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: "rgba(62, 63, 75, 0.5)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 12,
    marginBottom: 24,
  },
  cardHeader: {
    marginBottom: 32,
    width: "100%",
  },
  cardTitle: {
    color: "#e7e2da",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 8,
    lineHeight: 31.2,
  },
  cardSubtitle: {
    color: "#cdc6b6",
    fontSize: 16,
    fontWeight: "400",
    textAlign: "right",
    lineHeight: 25.6,
  },
  formGroup: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    color: "#cdc6b6",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    position: "relative",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3e3f4b",
    minHeight: 56,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 15,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  inputContainerFocused: {
    borderColor: "#ffeba7",
    shadowColor: "#ffeba7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIconRight: {
    position: "absolute",
    right: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    width: "100%",
    height: 56,
    backgroundColor: "transparent",
    color: "#101116",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "right",
    writingDirection: "rtl",
    paddingRight: 45,
    paddingLeft: 15,
    outlineStyle: "none",
  } as any,
  inputPassword: {
    flex: 1,
    width: "100%",
    height: 56,
    backgroundColor: "transparent",
    color: "#101116",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "right",
    writingDirection: "rtl",
    paddingRight: 45,
    paddingLeft: 45,
    outlineStyle: "none",
  } as any,
  visibilityBtnLeft: {
    position: "absolute",
    left: 15,
    padding: 8,
    borderRadius: 8,
    zIndex: 2,
  },
  checkboxRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginVertical: 16,
    paddingVertical: 8,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#3e3f4b",
    backgroundColor: "#1f2029",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ffeba7",
    borderColor: "#ffeba7",
  },
  checkmark: {
    color: "#1f2029",
    fontSize: 14,
    fontWeight: "700",
  },
  checkboxLabel: {
    color: "#cdc6b6",
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  errorContainer: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(255, 180, 171, 0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.5)",
    gap: 12,
  },
  errorText: {
    color: "#ffb4ab",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  submitBtn: {
    backgroundColor: "#ffeba7",
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row-reverse",
    gap: 12,
    borderWidth: 1,
    borderColor: "#ffe89a",
    shadowColor: "#ffeba7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitBtnText: {
    color: "#1f2029",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
  },
  statusContainer: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#abcfb2",
  },
  statusText: {
    color: "#cdc6b6",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  securityCard: {
    position: "absolute",
    bottom: 40,
    left: 40,
    width: 320,
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: "rgba(42, 43, 56, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(62, 63, 75, 0.5)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  securityCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  securityCardTitle: {
    color: "#e7e2da",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "right",
  },
  securityCardSubtitle: {
    color: "#cdc6b6",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  securityCardText: {
    color: "#cdc6b6",
    fontSize: 13,
    fontWeight: "400",
    textAlign: "right",
    lineHeight: 20,
  },
});

export default LoginScreen;
