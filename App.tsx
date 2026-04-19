import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { User, RootStackParamList, EmployeeTabParamList } from "./types";
import { getCurrentUserData } from "./services/authService";

import AdminDashboard from "./AdminDashboard";
import LoginScreen from "./LoginScreen";
import EmployeeDashboard from "./EmployeeDashboard";
import AttendanceHistory from "./AttendanceHistory";
import Requests from "./Requests";
import AddEmployee from "./AddEmployee";
import EmployeeList from "./EmployeeList";
import TodayLog from "./TodayLog";
import EmployeeProfileAdminView from "./EmployeeProfileAdminView";
import PendingRequests from "./PendingRequests";

const Stack = createNativeStackNavigator<RootStackParamList>();
const EmployeeTab = createBottomTabNavigator<EmployeeTabParamList>();

// Employee Bottom Tab Navigator
function EmployeeTabs() {
  return (
    <EmployeeTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "#999999",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e0e0e0",
          borderTopWidth: 1,
          paddingBottom: 10,
          paddingTop: 5,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 3,
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "EmployeeDashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "AttendanceHistory") {
            iconName = focused ? "history" : "history";
          } else if (route.name === "Requests") {
            iconName = focused ? "document" : "document-outline";
          } else {
            iconName = "help-circle-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <EmployeeTab.Screen
        name="EmployeeDashboard"
        component={EmployeeDashboard}
        options={{
          title: "الرئيسية",
        }}
      />
      <EmployeeTab.Screen
        name="AttendanceHistory"
        component={AttendanceHistory}
        options={{
          title: "السجل",
        }}
      />
      <EmployeeTab.Screen
        name="Requests"
        component={Requests}
        options={{
          title: "الطلبات",
        }}
      />
    </EmployeeTab.Navigator>
  );
}

// Auth Stack - for unauthenticated users
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "تسجيل الدخول" }} />
    </Stack.Navigator>
  );
}

// Admin Stack - for admin users
function AdminStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animationEnabled: false,
      }}
    >
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{
          title: "لوحة التحكم",
          headerStyle: { backgroundColor: "#007bff" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        }}
      />
      <Stack.Screen
        name="AddEmployee"
        component={AddEmployee}
        options={{
          title: "إضافة موظف جديد",
          headerStyle: { backgroundColor: "#007bff" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        }}
      />
      <Stack.Screen
        name="EmployeeList"
        component={EmployeeList}
        options={{
          title: "قائمة الموظفين",
          headerStyle: { backgroundColor: "#007bff" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        }}
      />
      <Stack.Screen
        name="TodayLog"
        component={TodayLog}
        options={{
          title: "سجل اليوم",
          headerStyle: { backgroundColor: "#007bff" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        }}
      />
      <Stack.Screen
        name="EmployeeProfileAdminView"
        component={EmployeeProfileAdminView}
        options={{
          title: "ملف الموظف",
          headerStyle: { backgroundColor: "#007bff" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        }}
      />
      <Stack.Screen
        name="PendingRequests"
        component={PendingRequests}
        options={{
          title: "الطلبات المعلقة",
          headerStyle: { backgroundColor: "#007bff" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
        }}
      />
    </Stack.Navigator>
  );
}

interface AppState {
  user: User | null;
  userRole: "admin" | "employee" | null;
  loading: boolean;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    user: null,
    userRole: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is logged in - fetch their full data including role
          const userData = await getCurrentUserData();
          if (userData) {
            setAppState({
              user: userData,
              userRole: userData.role as "admin" | "employee",
              loading: false,
            });
          } else {
            // Couldn't fetch user data
            setAppState({
              user: null,
              userRole: null,
              loading: false,
            });
          }
        } else {
          // User is logged out
          setAppState({
            user: null,
            userRole: null,
            loading: false,
          });
        }
      } catch (err) {
        console.error("Error checking auth state:", err);
        setAppState({
          user: null,
          userRole: null,
          loading: false,
        });
      }
    });

    return unsubscribe;
  }, []);

  // Show loading spinner while checking auth state
  if (appState.loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* No user logged in - show Auth Stack */}
      {!appState.user ? (
        <AuthStack />
      ) : appState.userRole === "admin" ? (
        // Admin user - show Admin Stack
        <AdminStack />
      ) : (
        // Employee user - show Employee Tabs
        <EmployeeTabs />
      )}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
});
