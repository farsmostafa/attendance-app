import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RootStackNavigationProp } from "../types";

interface Props {
  navigation?: RootStackNavigationProp;
  companyId: string;
}

const AdminReportsContent: React.FC<Props> = ({ companyId }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>التقارير</Text>
      <Text style={styles.subtitle}>شركة ID: {companyId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
});

export default AdminReportsContent;
