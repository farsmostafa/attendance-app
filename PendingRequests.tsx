import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "./types";
import { getPendingRequests, approveRequest, rejectRequest, LeaveRequest } from "./services/requestsService";
import { getCurrentUserData } from "./services/authService";

type PendingRequestsProps = NativeStackScreenProps<RootStackParamList, "PendingRequests">;

interface RequestWithEmployee extends LeaveRequest {
  employeeName: string;
  employeeEmail: string;
}

const PendingRequests: React.FC<PendingRequestsProps> = ({ navigation }) => {
  const [requests, setRequests] = useState<RequestWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<RequestWithEmployee | null>(null);
  const [modalType, setModalType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUserData();
      if (!userData?.companyId) {
        Alert.alert("خطأ", "لم نتمكن من العثور على شركتك");
        setLoading(false);
        return;
      }

      const pendingRequests = await getPendingRequests(userData.companyId);
      setRequests(pendingRequests);
    } catch (error: any) {
      Alert.alert("خطأ", error.message || "فشل في جلب الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests().then(() => setRefreshing(false));
  };

  const handleApproveReject = async (action: "approve" | "reject") => {
    if (!selectedRequest?.id) return;

    setSubmitting(true);

    try {
      if (action === "approve") {
        await approveRequest(selectedRequest.id, adminNotes);
      } else {
        await rejectRequest(selectedRequest.id, adminNotes);
      }

      Alert.alert("نجاح", `تم ${action === "approve" ? "الموافقة على" : "رفض"} الطلب بنجاح`);

      // Reset and refresh
      setSelectedRequest(null);
      setModalType(null);
      setAdminNotes("");
      await fetchRequests();
    } catch (error: any) {
      Alert.alert("خطأ", error.message || "فشل في معالجة الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const renderRequestItem = ({ item }: { item: RequestWithEmployee }) => (
    <TouchableOpacity style={styles.requestCard} onPress={() => setSelectedRequest(item)}>
      <View style={styles.requestHeader}>
        <View style={styles.employeeInfo}>
          <View style={styles.employeeAvatar}>
            <Text style={styles.avatarText}>{item.employeeName.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.employeeName}>{item.employeeName}</Text>
            <Text style={styles.employeeEmail}>{item.employeeEmail}</Text>
          </View>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name={item.type === "leave" ? "calendar-outline" : "alert-circle-outline"} size={16} color="#007bff" />
            <Text style={styles.detailText}>{item.type === "leave" ? "إجازة" : "تأخير"}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color="#007bff" />
            <Text style={styles.detailText}>{item.date}</Text>
          </View>
        </View>

        <Text style={styles.reasonLabel}>السبب:</Text>
        <Text style={styles.reason}>{item.reason}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => {
            setSelectedRequest(item);
            setModalType("approve");
          }}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>موافقة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => {
            setSelectedRequest(item);
            setModalType("reject");
          }}
        >
          <Ionicons name="close" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>رفض</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>لا توجد طلبات معلقة</Text>
      <Text style={styles.emptySubtext}>تمت معالجة جميع الطلبات</Text>
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
        <Text style={styles.headerTitle}>طلبات معلقة</Text>
        <View style={styles.requestCount}>
          <Text style={styles.requestCountText}>{requests.length}</Text>
        </View>
      </View>

      {/* Requests List */}
      {requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id || ""}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListEmptyComponent={renderEmptyState}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalType(null);
          setAdminNotes("");
        }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setModalType(null);
                  setAdminNotes("");
                }}
                disabled={submitting}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{modalType === "approve" ? "الموافقة على الطلب" : "رفض الطلب"}</Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedRequest && (
              <View style={styles.modalBody}>
                {/* Request Info Summary */}
                <View style={styles.requestSummary}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>الموظف:</Text>
                    <Text style={styles.summaryValue}>{selectedRequest.employeeName}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>نوع الطلب:</Text>
                    <Text style={styles.summaryValue}>{selectedRequest.type === "leave" ? "إجازة" : "تأخير"}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>التاريخ:</Text>
                    <Text style={styles.summaryValue}>{selectedRequest.date}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>السبب:</Text>
                    <Text style={styles.summaryValue}>{selectedRequest.reason}</Text>
                  </View>
                </View>

                {/* Admin Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>ملاحظات المسؤول (اختياري)</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    placeholder="أضف ملاحظات عند الموافقة أو الرفض"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    editable={!submitting}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionModal}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setModalType(null);
                      setAdminNotes("");
                    }}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      modalType === "approve" ? styles.confirmButtonApprove : styles.confirmButtonReject,
                      submitting && styles.confirmButtonDisabled,
                    ]}
                    onPress={() => handleApproveReject(modalType!)}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name={modalType === "approve" ? "checkmark-circle" : "close-circle"} size={18} color="#fff" />
                        <Text style={styles.confirmButtonText}>{modalType === "approve" ? "الموافقة" : "الرفض"}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  requestCount: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  requestCountText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  requestHeader: {
    marginBottom: 12,
  },
  employeeInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  employeeEmail: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  requestDetails: {
    marginBottom: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  detailRow: {
    flexDirection: "row-reverse",
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    marginBottom: 4,
  },
  reason: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row-reverse",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row-reverse",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  approveButton: {
    backgroundColor: "#28a745",
  },
  rejectButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
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
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  requestSummary: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryItem: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
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
  actionModal: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#e9ecef",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "bold",
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row-reverse",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  confirmButtonApprove: {
    backgroundColor: "#28a745",
  },
  confirmButtonReject: {
    backgroundColor: "#dc3545",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default PendingRequests;
