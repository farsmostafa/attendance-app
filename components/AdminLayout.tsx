import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getCurrentUserData } from "../services/authService";
import Sidebar, { SidebarItem } from "./Sidebar";

interface AdminLayoutProps {
  activeRoute: "AdminDashboard" | "EmployeeList" | "AttendanceLogs" | "AdminSettings";
  navigation: any;
  children: React.ReactNode;
  showLoading?: boolean;
  userName?: string;
}

const ADMIN_ITEMS: SidebarItem[] = [
  { id: "admin-dashboard", routeName: "AdminDashboard", label: "Dashboard", icon: "grid-outline" },
  { id: "admin-employee-management", routeName: "EmployeeList", label: "Employees", icon: "people-outline" },
  { id: "admin-attendance-logs", routeName: "AttendanceLogs", label: "Attendance Logs", icon: "calendar-outline" },
  { id: "admin-settings", routeName: "AdminSettings", label: "Settings", icon: "settings-outline" },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ activeRoute, navigation, children, showLoading = false, userName }) => {
  // @ts-ignore - TS-6133 Suppressing unused warnings as requested
  const [currentUserName, setCurrentUserName] = useState<string>(userName || "Admin");
  // @ts-ignore - TS-6133 Suppressing unused warnings as requested
  const [currentUserDepartment, setCurrentUserDepartment] = useState<string>("System Administrator");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const currentUser = await getCurrentUserData();
        if (currentUser) {
          if (!userName && currentUser.name) {
            setCurrentUserName(currentUser.name);
          }
          setCurrentUserDepartment(currentUser.department || "System Administrator");
          setCurrentUserAvatar(typeof currentUser.avatarUrl === "string" ? currentUser.avatarUrl : null);
        }
      } catch (error) {
        console.error("Failed to load current user for header:", error);
      }
    };
    loadUserProfile();
  }, [userName]);

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
    <View style={styles.container}>
      <View style={styles.body}>
        {isMobile && (
          <TouchableOpacity style={styles.mobileToggle} onPress={() => setSidebarVisible((prev) => !prev)} activeOpacity={0.8}>
            <Ionicons name={sidebarVisible ? "close" : "menu"} size={24} color="#ffeba7" />
          </TouchableOpacity>
        )}

        {(!isMobile || sidebarVisible) && (
          <Sidebar
            items={ADMIN_ITEMS}
            activeRoute={activeRoute}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            userName={currentUserName}
            userDepartment={currentUserDepartment}
            userAvatarUrl={currentUserAvatar}
            logoutLabel="تسجيل الخروج"
            mobile={isMobile}
            onMobileClose={() => setSidebarVisible(false)}
          />
        )}

        <ScrollView
          className="flex-1"
          style={[styles.content, { marginRight: isMobile ? 0 : 280 }]}
          contentContainerStyle={[
            styles.contentContainer,
            isMobile && styles.mobileContentContainer,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {showLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#ffeba7" />
              <Text style={styles.loadingText}>جاري التحميل...</Text>
            </View>
          ) : (
            children
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f2029",
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
    backgroundColor: "#1f2029",
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 48,
    minHeight: "100%",
  },
  mobileContentContainer: {
    paddingTop: 72, // clears the absolute burger button (top:20 + height~44 + gap)
    paddingHorizontal: 16,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 10,
    color: "#969081",
    fontSize: 15,
  },
  mobileToggle: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: "#2a2b38",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});

export default AdminLayout;


