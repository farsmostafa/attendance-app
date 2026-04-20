import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, Alert, TouchableOpacity, useWindowDimensions } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getCurrentUserData } from "../services/authService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types";
import TopHeader from "./TopHeader";
import EmployeeSidebar from "./EmployeeSidebar";
import EmployeeDashboard from "../EmployeeDashboard";
import AttendanceHistory from "../AttendanceHistory";

type EmployeeLayoutProps = NativeStackScreenProps<RootStackParamList, "EmployeeDashboard"> & { route?: any };

const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ navigation, route }) => {
  const [currentUserName, setCurrentUserName] = useState("الموظف");
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentScreen, setCurrentScreen] = useState("Dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { width } = useWindowDimensions();

  // Show sidebar by default on large screens (width >= 900), hidden on mobile
  const isMobile = width < 900;
  const shouldShowSidebar = !isMobile || sidebarVisible;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUserData();
        if (userData?.name) {
          setCurrentUserName(userData.name);
        }
      } catch (error) {
        console.error("Error loading employee name:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error: any) {
      console.error("Logout failed:", error);
      Alert.alert("خطأ", error?.message || "فشل في تسجيل الخروج");
    }
  };

  if (loadingUser) {
    return (
      <View style={styles.container}>
        <TopHeader userName={currentUserName} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader userName={currentUserName} />
      <View style={styles.layoutContainer}>
        {/* Hamburger Menu Button - Mobile Only */}
        {isMobile && (
          <View style={styles.mobileMenuButton}>
            <TouchableOpacity onPress={() => setSidebarVisible(!sidebarVisible)} activeOpacity={0.7}>
              <Ionicons name={sidebarVisible ? "close" : "menu"} size={28} color="#007bff" />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.mainContent} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {currentScreen === "Dashboard" && (
            <EmployeeDashboard {...({ navigation, route } as any)} isFocused={currentScreen === "Dashboard"} />
          )}
          {currentScreen === "AttendanceHistory" && (
            <AttendanceHistory
              {...({ navigation, route: { ...route, name: "AttendanceHistory", key: "AttendanceHistory" } } as any)}
              isFocused={currentScreen === "AttendanceHistory"}
            />
          )}
        </ScrollView>

        {/* Sidebar - Hidden on Mobile by Default */}
        {shouldShowSidebar && (
          <EmployeeSidebar
            currentScreen={currentScreen}
            onNavigate={(screen) => {
              setCurrentScreen(screen);
              // Close sidebar after navigation on mobile
              if (isMobile) setSidebarVisible(false);
            }}
            onLogout={handleLogout}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  layoutContainer: {
    flex: 1,
    flexDirection: "row-reverse",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    minHeight: "100%",
  },
  mobileMenuButton: {
    position: "absolute",
    top: 60,
    right: 16,
    zIndex: 100,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
});

export default EmployeeLayout;
