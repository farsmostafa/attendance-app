import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TopHeaderProps {
  userName?: string;
}

/**
 * TopHeader Component
 * Professional header displayed at the top of all screens
 * - Shows app name on left
 * - Shows user info on right
 */
const TopHeader: React.FC<TopHeaderProps> = ({ userName = "المستخدم" }) => {
  return (
    <View style={styles.container}>
      {/* Left Section - App Name */}
      <View style={styles.leftSection}>
        <Ionicons name="briefcase" size={24} color="#007bff" />
        <Text style={styles.appName}>Employees Pro</Text>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle" size={28} color="#007bff" />
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  leftSection: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
  },
  rightSection: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 16,
  },
  userInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    maxWidth: 120,
  },
});

export default TopHeader;
