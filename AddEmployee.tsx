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
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert("Ø®Ø·Ø£", "ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ø³Ù… Ø§Ù„Ù…ÙˆØ¸Ù");
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert("Ø®Ø·Ø£", "ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ");
      return false;
    }
    if (!formData.email.includes("@")) {
      Alert.alert("Ø®Ø·Ø£", "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­");
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Ø®Ø·Ø£", "ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ");
      return false;
    }
    if (!formData.department) {
      Alert.alert("Ø®Ø·Ø£", "ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù‚Ø³Ù…");
      return false;
    }
    if (!formData.password) {
      Alert.alert("Ø®Ø·Ø£", "ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("Ø®Ø·Ø£", "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Ø®Ø·Ø£", "ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚Ø©");
      return false;
    }
    if (!formData.basic_salary) {
      Alert.alert("Ø®Ø·Ø£", "ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø±Ø§ØªØ¨ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ");
      return false;
    }
    if (isNaN(parseFloat(formData.basic_salary)) || parseFloat(formData.basic_salary) < 0) {
      Alert.alert("Ø®Ø·Ø£", "Ø§Ù„Ø±Ø§ØªØ¨ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù…Ø§Ù‹ Ù…ÙˆØ¬Ø¨Ø§Ù‹");
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
        Alert.alert("Ø®Ø·Ø£", "Ù„Ù… Ù†ØªÙ…ÙƒÙ† Ù…Ù† Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø´Ø±ÙƒØªÙƒ");
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

      Alert.alert("Ù†Ø¬Ø§Ø­", result.message, [
        {
          text: "Ø­Ø³Ù†Ø§Ù‹",
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
      Alert.alert("Ø®Ø·Ø£", error.message || "ÙØ´Ù„ ÙÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…ÙˆØ¸Ù");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <DashboardMenu navigation={navigation} currentScreen="AddEmployee" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.centeredWrapper}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Ø¥Ø¶Ø§ÙØ© Ù…ÙˆØ¸Ù Ø¬Ø¯ÙŠØ¯</Text>
              <Text style={styles.subtitle}>Ù…Ù„Ø¡ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ø§Ø³Ù… Ø§Ù„Ù…ÙˆØ¸Ù *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…ÙˆØ¸Ù Ø§Ù„ÙƒØ§Ù…Ù„"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange("name", value)}
                  editable={!loading}
                />
              </View>

              {/* Email Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ"
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
                <Text style={styles.label}>Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange("phone", value)}
                  editable={!loading}
                />
              </View>

              {/* Department Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ø§Ù„Ù‚Ø³Ù… *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                  disabled={loading}
                >
                  <Text style={[styles.dropdownButtonText, !formData.department && styles.placeholderText]}>
                    {formData.department || "Ø§Ø®ØªØ± Ø§Ù„Ù‚Ø³Ù…"}
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
                <Text style={styles.label}>ÙˆÙ‚Øª Ø¨Ø¯Ø¡ Ø§Ù„Ø¯ÙˆØ§Ù… (HH:mm)</Text>
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
                <Text style={styles.label}>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± (6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„)"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  editable={!loading}
                />
              </View>

              {/* Confirm Password Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø±Ø© Ø£Ø®Ø±Ù‰"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange("confirmPassword", value)}
                  editable={!loading}
                />
              </View>

              {/* Role Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ø§Ù„Ø¯ÙˆØ± *</Text>
                <View style={styles.roleButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.roleButton, formData.role === "employee" && styles.roleButtonActive]}
                    onPress={() => handleInputChange("role", "employee")}
                    disabled={loading}
                  >
                    <Text style={[styles.roleButtonText, formData.role === "employee" && styles.roleButtonTextActive]}>Ù…ÙˆØ¸Ù</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleButton, formData.role === "admin" && styles.roleButtonActive]}
                    onPress={() => handleInputChange("role", "admin")}
                    disabled={loading}
                  >
                    <Text style={[styles.roleButtonText, formData.role === "admin" && styles.roleButtonTextActive]}>Ù…Ø³Ø¤ÙˆÙ„</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Basic Salary Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ø§Ù„Ø±Ø§ØªØ¨ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ (EGP) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ø£Ø¯Ø®Ù„ Ø§Ù„Ø±Ø§ØªØ¨ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ"
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
                {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…ÙˆØ¸Ù</Text>}
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
    borderColor: "#e0e0e0",
    borderRadius: 8,
    borderStyle: "solid",
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
    borderColor: "#e0e0e0",
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
    borderColor: "#e0e0e0",
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
    borderColor: "#e0e0e0",
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
});

export default AddEmployee;

