import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface SidebarItem {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
}

interface SidebarProps {
  items: SidebarItem[];
  activeItemId?: string;
}

const ITEM_HEIGHT = 60; // Height per item

const Sidebar: React.FC<SidebarProps> = ({ items, activeItemId }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const tooltipAnims = useRef(
    items.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-20),
    })),
  ).current;

  const activeIndex = items.findIndex((item) => item.id === activeItemId);
  const currentIndex = hoveredIndex !== null ? hoveredIndex : activeIndex >= 0 ? activeIndex : 0;

  useEffect(() => {
    animateBubble(currentIndex);
  }, [currentIndex]);

  const animateBubble = (index: number) => {
    Animated.spring(bubbleAnim, {
      toValue: index * ITEM_HEIGHT,
      useNativeDriver: true,
    }).start();
  };

  const animateTooltipIn = (index: number) => {
    Animated.parallel([
      Animated.timing(tooltipAnims[index].opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipAnims[index].translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateTooltipOut = (index: number) => {
    Animated.parallel([
      Animated.timing(tooltipAnims[index].opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipAnims[index].translateX, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
    animateBubble(index);
    animateTooltipIn(index);
  };

  const handleMouseLeave = (index: number) => {
    setHoveredIndex(null);
    animateTooltipOut(index);
  };

  return (
    <View style={styles.container}>
      {/* Sliding Bubble */}
      <Animated.View
        style={[
          styles.bubble,
          {
            transform: [{ translateY: bubbleAnim }],
          },
        ]}
      />

      {/* Menu Items */}
      {items.map((item, index) => {
        const isActive = item.id === activeItemId;
        const isHovered = hoveredIndex === index;
        return (
          <View key={item.id} style={styles.itemContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={item.onPress}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={() => handleMouseLeave(index)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={24}
                color={isActive || isHovered ? "#102770" : "#c4c3ca"}
              />
            </TouchableOpacity>

            {/* Tooltip */}
            <Animated.Text
              style={[
                styles.tooltip,
                {
                  opacity: tooltipAnims[index].opacity,
                  transform: [{ translateX: tooltipAnims[index].translateX }],
                },
              ]}
            >
              {item.label}
            </Animated.Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: 20,
    left: 20,
    bottom: 20,
    width: 80,
    backgroundColor: "#2a2b38",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 20,
  },
  bubble: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 40,
    backgroundColor: "#ffeba7",
    borderRadius: 15,
    top: 20,
  },
  itemContainer: {
    width: "100%",
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  menuItem: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    zIndex: 10,
  },
  tooltip: {
    position: "absolute",
    right: -120,
    top: 10,
    backgroundColor: "#2a2b38",
    color: "#ffeba7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "500",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Sidebar;
