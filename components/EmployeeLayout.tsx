import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getCurrentUserData } from "../services/authService";
import Sidebar, { SidebarItem } from "./Sidebar";

interface EmployeeLayoutProps {
  activeRoute: "EmployeeDashboard" | "AttendanceHistory" | "EmployeeProfile";
  navigation: any;
  children: React.ReactNode;
  showLoading?: boolean;
  userName?: string;
}

const EMPLOYEE_ITEMS: SidebarItem[] = [
  { id: "employee-dashboard", routeName: "EmployeeDashboard", label: "Dashboard", icon: "home-outline" },
  { id: "employee-history", routeName: "AttendanceHistory", label: "Attendance History", icon: "time-outline" },
  { id: "employee-profile", routeName: "EmployeeProfile", label: "Personal Profile", icon: "person-outline" },
];

const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ activeRoute, navigation, children, showLoading = false, userName }) => {
  const [currentUserName, setCurrentUserName] = useState<string>(userName || "Employee");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  useEffect(() => {
    if (!userName) {
      const loadName = async () => {
        try {
          const currentUser = await getCurrentUserData();
          if (currentUser?.name) {
            setCurrentUserName(currentUser.name);
          }
        } catch (error) {
          console.error("Failed to load current user for header:", error);
        }
      };
      loadName();
    }
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
            items={EMPLOYEE_ITEMS}
            activeRoute={activeRoute}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            userName={currentUserName}
            logoutLabel="تسجيل الخروج"
            mobile={isMobile}
            onExpandedChange={setSidebarExpanded}
            onMobileClose={() => setSidebarVisible(false)}
          />
        )}

        <ScrollView
          style={[styles.content, { marginRight: isMobile ? 0 : sidebarExpanded ? 250 : 80 }]}
          contentContainerStyle={[styles.contentContainer, isMobile && styles.mobileContentContainer]}
          showsVerticalScrollIndicator={false}
        >
          {showLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#2a2b38" />
              <Text style={styles.loadingText}>Loading...</Text>
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
    backgroundColor: "#2a2b38",
    margin: 0,
    padding: 0,
    borderWidth: 0,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2a2b38",
    margin: 0,
    padding: 0,
    borderWidth: 0,
  },
  content: {
    flex: 1,
    backgroundColor: "#2a2b38",
    margin: 0,
    borderWidth: 0,
  },
  contentContainer: {
    padding: 16,
    minHeight: "100%",
  },
  mobileContentContainer: {
    padding: 20,
    paddingTop: 80,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
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

export default EmployeeLayout;
