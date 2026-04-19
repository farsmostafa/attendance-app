import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getCurrentUserData } from "./services/authService";
import { User, RootStackParamList } from "./types";

type AdminDashboardProps = NativeStackScreenProps<RootStackParamList, "AdminDashboard">;

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCompany, setHasCompany] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const userData = await getCurrentUserData();
        if (!userData) {
          setError("فشل في تحميل بيانات المستخدم");
          setLoading(false);
          return;
        }

        // Check if company_id exists and is valid
        const companyId = userData.company_id;
        if (!companyId || companyId.trim() === "") {
          setHasCompany(false);
          setLoading(false);
          return;
        }

        // Only run query if company_id is valid
        const q = query(collection(db, "users"), where("company_id", "==", companyId), where("role", "==", "employee"));
        const querySnapshot = await getDocs(q);
        const empList: Employee[] = [];
        querySnapshot.forEach((doc) => {
          empList.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setEmployees(empList);
        setHasCompany(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [navigation]);

  const renderEmployee = ({ item }: { item: Employee }) => (
    <TouchableOpacity
      style={styles.employeeItem}
      onPress={() => {
        /* Navigate to EmployeeDetails */
      }}
    >
      <Text>{item.name}</Text>
      <Text>{item.email}</Text>
    </TouchableOpacity>
  );

  if (loading) return <Text style={styles.loadingText}>جاري التحميل...</Text>;

  if (!hasCompany) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>لوحة التحكم</Text>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>يرجى ربط حسابك بشركة لعرض الموظفين</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>لوحة التحكم</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>لوحة التحكم</Text>
      {employees.length === 0 ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>لا توجد موظفين لعرضهم</Text>
        </View>
      ) : (
        <FlatList data={employees} renderItem={renderEmployee} keyExtractor={(item) => item.id} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "right",
  },
  loadingText: { fontSize: 16, textAlign: "center", marginTop: 20 },
  employeeItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffe6e6",
    borderRadius: 8,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: "#cc0000",
  },
});

export default AdminDashboard;
