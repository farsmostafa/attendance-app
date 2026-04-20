import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SidebarItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
}

interface AdminSidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    icon: "grid",
    screen: "Dashboard",
  },
  {
    id: "employee-list",
    label: "قائمة الموظفين",
    icon: "people",
    screen: "EmployeeList",
  },
  {
    id: "add-employee",
    label: "إضافة موظف",
    icon: "person-add",
    screen: "AddEmployee",
  },
  {
    id: "today-log",
    label: "سجل اليوم",
    icon: "calendar",
    screen: "TodayLog",
  },
  {
    id: "pending-requests",
    label: "الطلبات المعلقة",
    icon: "document-text",
    screen: "PendingRequests",
  },
  {
    id: "reports",
    label: "التقارير",
    icon: "bar-chart",
    screen: "AdminReports",
  },
  {
    id: "settings",
    label: "الإعدادات",
    icon: "settings",
    screen: "AdminSettings",
  },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentScreen, onNavigate }) => {
  return (
    <View style={styles.sidebar}>
      {/* Sidebar Header */}
      <View style={styles.sidebarHeader}>
        <Ionicons name="menu-outline" size={24} color="#007bff" />
        <Text style={styles.sidebarTitle}>القائمة</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Navigation Items */}
      <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onNavigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                <Ionicons name={item.icon} size={20} color={isActive ? "#fff" : "#007bff"} />
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sidebar Footer - Optional branding */}
      <View style={styles.sidebarFooter}>
        <Text style={styles.footerText}>نظام إدارة الحضور</Text>
        <Text style={styles.footerVersion}>v1.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 1,
    borderLeftColor: "#e0e0e0",
    flexDirection: "column",
    paddingBottom: 20,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 0,
  },
  itemsContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  navItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: "#e7f3ff",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  iconContainerActive: {
    backgroundColor: "#007bff",
  },
  navLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  navLabelActive: {
    color: "#007bff",
    fontWeight: "600",
  },
  activeIndicator: {
    width: 3,
    height: 20,
    backgroundColor: "#007bff",
    borderRadius: 2,
    marginLeft: 8,
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 10,
    color: "#999",
  },
});

export default AdminSidebar;
