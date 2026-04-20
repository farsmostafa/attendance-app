import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackNavigationProp } from "../types";
import { createNewEmployee } from "../services/adminService";
import { getCurrentUserData } from "../services/authService";

interface Props {
  navigation?: RootStackNavigationProp;
  companyId: string;
}

const DEPARTMENTS = ["IT", "HR", "Sales", "Marketing", "Finance", "Operations", "Other"];

const AddEmployeeContent: React.FC<Props> = ({ companyId }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    department: "",
    basicSalary: "",
  });

  const [loading, setLoading] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = "الاسم مطلوب";
    if (!formData.email.trim()) newErrors.email = "البريد الإلكتروني مطلوب";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "البريد الإلكتروني غير صحيح";
    if (!formData.password) newErrors.password = "كلمة المرور مطلوبة";
    if (formData.password.length < 6) newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "كلمات المرور غير متطابقة";
    if (!formData.phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (!formData.department) newErrors.department = "القسم مطلوب";
    if (!formData.basicSalary.trim()) newErrors.basicSalary = "الراتب الأساسي مطلوب";
    if (isNaN(parseFloat(formData.basicSalary))) newErrors.basicSalary = "الراتب يجب أن يكون رقماً";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("خطأ في البيانات", "يرجى التحقق من جميع الحقول");
      return;
    }

    setSubmitError("");
    setLoading(true);
    try {
      const result = await createNewEmployee(
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          department: formData.department,
          basicSalary: parseFloat(formData.basicSalary),
          role: "employee",
          joinDate: new Date().toISOString().split("T")[0],
          status: "active",
        },
        companyId,
      );

      // Clear form and show success message
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        department: "",
        basicSalary: "",
      });
      setErrors({});
      setSubmitError("");
      setSuccessMessage("تم إضافة الموظف بنجاح! ✓");
      setLoading(false);
    } catch (error: any) {
      const errorCode = error?.code;
      if (errorCode === "auth/email-already-in-use") {
        setSubmitError("هذا البريد الإلكتروني مسجل بالفعل لموظف آخر");
      } else {
        setSubmitError(error instanceof Error ? error.message : "فشل في إنشاء الموظف");
      }
      setSuccessMessage("");
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-add" size={32} color="#28a745" />
          <Text style={styles.title}>إضافة موظف جديد</Text>
          <Text style={styles.subtitle}>ملء البيانات المطلوبة لإنشاء حساب موظف</Text>
        </View>

        {/* Success Message */}
        {successMessage && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Full Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <View style={[styles.inputContainer, errors.name ? styles.inputError : undefined]}>
            <Ionicons name="person" size={18} color="#007bff" />
            <TextInput
              style={styles.input}
              placeholder="أدخل اسم الموظف"
              placeholderTextColor="#bbb"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!loading}
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Email */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <View style={[styles.inputContainer, errors.email ? styles.inputError : undefined]}>
            <Ionicons name="mail" size={18} color="#007bff" />
            <TextInput
              style={styles.input}
              placeholder="example@company.com"
              placeholderTextColor="#bbb"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text.toLowerCase() })}
              editable={!loading}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>كلمة المرور</Text>
          <View style={[styles.inputContainer, errors.password ? styles.inputError : undefined]}>
            <Ionicons name="lock-closed" size={18} color="#007bff" />
            <TextInput
              style={styles.input}
              placeholder="أدخل كلمة مرور آمنة"
              placeholderTextColor="#bbb"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              editable={!loading}
            />
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {/* Confirm Password */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>تأكيد كلمة المرور</Text>
          <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : undefined]}>
            <Ionicons name="lock-closed" size={18} color="#007bff" />
            <TextInput
              style={styles.input}
              placeholder="أعد إدخال كلمة المرور"
              placeholderTextColor="#bbb"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              editable={!loading}
            />
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>

        {/* Phone */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <View style={[styles.inputContainer, errors.phone ? styles.inputError : undefined]}>
            <Ionicons name="call" size={18} color="#007bff" />
            <TextInput
              style={styles.input}
              placeholder="رقم هاتف المحمول"
              placeholderTextColor="#bbb"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              editable={!loading}
            />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Department */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>القسم</Text>
          <TouchableOpacity
            style={[styles.inputContainer, errors.department ? styles.inputError : undefined]}
            onPress={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
            disabled={loading}
          >
            <Ionicons name="briefcase" size={18} color="#007bff" />
            <Text style={[styles.input, { color: formData.department ? "#333" : "#bbb" }]}>{formData.department || "اختر القسم"}</Text>
            <Ionicons name={showDepartmentDropdown ? "chevron-up" : "chevron-down"} size={18} color="#007bff" />
          </TouchableOpacity>

          {showDepartmentDropdown && (
            <View style={styles.dropdown}>
              {DEPARTMENTS.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, department: dept });
                    setShowDepartmentDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, formData.department === dept && styles.dropdownTextActive]}>{dept}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
        </View>

        {/* Basic Salary */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>الراتب الأساسي (LE)</Text>
          <View style={[styles.inputContainer, errors.basicSalary ? styles.inputError : undefined]}>
            <Ionicons name="cash" size={18} color="#007bff" />
            <TextInput
              style={styles.input}
              placeholder="أدخل المبلغ بالجنيه"
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
              value={formData.basicSalary}
              onChangeText={(text) => setFormData({ ...formData, basicSalary: text })}
              editable={!loading}
            />
          </View>
          {errors.basicSalary && <Text style={styles.errorText}>{errors.basicSalary}</Text>}
        </View>

        {submitError ? (
          <View style={styles.submitErrorBox}>
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitText}>إنشاء الموظف</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity style={styles.cancelButton} disabled={loading} activeOpacity={0.7}>
          <Text style={styles.cancelText}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 20,
  },
  card: {
    backgroundColor: "#fff",
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#f9f9f9",
  },
  inputError: {
    borderColor: "#dc3545",
    backgroundColor: "#fff5f5",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginHorizontal: 8,
    padding: 0,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  submitErrorBox: {
    backgroundColor: "#fdecea",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f5c2c7",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  submitErrorText: {
    color: "#b02a37",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "right",
    fontWeight: "600",
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownText: {
    fontSize: 14,
    color: "#555",
    textAlign: "right",
  },
  dropdownTextActive: {
    color: "#007bff",
    fontWeight: "600",
  },
  successBox: {
    flexDirection: "row-reverse",
    backgroundColor: "#d4edda",
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginBottom: 20,
    alignItems: "center",
    gap: 10,
  },
  successText: {
    color: "#155724",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  submitButton: {
    flexDirection: "row-reverse",
    backgroundColor: "#28a745",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  cancelText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default AddEmployeeContent;
