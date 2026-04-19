import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types";

interface TopHeaderProps {
  userName?: string;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * TopHeader Component
 * Professional header displayed at the top of all screens
 * - Shows app name on left
 * - Shows user info and logout button on right
 */
const TopHeader: React.FC<TopHeaderProps> = ({ userName = "المستخدم", navigation }) => {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("تأكيد", "هل أنت متأكد من رغبتك في تسجيل الخروج؟", [
      {
        text: "إلغاء",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "نعم، تسجيل خروج",
        onPress: async () => {
          setLoggingOut(true);
          try {
            // Call Firebase signOut directly
            await firebaseSignOut(auth);
            console.log("✓ Sign out successful");
            // App.tsx auth state listener will automatically redirect to LoginScreen
            // No need for manual navigation
          } catch (error) {
            console.error("❌ Sign out error:", error);
            setLoggingOut(false);
            Alert.alert("خطأ", error instanceof Error ? error.message : "فشل تسجيل الخروج. يرجى المحاولة مرة أخرى.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Left Section - App Name */}
      <View style={styles.leftSection}>
        <Ionicons name="briefcase" size={24} color="#007bff" />
        <Text style={styles.appName}>Employees Pro</Text>
      </View>

      {/* Right Section - User Info and Logout */}
      <View style={styles.rightSection}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={28} color="#007bff" />
          <Text style={styles.userName}>{userName}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut} activeOpacity={0.7}>
          {loggingOut ? (
            <ActivityIndicator size="small" color="#dc3545" />
          ) : (
            <>
              <Ionicons name="log-out" size={18} color="#dc3545" />
              <Text style={styles.logoutText}>خروج</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  leftSection: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
  },
  rightSection: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 16,
  },
  userInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    maxWidth: 120,
  },
  logoutButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#ffe0e0",
    borderWidth: 1,
    borderColor: "#ffcccc",
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#dc3545",
  },
});

export default TopHeader;
