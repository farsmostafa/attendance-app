import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "./types";

type AdminReportsProps = NativeStackScreenProps<RootStackParamList, "AdminReports">;

const AdminReports: React.FC<AdminReportsProps> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Icon Section */}
        <View style={styles.iconContainer}>
          <Ionicons name="bar-chart-outline" size={80} color="#ffc107" />
        </View>

        {/* Coming Soon Card */}
        <View style={styles.card}>
          <Text style={styles.title}>التقارير</Text>
          <Text style={styles.subtitle}>قيد التطوير</Text>
          <Text style={styles.description}>نحن نعمل على إنشاء تقارير شاملة وتحليلات متقدمة لعملك</Text>

          {/* Feature List */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.featureText}>تقارير الحضور الشهرية</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.featureText}>تقارير الأداء</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.featureText}>التقارير المالية والرواتب</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.featureText}>التحليلات والإحصائيات</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.featureText}>تصدير التقارير (PDF/Excel)</Text>
            </View>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.buttonText}>العودة</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    marginVertical: 30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff8e1",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#ffc107",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  featureList: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 20,
  },
  featureItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    width: "100%",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AdminReports;
