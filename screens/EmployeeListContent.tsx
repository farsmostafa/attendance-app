import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";

interface Props {
  navigation?: NativeStackNavigationProp<RootStackParamList>;
  companyId: string;
}

const EmployeeListContent: React.FC<Props> = ({ companyId }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>قائمة الموظفين</Text>
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

export default EmployeeListContent;
