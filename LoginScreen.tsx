import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { signInAndBindDevice } from "./services/authService";
import { User, RootStackParamList, FirebaseErrorType } from "./types";

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, "Login">;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  // Toggle between login and signup
  const [isSignup, setIsSignup] = useState(false);

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

  const handleSignup = async () => {
    setSignupError(null);
    setSignupLoading(true);

    try {
      if (!signupName || !signupEmail || !signupPassword) {
        setSignupError("الرجاء ملء جميع الحقول");
        setSignupLoading(false);
        return;
      }

      if (!signupEmail.includes("@")) {
        setSignupError("الرجاء إدخال بريد إلكتروني صحيح");
        setSignupLoading(false);
        return;
      }

      if (signupPassword.length < 6) {
        setSignupError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        setSignupLoading(false);
        return;
      }

      // TODO: Implement signup logic with Firebase Auth
      setSignupError("إنشاء الحسابات متاح قريباً");
      setSignupLoading(false);
    } catch (err) {
      const firebaseError = err as FirebaseErrorType;
      setSignupError(firebaseError?.message || "فشل إنشاء الحساب");
      console.error("Signup error:", err);
      setSignupLoading(false);
    }
  };

  const handlePasswordSubmit = () => {
    handleLogin();
  };

  const handleSignupPasswordSubmit = () => {
    handleSignup();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Title Section with Toggle */}
        <View style={styles.titleSection}>
          <Text style={styles.toggleTitle}>
            <Text style={[styles.toggleText, !isSignup && styles.activeToggle]}>تسجيل الدخول </Text>
            <Text style={[styles.toggleText, isSignup && styles.activeToggle]}>إنشاء حساب</Text>
          </Text>
          <TouchableOpacity
            style={styles.toggleSwitch}
            onPress={() => {
              setIsSignup(!isSignup);
              setError(null);
              setSignupError(null);
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleButton, isSignup && styles.toggleButtonActive]}>
              <Ionicons name={isSignup ? "create-outline" : "log-in-outline"} size={16} color="#ffeba7" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 3D Card Wrapper */}
        <View style={[styles.cardWrap, Platform.OS === "web" && isSignup && styles.cardWrapFlipped]}>
          {!isSignup ? (
            // LOGIN FORM
            <View style={styles.cardFront}>
              <View style={styles.centerWrap}>
                <Text style={styles.formTitle}>تسجيل الدخول</Text>

                {/* Email Input */}
                <View style={styles.formGroup}>
                  <TextInput
                    style={styles.formStyle}
                    placeholder="بريدك الإلكتروني"
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
                    testID="email-input"
                  />
                  <Ionicons name="mail-outline" size={20} style={styles.inputIcon} />
                </View>

                {/* Password Input */}
                <View style={[styles.formGroup, styles.formGroupMt]}>
                  <TextInput
                    style={styles.formStyle}
                    placeholder="كلمة المرور"
                    placeholderTextColor="#c4c3ca"
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
                  <Ionicons name="lock-closed-outline" size={20} style={styles.inputIcon} />
                </View>

                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.btn, loading && styles.btnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? <ActivityIndicator color="#102770" size="small" /> : <Text style={styles.btnText}>تسجيل</Text>}
                </TouchableOpacity>

                {/* Forgot Password */}
                <Text style={styles.forgotPasswordContainer}>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.link}>هل نسيت كلمة المرور؟</Text>
                  </TouchableOpacity>
                </Text>
              </View>
            </View>
          ) : (
            // SIGNUP FORM
            <View style={styles.cardBack}>
              <View style={styles.centerWrap}>
                <Text style={styles.formTitle}>إنشاء حساب</Text>

                {/* Full Name Input */}
                <View style={styles.formGroup}>
                  <TextInput
                    style={styles.formStyle}
                    placeholder="الاسم الكامل"
                    placeholderTextColor="#c4c3ca"
                    value={signupName}
                    onChangeText={(text) => {
                      setSignupName(text);
                      if (signupError) setSignupError(null);
                    }}
                    autoCapitalize="words"
                    editable={!signupLoading}
                  />
                  <Ionicons name="person-outline" size={20} style={styles.inputIcon} />
                </View>

                {/* Email Input */}
                <View style={[styles.formGroup, styles.formGroupMt]}>
                  <TextInput
                    style={styles.formStyle}
                    placeholder="بريدك الإلكتروني"
                    placeholderTextColor="#c4c3ca"
                    value={signupEmail}
                    onChangeText={(text) => {
                      setSignupEmail(text);
                      if (signupError) setSignupError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!signupLoading}
                  />
                  <Ionicons name="mail-outline" size={20} style={styles.inputIcon} />
                </View>

                {/* Password Input */}
                <View style={[styles.formGroup, styles.formGroupMt]}>
                  <TextInput
                    style={styles.formStyle}
                    placeholder="كلمة المرور"
                    placeholderTextColor="#c4c3ca"
                    value={signupPassword}
                    onChangeText={(text) => {
                      setSignupPassword(text);
                      if (signupError) setSignupError(null);
                    }}
                    secureTextEntry
                    editable={!signupLoading}
                    onSubmitEditing={handleSignupPasswordSubmit}
                    returnKeyType="done"
                  />
                  <Ionicons name="lock-closed-outline" size={20} style={styles.inputIcon} />
                </View>

                {/* Error Message */}
                {signupError && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                    <Text style={styles.errorText}>{signupError}</Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.btn, signupLoading && styles.btnDisabled]}
                  onPress={handleSignup}
                  disabled={signupLoading}
                  activeOpacity={0.8}
                >
                  {signupLoading ? <ActivityIndicator color="#102770" size="small" /> : <Text style={styles.btnText}>إنشاء</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    backgroundColor: "#1f2029",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 15,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  toggleText: {
    color: "#8f8f9e",
    paddingHorizontal: 20,
    transition: "all 300ms ease",
  },
  activeToggle: {
    color: "#ffeba7",
  },
  toggleSwitch: {
    width: 60,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ffeba7",
    padding: 0,
    justifyContent: "center",
    alignItems: "flex-start",
    cursor: "pointer",
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#102770",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: -10,
    top: -10,
    zIndex: 20,
  },
  toggleButtonActive: {
    left: 34,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 440,
    height: 400,
    perspective: 800,
    marginTop: 60,
  },
  cardWrapFlipped: {
    ...(Platform.OS === "web" && {
      transform: [{ rotateY: "180deg" }],
    }),
  },
  cardFront: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2b38",
    backgroundImage: "url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/1462889/pat.svg')",
    borderRadius: 6,
    position: "absolute",
    top: 0,
    left: 0,
    ...(Platform.OS === "web" && {
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      transformStyle: "preserve-3d",
    }),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  cardBack: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2a2b38",
    backgroundImage: "url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/1462889/pat.svg')",
    borderRadius: 6,
    position: "absolute",
    top: 0,
    left: 0,
    ...(Platform.OS === "web" && {
      WebkitBackfaceVisibility: "hidden",
      backfaceVisibility: "hidden",
      transformStyle: "preserve-3d",
    }),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  centerWrap: {
    width: "100%",
    paddingHorizontal: 35,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  formTitle: {
    color: "#c4c3ca",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  formGroup: {
    position: "relative",
    width: "100%",
    marginBottom: 12,
  },
  formGroupMt: {
    marginTop: 16,
  },
  formStyle: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    paddingLeft: 55,
    height: 48,
    width: "100%",
    fontWeight: "500",
    borderRadius: 4,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.5,
    color: "#c4c3ca",
    backgroundColor: "#1f2029",
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  inputIcon: {
    position: "absolute",
    top: 12,
    left: 18,
    color: "#ffeba7",
  },
  errorContainer: {
    flexDirection: "row-reverse",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 16,
    alignItems: "center",
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#ff6b6b",
  },
  errorText: {
    color: "#ff9999",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  btn: {
    borderRadius: 4,
    height: 44,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: 30,
    letterSpacing: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    backgroundColor: "#ffeba7",
    color: "#102770",
    marginTop: 32,
    shadowColor: "#ffeba7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#102770",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 13,
  },
  forgotPasswordContainer: {
    marginTop: 16,
    textAlign: "center",
  },
  link: {
    color: "#c4c3ca",
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "none",
  },
});

export default LoginScreen;
