import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { User, RootStackParamList, EmployeeTabParamList } from "./types";

import AdminDashboard from "./AdminDashboard";
import LoginScreen from "./LoginScreen";
import EmployeeDashboard from "./EmployeeDashboard";
import AttendanceHistory from "./AttendanceHistory";
import { getCurrentUserData } from "./services/authService";

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
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 3,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "EmployeeDashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "AttendanceHistory") {
            iconName = focused ? "history" : "history";
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
    </EmployeeTab.Navigator>
  );
}

interface AppState {
  user: User | null;
  loading: boolean;
  initialRoute: keyof RootStackParamList;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    user: null,
    loading: true,
    initialRoute: "Login",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getCurrentUserData();
          if (userData) {
            setAppState({
              user: userData,
              loading: false,
              initialRoute: userData.role === "admin" ? "AdminDashboard" : "EmployeeTabs",
            });
          } else {
            setAppState({
              user: null,
              loading: false,
              initialRoute: "Login",
            });
          }
        } else {
          setAppState({
            user: null,
            loading: false,
            initialRoute: "Login",
          });
        }
      } catch (err) {
        console.error("خطأ في جلب بيانات المستخدم:", err);
        setAppState({
          user: null,
          loading: false,
          initialRoute: "Login",
        });
      }
    });

    return unsubscribe;
  }, []);

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
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          animationEnabled: true,
        }}
        initialRouteName={appState.initialRoute}
      >
        {!appState.user ? (
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "تسجيل الدخول" }} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: "لوحة التحكم - مسؤول" }} />
            <Stack.Screen name="EmployeeTabs" component={EmployeeTabs} options={{ headerShown: false }} />
          </Stack.Group>
        )}
      </Stack.Navigator>
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
