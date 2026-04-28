import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "./types";
import { submitLeaveRequest, getEmployeeRequests, LeaveRequest } from "./services/requestsService";
import { getCurrentUserData } from "./services/authService";
import { getCurrentCairoDateString } from "./utils/timeUtils";

type RequestsProps = NativeStackScreenProps<RootStackParamList, "Requests"> & { isFocused?: boolean };

const Requests: React.FC<RequestsProps> = ({ navigation, isFocused = true }) => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [requestType, setRequestType] = useState<"leave" | "late">("leave");
  const [requestDate, setRequestDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUserData();
      if (!userData?.uid) {
        Alert.alert("خطأ", "فشل في تحميل بيانات المستخدم");
        return;
      }

      const employeeRequests = await getEmployeeRequests(userData.uid);
      setRequests(employeeRequests);
    } catch (error: any) {
      Alert.alert("خطأ", error.message || "فشل في جلب الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestDate.trim()) {
      Alert.alert("خطأ", "يرجى اختيار التاريخ");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("خطأ", "يرجى إدخال السبب");
      return;
    }

    setSubmitting(true);

    try {
      const userData = await getCurrentUserData();
      if (!userData?.uid) {
        Alert.alert("خطأ", "فشل في تحميل بيانات المستخدم");
        setSubmitting(false);
        return;
      }

      const userName = userData.name || userData.email || "Unknown";

      await submitLeaveRequest(userData.uid, userName, {
        type: requestType,
        date: requestDate,
        reason,
      });

      Alert.alert("نجاح", `تم تقديم طلب ${requestType === "leave" ? "الإجازة" : "التأخير"} بنجاح`);

      // Reset form and refresh
      setRequestDate("");
      setReason("");
      setRequestType("leave");
      setModalVisible(false);
      await fetchRequests();
    } catch (error: any) {
      Alert.alert("خطأ", error.message || "فشل في تقديم الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#ffc107";
      case "Approved":
        return "#28a745";
      case "Rejected":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Pending":
        return "قيد الانتظار";
      case "Approved":
        return "موافق عليه";
      case "Rejected":
        return "مرفوض";
      default:
        return status;
    }
  };

  const renderRequestItem = ({ item }: { item: LeaveRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestTypeContainer}>
          <View
            style={[
              styles.typeIcon,
              {
                backgroundColor: item.type === "leave" ? "#007bff" : "#ffc107",
              },
            ]}
          >
            <Ionicons name={item.type === "leave" ? "calendar-outline" : "alert-circle-outline"} size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.requestTypeText}>{item.type === "leave" ? "طلب إجازة" : "طلب تأخير"}</Text>
            <Text style={styles.requestDate}>{item.date}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusBadgeText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <Text style={styles.requestReason}>{item.reason}</Text>

      {item.admin_notes && (
        <View style={styles.adminNotesContainer}>
          <Text style={styles.adminNotesLabel}>ملاحظات المسؤول:</Text>
          <Text style={styles.adminNotes}>{item.admin_notes}</Text>
        </View>
      )}

      <Text style={styles.requestMeta}>تم التقديم: {new Date(item.created_at || "").toLocaleDateString("en-US")}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>لم تقدم أي طلبات بعد</Text>
      <Text style={styles.emptySubtext}>اضغط على الزر "طلب جديد" لتقديم طلب إجازة أو تأخير</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.newRequestButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.newRequestText}>طلب جديد</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلباتي</Text>
      </View>

      {/* Requests List */}
      {requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id || ""}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.emptyContainer}>{renderEmptyState()}</ScrollView>
      )}

      {/* Submit Request Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={submitting}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>طلب جديد</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalForm}>
              {/* Request Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>نوع الطلب</Text>
                <View style={styles.typeButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.typeButton, requestType === "leave" && styles.typeButtonActive]}
                    onPress={() => setRequestType("leave")}
                    disabled={submitting}
                  >
                    <Ionicons name="calendar-outline" size={18} color={requestType === "leave" ? "#007bff" : "#999"} />
                    <Text style={[styles.typeButtonText, requestType === "leave" && styles.typeButtonTextActive]}>إجازة</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeButton, requestType === "late" && styles.typeButtonActive]}
                    onPress={() => setRequestType("late")}
                    disabled={submitting}
                  >
                    <Ionicons name="alert-circle-outline" size={18} color={requestType === "late" ? "#ffc107" : "#999"} />
                    <Text style={[styles.typeButtonText, requestType === "late" && styles.typeButtonTextActive]}>تأخير</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date Field with Visual Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>التاريخ</Text>
                <View style={styles.datePickerContainer}>
                  <TouchableOpacity
                    style={styles.dateNavButton}
                    onPress={() => {
                      const currentDate = new Date(requestDate || getCurrentCairoDateString());
                      currentDate.setDate(currentDate.getDate() - 1);
                      setRequestDate(currentDate.toISOString().split("T")[0]);
                    }}
                    disabled={submitting}
                  >
                    <Ionicons name="chevron-back" size={20} color="#007bff" />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.dateInputText}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#999"
                    value={requestDate}
                    onChangeText={setRequestDate}
                    editable={!submitting}
                  />

                  <TouchableOpacity
                    style={styles.dateNavButton}
                    onPress={() => {
                      const currentDate = new Date(requestDate || getCurrentCairoDateString());
                      currentDate.setDate(currentDate.getDate() + 1);
                      setRequestDate(currentDate.toISOString().split("T")[0]);
                    }}
                    disabled={submitting}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#007bff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reason Field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>السبب</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="أدخل سبب الطلب"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={reason}
                  onChangeText={setReason}
                  editable={!submitting}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>تقديم الطلب</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  newRequestButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  newRequestText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  requestHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  requestTypeContainer: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  requestTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  requestDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  requestReason: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  adminNotesContainer: {
    backgroundColor: "#f0f0f0",
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  adminNotesLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  adminNotes: {
    fontSize: 12,
    color: "#333",
    lineHeight: 16,
  },
  requestMeta: {
    fontSize: 11,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#999",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#bbb",
    marginTop: 8,
    textAlign: "center",
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
    marginBottom: 16,
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
    paddingBottom: 20,
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
  typeButtonsContainer: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row-reverse",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f9f9f9",
  },
  typeButtonActive: {
    backgroundColor: "#e7f0ff",
    borderColor: "#007bff",
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  typeButtonTextActive: {
    color: "#007bff",
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
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  datePickerContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateInputText: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
    textAlign: "center",
  },
});

export default Requests;
