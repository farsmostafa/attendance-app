import React, { useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  onLogout?: () => void;
  logoutLabel?: string;
  mobile?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onMobileClose?: () => void;
}

const LOGOUT_ID = "__logout__";

const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeRoute,
  onNavigate,
  userName,
  onLogout,
  logoutLabel = "تسجيل الخروج",
  mobile = false,
  onExpandedChange,
}) => {
  const animationsRef = useRef<Record<string, Animated.Value>>({});
  const sidebarWidth = useRef(new Animated.Value(mobile ? 250 : 80)).current;
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

  const expandSidebar = () => {
    if (mobile) return;
    onExpandedChange?.(true);
    Animated.timing(sidebarWidth, {
      toValue: 250,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const collapseSidebar = () => {
    if (mobile) return;
    onExpandedChange?.(false);
    Animated.timing(sidebarWidth, {
      toValue: 80,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const labelOpacity = sidebarWidth.interpolate({
    inputRange: [80, 250],
    outputRange: [0, 1],
  });
  const labelTranslate = sidebarWidth.interpolate({
    inputRange: [80, 250],
    outputRange: [-10, 0],
  });
  const labelWidth = sidebarWidth.interpolate({
    inputRange: [80, 250],
    outputRange: [0, 150],
  });
  const labelSpacing = sidebarWidth.interpolate({
    inputRange: [80, 250],
    outputRange: [0, 10],
  });
  const headerOpacity = sidebarWidth.interpolate({
    inputRange: [80, 250],
    outputRange: [0, 1],
  });
  const headerWidth = sidebarWidth.interpolate({
    inputRange: [80, 250],
    outputRange: [0, 150],
  });
  const headerSpacing = sidebarWidth.interpolate({
    inputRange: [80, 250],
    outputRange: [0, 12],
  });

  return (
    <Animated.View
      style={[styles.container, { width: sidebarWidth, paddingTop: mobile ? 60 : 20 }, mobile && styles.mobileContainer]}
      {...(Platform.OS === "web"
        ? ({
            onMouseEnter: expandSidebar,
            onMouseLeave: collapseSidebar,
          } as any)
        : {})}
    >
      <View style={styles.headerSection}>
        <Ionicons name="person-circle-outline" size={34} color="#c4c3ca" />
        <Animated.View
          style={[
            styles.headerTextWrap,
            {
              opacity: headerOpacity,
              width: headerWidth,
              marginRight: headerSpacing,
              overflow: "hidden",
              transform: [{ translateX: labelTranslate }],
            },
          ]}
        >
          <Text style={styles.appName} numberOfLines={1}>
            دوّمت
          </Text>
          <Text style={styles.userName} numberOfLines={1}>
            {userName || "المستخدم"}
          </Text>
        </Animated.View>
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
                      translateX: hoverProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -6],
                      }),
                    },
                    {
                      scale: hoverProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.03],
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
                <Ionicons name={item.icon} size={20} color={highlighted ? "#102770" : "#c4c3ca"} />
                <Animated.View
                  style={[
                    styles.labelWrap,
                    {
                      opacity: labelOpacity,
                      width: labelWidth,
                      marginRight: labelSpacing,
                      overflow: "hidden",
                      transform: [{ translateX: labelTranslate }],
                    },
                  ]}
                >
                  <Text style={[styles.itemText, highlighted && styles.activeItemText]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {onLogout && (
        <View style={styles.itemOuter}>
          <Pressable
            style={[
              styles.logoutButton,
              { marginHorizontal: mobile ? 0 : 15 },
              hoveredRoute === LOGOUT_ID && styles.activeItemButton,
            ]}
            onPress={onLogout}
            onHoverIn={() => setHoveredRoute(LOGOUT_ID)}
            onHoverOut={() => setHoveredRoute(null)}
          >
            <Ionicons name="log-out-outline" size={19} color={hoveredRoute === LOGOUT_ID ? "#102770" : "#c4c3ca"} />
            <Animated.View
              style={[
                styles.labelWrap,
                {
                  opacity: mobile ? 1 : labelOpacity,
                  width: mobile ? 150 : labelWidth,
                  marginLeft: mobile ? 10 : labelSpacing,
                  overflow: "hidden",
                  transform: [{ translateX: labelTranslate }],
                },
              ]}
            >
              <Text style={[styles.logoutText, hoveredRoute === LOGOUT_ID && styles.activeItemText]}>{logoutLabel}</Text>
            </Animated.View>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    backgroundColor: "#2a2b38",
    paddingHorizontal: 10,
    paddingBottom: 18,
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    zIndex: 1100,
  },
  mobileContainer: {
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerSection: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTextWrap: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  appName: {
    color: "#c4c3ca",
    fontSize: 17,
    fontWeight: "800",
  },
  userName: {
    color: "#9fa0a8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  itemsWrap: {
    flex: 1,
    gap: 10,
  },
  itemOuter: {
    borderRadius: 12,
  },
  itemButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  activeItemButton: {
    backgroundColor: "#ffeba7",
  },
  labelWrap: {
    overflow: "hidden",
  },
  itemText: {
    color: "#c4c3ca",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "left",
  },
  activeItemText: {
    color: "#102770",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c4c3ca33",
    overflow: "hidden",
    marginTop: 10,
  },
  logoutText: {
    color: "#c4c3ca",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Sidebar;
