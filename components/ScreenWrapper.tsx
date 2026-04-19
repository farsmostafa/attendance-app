import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * ScreenWrapper Component
 * Provides consistent layout for all screens:
 * - Centers content
 * - Limits max width to 1000px for desktop/tablet
 * - Maintains consistent padding
 */
const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style }) => {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.container}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
  },
});

export default ScreenWrapper;
