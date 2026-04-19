import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { getCurrentUserData } from "../services/authService";
import { RootStackParamList } from "../types";
import TopHeader from "./TopHeader";
import EmployeeSidebar from "./EmployeeSidebar";
import EmployeeDashboard from "../EmployeeDashboard";
import AttendanceHistory from "../AttendanceHistory";
import Requests from "../Requests";

interface EmployeeLayoutProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ navigation }) => {
  const [currentScreen, setCurrentScreen] = useState("Dashboard");
  const [currentUserName, setCurrentUserName] = useState("الموظف");
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout failed:", error);
      Alert.alert("خطأ", error?.message || "فشل في تسجيل الخروج");
    }
  };

  const renderContent = () => {
    const dummyRoute = { key: "dummy", name: currentScreen } as any;
    switch (currentScreen) {
      case "AttendanceHistory":
        return <AttendanceHistory navigation={navigation as any} route={dummyRoute} />;
      case "Requests":
        return <Requests navigation={navigation as any} route={dummyRoute} />;
      case "Dashboard":
      default:
        return <EmployeeDashboard navigation={navigation as any} route={dummyRoute} />;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <TopHeader userName={currentUserName} navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeader userName={currentUserName} navigation={navigation} />
      <View style={styles.layoutContainer}>
        <ScrollView style={styles.mainContent} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
        <EmployeeSidebar currentScreen={currentScreen} onNavigate={setCurrentScreen} onLogout={handleLogout} />
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
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    minHeight: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
});

export default EmployeeLayout;
