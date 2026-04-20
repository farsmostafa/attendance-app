import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { User, RootStackParamList } from "./types";
import { getCurrentUserData } from "./services/authService";

import AdminDashboard from "./AdminDashboard";
import LoginScreen from "./LoginScreen";
import EmployeeDashboard from "./EmployeeDashboard";
import AttendanceHistory from "./AttendanceHistory";
import Requests from "./Requests";
import EmployeeProfileAdminView from "./EmployeeProfileAdminView";
import EmployeeLayout from "./components/EmployeeLayout";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Wrapper components to apply EmployeeLayout to each screen
const DashboardWithLayout = (props: NativeStackScreenProps<RootStackParamList, "EmployeeDashboard">) => (
  <EmployeeLayout navigation={props.navigation} activeScreen="Dashboard">
    <EmployeeDashboard {...props} />
  </EmployeeLayout>
);

const AttendanceHistoryWithLayout = (props: NativeStackScreenProps<RootStackParamList, "AttendanceHistory">) => (
  <EmployeeLayout navigation={props.navigation} activeScreen="AttendanceHistory">
    <AttendanceHistory {...props} />
  </EmployeeLayout>
);

const RequestsWithLayout = (props: NativeStackScreenProps<RootStackParamList, "Requests">) => (
  <EmployeeLayout navigation={props.navigation} activeScreen="Requests">
    <Requests {...props} />
  </EmployeeLayout>
);

// Employee Stack - for employee users
function EmployeeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen name="EmployeeDashboard" component={DashboardWithLayout} options={{ title: "لوحة الموظف" }} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryWithLayout} options={{ title: "سجل الحضور" }} />
      <Stack.Screen name="Requests" component={RequestsWithLayout} options={{ title: "الطلبات" }} />
    </Stack.Navigator>
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
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{
          title: "لوحة التحكم",
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
    console.log("App: Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("📋 AUTH STATE CHANGED - Auth Listener Fired");
      console.log("   Current user:", firebaseUser ? firebaseUser.uid : "NULL (LOGGED OUT)");
      console.log("   Email:", firebaseUser?.email || "N/A");

      try {
        if (firebaseUser) {
          console.log("✓ User logged in:", firebaseUser.uid);
          // User is logged in - fetch their full data including role
          const userData = await getCurrentUserData();
          console.log("   User data retrieved:", userData?.role);

          if (userData) {
            console.log("✓ Setting user state - role:", userData.role);
            setAppState({
              user: userData,
              userRole: userData.role as "admin" | "employee",
              loading: false,
            });
          } else {
            // Couldn't fetch user data
            console.warn("⚠ User data not found in Firestore");
            setAppState({
              user: null,
              userRole: null,
              loading: false,
            });
          }
        } else {
          // User is logged out
          console.log("❌ USER LOGGED OUT - Clearing app state and showing LoginScreen");
          setAppState({
            user: null,
            userRole: null,
            loading: false,
          });
        }
      } catch (err) {
        console.error("❌ Error checking auth state:", err);
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
        // Employee user - show Employee Stack
        <EmployeeStack />
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
