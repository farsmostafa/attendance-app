import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "./types";
import { addFinancialRecord, getMonthlyFinancialSummary, getMonthlyFinancialRecords } from "./services/financialService";
import { fetchCompanyEmployees } from "./services/adminService";
import { db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

type EmployeeProfileAdminViewProps = NativeStackScreenProps<RootStackParamList, "EmployeeProfileAdminView">;

interface Employee {
  id: string;
  name: string;
  email: string;
  basic_salary: number;
}

interface FinancialRecord {
  id?: string;
  userId: string;
  type: "bonus" | "deduction";
  amount: number;
  reason: string;
  date: string;
}

interface FinancialSummary {
  totalBonuses: number;
  totalDeductions: number;
  absencePenalty: number;
  expectedSalary: number;
}

const EmployeeProfileAdminView: React.FC<EmployeeProfileAdminViewProps> = ({ route, navigation }) => {
  const { employeeId } = route.params as { employeeId: string };

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"bonus" | "deduction">("bonus");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch employee details from adminService (we'll need to fetch all and filter)
        // Or directly from database
        // For now, let's assume we pass employee data through route
        // We need to fetch it from database using employeeId

        // Fetch the employee document directly from Firestore
        const docRef = doc(db, "users", employeeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setEmployee({
            id: employeeId,
            name: data.name || "",
            email: data.email || "",
            basic_salary: data.basic_salary || 0,
          });

          // Fetch financial summary
          const summary = await getMonthlyFinancialSummary(employeeId, data.basic_salary || 0);
          setFinancialSummary(summary);

          // Fetch financial records
          const records = await getMonthlyFinancialRecords(employeeId);
          setFinancialRecords(records);
        } else {
          Alert.alert("خطأ", "لم يتم العثور على الموظف");
          navigation.goBack();
        }
      } catch (error: any) {
        console.error("Error fetching employee data:", error);
        Alert.alert("خطأ", error.message || "فشل في تحميل بيانات الموظف");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId, navigation]);

  const handleAddRecord = async () => {
    if (!amount.trim()) {
      Alert.alert("خطأ", "يرجى إدخال المبلغ");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("خطأ", "يرجى إدخال السبب");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("خطأ", "المبلغ يجب أن يكون رقماً موجباً");
      return;
    }

    setSubmitting(true);

    try {
      await addFinancialRecord({
        userId: employeeId,
        type: modalType,
        amount: numAmount,
        reason,
        date: new Date().toISOString().split("T")[0],
      });

      // Refresh data
      const summary = await getMonthlyFinancialSummary(employeeId, employee?.basic_salary || 0);
      setFinancialSummary(summary);

      const records = await getMonthlyFinancialRecords(employeeId);
      setFinancialRecords(records);

      Alert.alert("نجاح", `تم إضافة ${modalType === "bonus" ? "الحافز" : "الخصم"} بنجاح`);

      // Reset form and close modal
      setAmount("");
      setReason("");
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert("خطأ", error.message || "فشل في إضافة السجل");
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (type: "bonus" | "deduction") => {
    setModalType(type);
    setAmount("");
    setReason("");
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!employee || !financialSummary) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>فشل في تحميل البيانات</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
      {/* Employee Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{employee.name.charAt(0)}</Text>
          </View>
        </View>
        <Text style={styles.employeeName}>{employee.name}</Text>
        <Text style={styles.employeeEmail}>{employee.email}</Text>
        <View style={styles.salaryRow}>
          <Text style={styles.salaryLabel}>الراتب الأساسي:</Text>
          <Text style={styles.salaryValue}>{employee.basic_salary.toLocaleString("ar-EG")} EGP</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.bonusButton]} onPress={() => openModal("bonus")}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>إضافة حافز</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deductionButton]} onPress={() => openModal("deduction")}>
          <Ionicons name="remove-circle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>إضافة خصم</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Report Section */}
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>الملخص الشهري</Text>

        <View style={styles.reportCard}>
          <View style={styles.reportRow}>
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>الحوافز</Text>
              <Text style={[styles.reportValue, styles.bonusValue]}>+{financialSummary.totalBonuses.toLocaleString("ar-EG")}</Text>
            </View>
            <View style={styles.reportDivider} />
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>الخصومات</Text>
              <Text style={[styles.reportValue, styles.deductionValue]}>-{financialSummary.totalDeductions.toLocaleString("ar-EG")}</Text>
            </View>
            <View style={styles.reportDivider} />
            <View style={styles.reportItem}>
              <Text style={styles.reportLabel}>غياب</Text>
              <Text style={[styles.reportValue, styles.deductionValue]}>-{financialSummary.absencePenalty.toLocaleString("ar-EG")}</Text>
            </View>
          </View>

          <View style={styles.reportDividerHorizontal} />

          <View style={styles.expectedSalaryContainer}>
            <Text style={styles.expectedSalaryLabel}>الراتب المتوقع</Text>
            <Text style={styles.expectedSalaryValue}>{financialSummary.expectedSalary.toLocaleString("ar-EG")} EGP</Text>
          </View>
        </View>
      </View>

      {/* Financial Records History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>السجلات المالية</Text>

        {financialRecords.length > 0 ? (
          <View style={styles.recordsList}>
            {financialRecords.map((record) => (
              <View
                key={record.id}
                style={[styles.recordItem, record.type === "bonus" ? styles.recordBonusItem : styles.recordDeductionItem]}
              >
                <View style={styles.recordContent}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordReason}>{record.reason}</Text>
                    <Text style={[styles.recordAmount, record.type === "bonus" ? styles.bonusText : styles.deductionText]}>
                      {record.type === "bonus" ? "+" : "-"}
                      {record.amount.toLocaleString("ar-EG")}
                    </Text>
                  </View>
                  <Text style={styles.recordDate}>{record.date}</Text>
                </View>
                <View style={[styles.recordTypeIcon, record.type === "bonus" ? styles.recordTypeBonus : styles.recordTypeDeduction]}>
                  <Ionicons name={record.type === "bonus" ? "add" : "remove"} size={16} color="#fff" />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyRecords}>
            <Ionicons name="document-outline" size={40} color="#ccc" />
            <Text style={styles.emptyRecordsText}>لا توجد سجلات مالية لهذا الشهر</Text>
          </View>
        )}
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{modalType === "bonus" ? "إضافة حافز" : "إضافة خصم"}</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>المبلغ (EGP)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>السبب</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="أدخل سبب الحافز أو الخصم"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={reason}
                  onChangeText={setReason}
                  editable={!submitting}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleAddRecord}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>{modalType === "bonus" ? "إضافة الحافز" : "إضافة الخصم"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  employeeName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  salaryRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 8,
  },
  salaryLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    marginLeft: 8,
  },
  salaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  actionsContainer: {
    flexDirection: "row-reverse",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row-reverse",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bonusButton: {
    backgroundColor: "#28a745",
  },
  deductionButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  reportSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "right",
  },
  reportCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reportRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-around",
  },
  reportItem: {
    flex: 1,
    alignItems: "center",
  },
  reportLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 6,
  },
  reportValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bonusValue: {
    color: "#28a745",
  },
  deductionValue: {
    color: "#dc3545",
  },
  reportDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  reportDividerHorizontal: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  expectedSalaryContainer: {
    alignItems: "center",
  },
  expectedSalaryLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 6,
  },
  expectedSalaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
  },
  historySection: {
    marginBottom: 20,
  },
  recordsList: {
    gap: 10,
  },
  recordItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recordBonusItem: {
    borderLeftWidth: 3,
    borderLeftColor: "#28a745",
  },
  recordDeductionItem: {
    borderLeftWidth: 3,
    borderLeftColor: "#dc3545",
  },
  recordContent: {
    flex: 1,
    marginRight: 10,
  },
  recordHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  recordReason: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  recordAmount: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  bonusText: {
    color: "#28a745",
  },
  deductionText: {
    color: "#dc3545",
  },
  recordDate: {
    fontSize: 11,
    color: "#999",
  },
  recordTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  recordTypeBonus: {
    backgroundColor: "#28a745",
  },
  recordTypeDeduction: {
    backgroundColor: "#dc3545",
  },
  emptyRecords: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyRecordsText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalForm: {
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "right",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
    textAlign: "right",
  },
  formTextArea: {
    height: 100,
    paddingTop: 10,
  },
  submitButton: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
  },
});

export default EmployeeProfileAdminView;
