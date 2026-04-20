import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TopHeader from "./TopHeader";
import AdminSidebar from "./AdminSidebar";
import { getCurrentUserData } from "../services/authService";
import { User, RootStackNavigationProp } from "../types";

export interface AdminLayoutProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  children: React.ReactNode;
  showLoading?: boolean;
  userName?: string;
  navigation?: RootStackNavigationProp;
  onLogout?: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentScreen,
  onNavigate,
  children,
  showLoading = false,
  userName,
  navigation,
  onLogout,
}) => {
  const [currentUserName, setCurrentUserName] = useState<string>(userName || "مسؤول");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { width } = useWindowDimensions();

  // Show sidebar by default on large screens (width >= 900), hidden on mobile
  const isMobile = width < 900;
  const shouldShowSidebar = !isMobile || sidebarVisible;

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
      {/* Header */}
      <TopHeader userName={currentUserName} />

      {/* Main Layout: Content + Sidebar */}
      <View style={styles.layoutContainer}>
        {/* Hamburger Menu Button - Mobile Only */}
        {isMobile && (
          <View style={styles.mobileMenuButton}>
            <TouchableOpacity onPress={() => setSidebarVisible(!sidebarVisible)} activeOpacity={0.7}>
              <Ionicons name={sidebarVisible ? "close" : "menu"} size={28} color="#007bff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content Area */}
        <ScrollView style={styles.mainContent} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        {/* Persistent Sidebar - Hidden on Mobile by Default */}
        {shouldShowSidebar && (
          <AdminSidebar
            currentScreen={currentScreen}
            onNavigate={(screen) => {
              onNavigate(screen);
              // Close sidebar after navigation on mobile
              if (isMobile) setSidebarVisible(false);
            }}
            onLogout={onLogout || (() => {})}
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
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
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
    fontSize: 16,
    color: "#666",
  },
});

export default AdminLayout;
