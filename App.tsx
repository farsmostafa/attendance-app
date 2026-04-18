import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { User, RootStackParamList } from "./types";

import AdminDashboard from "./AdminDashboard";
import LoginScreen from "./LoginScreen";
import EmployeeDashboard from "./EmployeeDashboard";
import { getCurrentUserData } from "./services/authService";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
              initialRoute: userData.role === "admin" ? "AdminDashboard" : "EmployeeDashboard",
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
            <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboard} options={{ title: "لوحتي - موظف" }} />
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
