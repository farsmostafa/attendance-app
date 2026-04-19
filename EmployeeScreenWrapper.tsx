import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { User, RootStackParamList } from "./types";
import { getCurrentUserData } from "./services/authService";
import EmployeeLayout from "./components/EmployeeLayout";

// Screen components
import EmployeeDashboard from "./EmployeeDashboard";
import AttendanceHistory from "./AttendanceHistory";
import Requests from "./Requests";

type EmployeeScreenProps = NativeStackScreenProps<RootStackParamList>;

const EmployeeScreenWrapper: React.FC<EmployeeScreenProps> = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<string>("Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getCurrentUserData();
        setCurrentUser(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleScreenChange = (screen: string) => {
    setActiveScreen(screen);
  };

  const renderContent = () => {
    switch (activeScreen) {
      case "Dashboard":
        return <EmployeeDashboard navigation={navigation} />;
      case "AttendanceHistory":
        return <AttendanceHistory navigation={navigation} />;
      case "Requests":
        return <Requests navigation={navigation} />;
      default:
        return <EmployeeDashboard navigation={navigation} />;
    }
  };

  if (loading) {
    return (
      <EmployeeLayout
        currentScreen={activeScreen}
        onNavigate={handleScreenChange}
        onLogout={handleLogout}
        showLoading={true}
        userName={currentUser?.name}
        navigation={navigation}
      >
        <View />
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout
        currentScreen={activeScreen}
        onNavigate={handleScreenChange}
        onLogout={handleLogout}
        showLoading={false}
        userName={currentUser?.name}
        navigation={navigation}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout
      currentScreen={activeScreen}
      onNavigate={handleScreenChange}
      onLogout={handleLogout}
      showLoading={false}
      userName={currentUser?.name}
      navigation={navigation}
    >
      {renderContent()}
    </EmployeeLayout>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
  },
});

export default EmployeeScreenWrapper;
