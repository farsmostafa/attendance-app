import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SidebarItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
}

interface EmployeeSidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "home", label: "الرئيسية", icon: "home", screen: "Dashboard" },
  { id: "history", label: "سجل الحضور", icon: "time", screen: "AttendanceHistory" },
  { id: "requests", label: "طلباتي", icon: "document-text", screen: "Requests" },
];

const EmployeeSidebar: React.FC<EmployeeSidebarProps> = ({ currentScreen, onNavigate, onLogout }) => {
  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Ionicons name="menu-outline" size={24} color="#007bff" />
        <Text style={styles.sidebarTitle}>القائمة</Text>
      </View>

      <View style={styles.divider} />

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
        ;
      </ScrollView>

      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#dc3545" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: "#f8f9fa",
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb",
    paddingBottom: 20,
    flexDirection: "column",
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  itemsContainer: {
    flex: 1,
    paddingTop: 10,
  },
  navItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: "#e7f3ff",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  iconContainerActive: {
    backgroundColor: "#007bff",
  },
  navLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  navLabelActive: {
    color: "#007bff",
  },
  activeIndicator: {
    width: 3,
    height: 24,
    backgroundColor: "#007bff",
    borderRadius: 2,
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  logoutButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#dc3545",
  },
});

export default EmployeeSidebar;
