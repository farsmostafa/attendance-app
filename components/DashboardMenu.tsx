import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RootStackNavigationProp, RootStackParamList } from "../types";

interface DashboardMenuProps {
  navigation: RootStackNavigationProp;
  currentScreen?: string;
}

interface MenuItemType {
  id: string;
  label: string;
  screen: keyof RootStackParamList;
  icon: keyof typeof Ionicons.glyphMap;
}

const MENU_ITEMS: MenuItemType[] = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    screen: "AdminDashboard",
    icon: "grid-outline",
  },
  {
    id: "employees",
    label: "قائمة الموظفين",
    screen: "EmployeeList",
    icon: "people-outline",
  },
  {
    id: "add-employee",
    label: "إضافة موظف",
    screen: "AddEmployee",
    icon: "person-add-outline",
  },
  {
    id: "today-log",
    label: "سجل اليوم",
    screen: "TodayLog",
    icon: "calendar-outline",
  },
  {
    id: "pending-requests",
    label: "الطلبات المعلقة",
    screen: "PendingRequests",
    icon: "document-outline",
  },
  {
    id: "reports",
    label: "التقارير",
    screen: "AdminReports",
    icon: "bar-chart-outline",
  },
  {
    id: "settings",
    label: "الإعدادات",
    screen: "AdminSettings",
    icon: "settings-outline",
  },
];

/**
 * DashboardMenu Component
 * Provides easy navigation between admin screens
 * Can be displayed as a horizontal menu or sidebar
 */
const DashboardMenu: React.FC<DashboardMenuProps> = ({ navigation, currentScreen }) => {
  const handleNavigation = (screen: keyof RootStackParamList) => {
    if (screen !== currentScreen) {
      navigation.navigate(screen as any);
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {MENU_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.menuItem, currentScreen === item.screen && styles.menuItemActive]}
          onPress={() => handleNavigation(item.screen)}
          activeOpacity={0.7}
        >
          <Ionicons name={item.icon} size={20} color={currentScreen === item.screen ? "#007bff" : "#666"} />
          <Text style={[styles.menuLabel, currentScreen === item.screen && styles.menuLabelActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row-reverse",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  menuItem: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 4,
    minWidth: 80,
  },
  menuItemActive: {
    backgroundColor: "#e7f3ff",
    borderColor: "#007bff",
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  menuLabelActive: {
    color: "#007bff",
    fontWeight: "bold",
  },
});

export default DashboardMenu;
