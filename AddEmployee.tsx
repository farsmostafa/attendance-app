import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import { createNewEmployee } from "./services/adminService";
import { getCurrentUserData } from "./services/authService";
import ScreenWrapper from "./components/ScreenWrapper";
import TopHeader from "./components/TopHeader";
import DashboardMenu from "./components/DashboardMenu";
import { Ionicons } from "@expo/vector-icons";

type AddEmployeeProps = NativeStackScreenProps<RootStackParamList, "AddEmployee">;

const DEPARTMENT_OPTIONS = ["IT", "HR", "Sales", "Accounting"];

const AddEmployee: React.FC<AddEmployeeProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    department: "",
    workStartTime: "09:00",
    role: "employee",
    basic_salary: "",
  });

  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);

  // Fetch current user on mount
  React.useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUserData();
      setCurrentUser(userData);
    };
    fetchUser();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert("خطأ", "يرجى إدخال اسم الموظف");
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert("خطأ", "يرجى إدخال البريد الإلكتروني");
      return false;
    }
    if (!formData.email.includes("@")) {
      Alert.alert("خطأ", "البريد الإلكتروني غير صحيح");
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert("خطأ", "يرجى إدخال رقم الهاتف");
      return false;
    }
    if (!formData.department) {
      Alert.alert("خطأ", "يرجى اختيار القسم");
      return false;
    }
    if (!formData.password) {
      Alert.alert("خطأ", "يرجى إدخال كلمة المرور");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("خطأ", "كلمات المرور غير متطابقة");
      return false;
    }
    if (!formData.basic_salary) {
      Alert.alert("خطأ", "يرجى إدخال الراتب الأساسي");
      return false;
    }
    if (isNaN(parseFloat(formData.basic_salary)) || parseFloat(formData.basic_salary) < 0) {
      Alert.alert("خطأ", "الراتب الأساسي يجب أن يكون رقماً موجباً");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const userData = await getCurrentUserData();
      if (!userData?.company_id) {
        Alert.alert("خطأ", "لم نتمكن من العثور على شركتك");
        setLoading(false);
        return;
      }

      // Get current date in YYYY-MM-DD format
      const today = new Date();
      const joinDate = today.toISOString().split("T")[0];

      const result = await createNewEmployee(
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role as "employee" | "admin",
          basicSalary: parseFloat(formData.basic_salary),
          phone: formData.phone,
          department: formData.department,
          workStartTime: formData.workStartTime,
          joinDate: joinDate,
          status: "active",
        },
        userData.company_id,
      );

      Alert.alert("نجاح", result.message, [
        {
          text: "حسناً",
          onPress: () => {
            // Reset form
            setFormData({
              name: "",
              email: "",
              password: "",
              confirmPassword: "",
              phone: "",
              department: "",
              workStartTime: "09:00",
              role: "employee",
              basic_salary: "",
            });
            setShowDepartmentDropdown(false);
            // Navigate back to Employee List
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("خطأ", error.message || "فشل في إنشاء الموظف");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <TopHeader userName={currentUser?.name || "المسؤول"} navigation={navigation} />
      <DashboardMenu navigation={navigation} currentScreen="AddEmployee" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.centeredWrapper}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>إضافة موظف جديد</Text>
              <Text style={styles.subtitle}>ملء جميع الحقول المطلوبة</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>اسم الموظف *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل اسم الموظف الكامل"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange("name", value)}
                  editable={!loading}
                />
              </View>

              {/* Email Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>البريد الإلكتروني *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل البريد الإلكتروني"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  editable={!loading}
                />
              </View>

              {/* Phone Number Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>رقم الهاتف *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل رقم الهاتف"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange("phone", value)}
                  editable={!loading}
                />
              </View>

              {/* Department Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>القسم *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  disabled={loading}
                >
                  <Text style={[styles.dropdownButtonText, !formData.department && styles.placeholderText]}>
                    {formData.department || "اختر القسم"}
                  </Text>
                  <Ionicons name={showDepartmentDropdown ? "chevron-up" : "chevron-down"} size={20} color="#007bff" />
                </TouchableOpacity>
                {showDepartmentDropdown && (
                  <View style={styles.dropdownMenu}>
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <TouchableOpacity
                        key={dept}
                        style={[styles.dropdownItem, formData.department === dept && styles.dropdownItemActive]}
                        onPress={() => {
                          handleInputChange("department", dept);
                          setShowDepartmentDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, formData.department === dept && styles.dropdownItemTextActive]}>{dept}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Shift Start Time Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>وقت بدء الدوام (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00"
                  placeholderTextColor="#999"
                  value={formData.workStartTime}
                  onChangeText={(value) => handleInputChange("workStartTime", value)}
                  editable={!loading}
                  maxLength={5}
                />
              </View>

              {/* Password Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>كلمة المرور *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  editable={!loading}
                />
              </View>

              {/* Confirm Password Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>تأكيد كلمة المرور *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل كلمة المرور مرة أخرى"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange("confirmPassword", value)}
                  editable={!loading}
                />
              </View>

              {/* Role Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>الدور *</Text>
                <View style={styles.roleButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.roleButton, formData.role === "employee" && styles.roleButtonActive]}
                    onPress={() => handleInputChange("role", "employee")}
                    disabled={loading}
                  >
                    <Text style={[styles.roleButtonText, formData.role === "employee" && styles.roleButtonTextActive]}>موظف</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleButton, formData.role === "admin" && styles.roleButtonActive]}
                    onPress={() => handleInputChange("role", "admin")}
                    disabled={loading}
                  >
                    <Text style={[styles.roleButtonText, formData.role === "admin" && styles.roleButtonTextActive]}>مسؤول</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Basic Salary Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>الراتب الأساسي (EGP) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="أدخل الراتب الأساسي"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={formData.basic_salary}
                  onChangeText={(value) => handleInputChange("basic_salary", value)}
                  editable={!loading}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>إنشاء الموظف</Text>}
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  centeredWrapper: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  headerSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: "100%",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
    textAlign: "right",
    width: "100%",
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  placeholderText: {
    color: "#999",
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "#fff",
    marginTop: -8,
    paddingTop: 8,
    zIndex: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemActive: {
    backgroundColor: "#e7f3ff",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
    textAlign: "right",
  },
  dropdownItemTextActive: {
    color: "#007bff",
    fontWeight: "600",
  },
  roleButtonsContainer: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  roleButtonActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  roleButtonTextActive: {
    color: "#fff",
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#e9ecef",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    width: "100%",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AddEmployee;
