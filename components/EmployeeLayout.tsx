import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import TopHeader from "./TopHeader";
import EmployeeSidebar from "./EmployeeSidebar";
import { getCurrentUserData } from "../services/authService";
import { User, RootStackParamList } from "../types";

export interface EmployeeLayoutProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
  showLoading?: boolean;
  userName?: string;
  navigation?: NativeStackNavigationProp<RootStackParamList>;
}

const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({
  currentScreen,
  onNavigate,
  onLogout,
  children,
  showLoading = false,
  userName,
  navigation,
}) => {
  const [currentUserName, setCurrentUserName] = useState<string>(userName || "موظف");

  useEffect(() => {
    if (!userName) {
      const fetchUserName = async () => {
        try {
          const userData = await getCurrentUserData();
          if (userData?.name) {
            setCurrentUserName(userData.name);
          }
        } catch (err) {
          console.error("Error fetching user name:", err);
        }
      };
      fetchUserName();
    }
  }, [userName]);

  if (showLoading) {
    return (
      <View style={styles.container}>
        <TopHeader userName={currentUserName} navigation={navigation as any} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TopHeader userName={currentUserName} navigation={navigation as any} />

      {/* Main Layout: Content + Sidebar */}
      <View style={styles.layoutContainer}>
        {/* Main Content Area */}
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {/* Persistent Sidebar */}
        <EmployeeSidebar currentScreen={currentScreen} onNavigate={onNavigate} onLogout={onLogout} />
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
    switch (currentScreen) {
      case "AttendanceHistory":
        return <AttendanceHistory navigation={navigation as any} />;
      case "Requests":
        return <Requests navigation={navigation as any} />;
      case "Dashboard":
      default:
        return <EmployeeDashboard navigation={navigation as any} />;
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
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 14,
    color: "#666",
    fontSize: 16,
  },
});

export default EmployeeLayout;
