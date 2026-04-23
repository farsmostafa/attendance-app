import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"; // Fix 2A/2B
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getCurrentUserData } from "../services/authService";
import Sidebar, { SidebarItem } from "./Sidebar";

// ── Design System Tokens (Section 3) ──
const Colors = {
  background: "#1f2029",
  surface: "#2a2b38",
  accent: "#ffeba7",
  textSecondary: "#969081",
};
const Spacing = { base: 16, lg: 20, xl: 24 };
const Radius = { md: 12 };

const SIDEBAR_WIDTH = 280;

interface EmployeeLayoutProps {
  activeRoute: "EmployeeDashboard" | "AttendanceHistory" | "EmployeeProfile";
  navigation: any;
  children: React.ReactNode;
  showLoading?: boolean;
  userName?: string;
  userDepartment?: string;
}

const EMPLOYEE_ITEMS: SidebarItem[] = [
  { id: "employee-dashboard", routeName: "EmployeeDashboard", label: "Dashboard", icon: "home-outline" },
  { id: "employee-history", routeName: "AttendanceHistory", label: "Attendance History", icon: "time-outline" },
  { id: "employee-profile", routeName: "EmployeeProfile", label: "Personal Profile", icon: "person-outline" },
];

const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ activeRoute, navigation, children, showLoading = false, userName, userDepartment }) => {
  const [currentUserName, setCurrentUserName] = useState<string>(userName || "Employee");
  const [currentUserDept, setCurrentUserDept] = useState<string | null>(userDepartment || null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const insets = useSafeAreaInsets(); // Fix 2A: safe area insets for iOS notch/Dynamic Island

  useEffect(() => {
    if (!userName || !userDepartment) {
      const loadUserData = async () => {
        try {
          const currentUser = await getCurrentUserData();
          if (currentUser?.name && !userName) {
            setCurrentUserName(currentUser.name);
          }
          if (currentUser?.department && !userDepartment) {
            setCurrentUserDept(currentUser.department);
          }
        } catch (error) {
          console.error("Failed to load current user for header:", error);
        }
      };
      loadUserData();
    }
  }, [userName, userDepartment]);

  const handleNavigate = (routeName: string) => {
    if (routeName !== activeRoute) {
      navigation.navigate(routeName as never);
    }
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error: any) {
      console.error("Logout failed:", error);
      Alert.alert("Logout failed", error?.message || "Could not log out right now.");
    }
  };

  return (
    // Fix 2B: SafeAreaView prevents content from bleeding under iOS notch, Dynamic Island, and home indicator
    <SafeAreaView style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* ── Mobile Menu Toggle ── */}
      {isMobile && (
        <Pressable
          // Fix 2A: top position respects insets.top so button clears the iOS notch/Dynamic Island
          style={[styles.mobileToggle, { top: insets.top + 8 }]}
          onPress={() => setSidebarVisible((prev) => !prev)}
        >
          <Ionicons name={sidebarVisible ? "close" : "menu"} size={24} color={Colors.accent} />
        </Pressable>
      )}

      {/* ── Sidebar: permanently open on desktop, toggleable on mobile ── */}
      {(!isMobile || sidebarVisible) && (
        <Sidebar
          items={EMPLOYEE_ITEMS}
          activeRoute={activeRoute}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userName={currentUserName}
          userDepartment={currentUserDept || undefined}
          logoutLabel="تسجيل الخروج"
          mobile={isMobile}
          onMobileClose={() => setSidebarVisible(false)}
        />
      )}

      {/* ── Main Content: offset by sidebar width on desktop ── */}
      <View style={[styles.content, !isMobile && { marginRight: SIDEBAR_WIDTH }]}>
        {showLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          children
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Fix 2B: backgroundColor set on SafeAreaView directly, kept here as fallback
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.base,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  mobileToggle: {
    position: "absolute",
    // Fix 2A: `top` is set dynamically via inline style using insets.top + 8
    // This base value is a safe fallback for non-iOS platforms
    top: Spacing.lg,
    right: Spacing.lg, // Physical right — always top-right regardless of RTL
    zIndex: 9999,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
  },
});

export default EmployeeLayout;
