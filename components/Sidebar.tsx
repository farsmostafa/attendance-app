import React, { useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Colors = {
  background: "#1f2029",
  surface: "#2a2b38",
  surfaceElevated: "#32333f",
  border: "rgba(62, 63, 75, 0.5)",
  accent: "#ffeba7",
  accentText: "#101116",
  textPrimary: "#e7e2da",
  textSecondary: "#969081",
  error: "#ffb4ab",
};
const Spacing = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32 };
const Radius = { sm: 6, md: 12, lg: 16, xl: 24, full: 9999 };
const Typography = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24,
  fontArabic: "Cairo" as const,
  fontLatin: "Manrope" as const,
};

export interface SidebarItem {
  id: string;
  routeName: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface SidebarProps {
  items: SidebarItem[];
  activeRoute: string;
  onNavigate: (routeName: string) => void;
  userName?: string;
  userDepartment?: string;
  userAvatarUrl?: string | null;
  onLogout?: () => void;
  logoutLabel?: string;
  mobile?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onMobileClose?: () => void;
}

const SIDEBAR_WIDTH = 280;
const LOGOUT_ID = "__logout__";

const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeRoute,
  onNavigate,
  userName,
  userDepartment,
  userAvatarUrl,
  onLogout,
  logoutLabel = "تسجيل الخروج",
  mobile = false,
}) => {
  const animationsRef = useRef<Record<string, Animated.Value>>({});
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);

  const animatedValues = useMemo(() => {
    const values = animationsRef.current;
    items.forEach((item) => {
      if (!values[item.id]) {
        values[item.id] = new Animated.Value(0);
      }
    });
    return values;
  }, [items]);

  const animateIn = (itemId: string) => {
    Animated.spring(animatedValues[itemId], {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 150,
    }).start();
  };

  const animateOut = (itemId: string) => {
    Animated.timing(animatedValues[itemId], {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: mobile ? 60 : Spacing.xxl },
        mobile && styles.mobileContainer,
      ]}
    >
      <View style={styles.topSection}>
        <View style={styles.brandingSection}>
          <Text style={styles.appName} numberOfLines={1}>
            DAWEAMT
          </Text>
          <Text style={styles.appSubtitle} numberOfLines={1}>
            Employee Portal
          </Text>
        </View>

        <View style={styles.itemsWrap}>
          {items.map((item) => {
            const isActive = activeRoute === item.routeName;
            const isHovered = hoveredRoute === item.routeName;
            const hoverProgress = animatedValues[item.id];
            const highlighted = isActive || isHovered;

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.itemOuter,
                  {
                    transform: [
                      {
                        scale: hoverProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Pressable
                  style={[styles.itemButton, highlighted && styles.activeItemButton]}
                  onPress={() => onNavigate(item.routeName)}
                  onHoverIn={() => {
                    setHoveredRoute(item.routeName);
                    animateIn(item.id);
                  }}
                  onHoverOut={() => {
                    setHoveredRoute(null);
                    animateOut(item.id);
                  }}
                  onPressIn={() => animateIn(item.id)}
                  onPressOut={() => animateOut(item.id)}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={highlighted ? Colors.accentText : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.itemText, highlighted && styles.activeItemText]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatarContainer}>
            {typeof userAvatarUrl === "string" && userAvatarUrl.trim() ? (
              <Image source={{ uri: userAvatarUrl }} style={styles.profileAvatarImage} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={24} color={Colors.accent} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userName || "موظف"}
            </Text>
            <Text style={styles.profileRole} numberOfLines={1}>
              {userDepartment || "مدير النظام"}
            </Text>
          </View>
        </View>

        {onLogout && (
          <Pressable
            style={[
              styles.logoutButton,
              hoveredRoute === LOGOUT_ID && styles.logoutButtonHovered,
            ]}
            onPress={onLogout}
            onHoverIn={() => setHoveredRoute(LOGOUT_ID)}
            onHoverOut={() => setHoveredRoute(null)}
          >
            <Ionicons
              name="log-out-outline"
              size={19}
              color={hoveredRoute === LOGOUT_ID ? Colors.error : Colors.textSecondary}
            />
            <Text
              style={[
                styles.logoutText,
                hoveredRoute === LOGOUT_ID && { color: Colors.error },
              ]}
            >
              {logoutLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
    right: 0, // RTL: sidebar on the right (physical)
    bottom: 0,
    overflow: "hidden",
    zIndex: 1100,
    borderStartWidth: 1,
    borderStartColor: Colors.border,
  },
  mobileContainer: {
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  topSection: {
    flex: 1,
  },
  brandingSection: {
    alignItems: "flex-end", // RTL alignment
    marginBottom: Spacing.xxl,
  },
  appName: {
    fontFamily: Typography.fontLatin,
    color: Colors.accent,
    fontSize: Typography.xl,
    fontWeight: "900",
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },
  appSubtitle: {
    fontFamily: Typography.fontLatin,
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: "600",
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  itemsWrap: {
    gap: Spacing.sm,
  },
  itemOuter: {
    borderRadius: Radius.md,
  },
  itemButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  activeItemButton: {
    backgroundColor: Colors.accent,
  },
  itemText: {
    fontFamily: Typography.fontLatin,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  activeItemText: {
    color: Colors.accentText,
    fontWeight: "700",
  },
  bottomSection: {
    gap: Spacing.base,
  },
  profileCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
    overflow: "hidden",
  },
  profileAvatarImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    alignItems: "flex-end", // RTL alignment
  },
  profileName: {
    fontFamily: Typography.fontArabic,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: "700",
  },
  profileRole: {
    fontFamily: Typography.fontLatin,
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: "500",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    height: 48,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.md,
  },
  logoutButtonHovered: {
    backgroundColor: "rgba(255, 180, 171, 0.05)",
  },
  logoutText: {
    fontFamily: Typography.fontLatin,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: "600",
  },
});

export default Sidebar;

