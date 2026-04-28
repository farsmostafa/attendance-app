import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RootStackNavigationProp } from "../types";
import { addEmployee, fetchDepartments } from "../services/adminService";
import { pickAndUploadImage } from "../services/uploadService";
import { getCurrentUserData } from "../services/authService";

interface Props {
  navigation?: RootStackNavigationProp;
  companyId: string;
}

type EmployeeRole = "employee" | "admin";

const S = {
  headerTitle: "\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641 \u062c\u062f\u064a\u062f",
  headerSubtitle:
    "\u0642\u0645 \u0628\u062a\u0639\u0628\u0626\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u0644\u0625\u0646\u0634\u0627\u0621 \u0645\u0644\u0641 \u062a\u0639\u0631\u064a\u0641 \u0627\u0644\u0645\u0648\u0638\u0641",
  sectionAccount: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628",
  sectionPersonal: "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629",
  sectionWork: "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0645\u0644",
  sectionSchedule: "\u062c\u062f\u0648\u0644 \u0627\u0644\u062f\u0648\u0627\u0645",
  email: "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a",
  password: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
  name: "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644",
  phone: "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641",
  department: "\u0627\u0644\u0642\u0633\u0645",
  role: "\u0627\u0644\u062f\u0648\u0631 \u0627\u0644\u0648\u0638\u064a\u0641\u064a",
  salary: "\u0627\u0644\u0631\u0627\u062a\u0628 \u0627\u0644\u0623\u0633\u0627\u0633\u064a",
  checkIn: "\u0648\u0642\u062a \u0627\u0644\u062d\u0636\u0648\u0631",
  checkOut: "\u0648\u0642\u062a \u0627\u0644\u0627\u0646\u0635\u0631\u0627\u0641",
  employee: "\u0645\u0648\u0638\u0641",
  admin: "\u0645\u062f\u064a\u0631",
  upload: "\u0631\u0641\u0639 \u0635\u0648\u0631\u0629",
  cancel: "\u0625\u0644\u063a\u0627\u0621",
  save: "\u062d\u0641\u0638 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a",
  setupHint:
    "\u0633\u064a\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u062f\u0639\u0648\u0629 \u0644\u0644\u0645\u0648\u0638\u0641 \u0644\u0625\u0643\u0645\u0627\u0644 \u0625\u0639\u062f\u0627\u062f \u062d\u0633\u0627\u0628\u0647 \u0641\u0648\u0631 \u062d\u0641\u0638 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a.",
  systemHint: "\u0646\u0638\u0627\u0645 \u0627\u0644\u062f\u0648\u0627\u0645: 8 \u0633\u0627\u0639\u0627\u062a / \u064a\u0648\u0645",
  loadDepartments: "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0623\u0642\u0633\u0627\u0645...",
  noDepartments: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0642\u0633\u0627\u0645",
  saveError: "\u0641\u0634\u0644 \u062d\u0641\u0638 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0648\u0638\u0641",
};

type FormError = {
  message: string;
  type: "error" | "warning";
};

const AddEmployeeContent: React.FC<Props> = ({ navigation, companyId }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<EmployeeRole>("employee");
  const [salary, setSalary] = useState("");
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showDepartments, setShowDepartments] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const data = await fetchDepartments(companyId);
        const names = data.map((item) => item.name).filter(Boolean);
        setDepartments(names);
        if (names.length > 0) {
          setDepartment((prev) => prev || names[0]);
        }
      } catch (fetchError) {
        console.error("Error loading departments:", fetchError);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [companyId]);

  const handleUploadAvatar = async () => {
    setIsUploading(true);
    try {
      const url = await pickAndUploadImage();
      if (url) {
        setAvatarUrl(url);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (isSaving || loading) return;
    if (!email.trim() || !password.trim() || !name.trim() || !phone.trim() || !salary.trim()) {
      setError({ message: "يرجى تعبئة جميع الحقول المطلوبة", type: "error" });
      return;
    }
    if (!department.trim()) {
      setError({ message: "يرجى اختيار القسم", type: "error" });
      return;
    }

    setError(null);
    setIsSaving(true);
    setLoading(true);
    try {
      const userData = await getCurrentUserData();
      const actualCompanyId = userData?.companyId || userData?.company_id;
      if (!actualCompanyId) {
        setError({ message: "لم نتمكن من العثور على شركتك", type: "error" });
        return;
      }

      await addEmployee(actualCompanyId, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        department: department.trim(),
        role,
        basicSalary: salary.trim() ? Number(salary) : 0,
        checkInTime,
        checkOutTime,
        avatarUrl,
      });
      navigation?.goBack();
    } catch (submitError: any) {
      const rawError = submitError?.code || submitError?.message || S.saveError;
      const isWarning = String(rawError).includes("EMAIL_EXISTS") || String(rawError).includes("already exists");
      let mappedMessage = String(rawError);
      if (String(rawError).includes("EMAIL_EXISTS")) {
        mappedMessage = "البريد الإلكتروني مسجل مسبقاً";
      } else if (String(rawError).includes("INVALID_EMAIL")) {
        mappedMessage = "البريد الإلكتروني غير صحيح";
      } else if (String(rawError).includes("WEAK_PASSWORD")) {
        mappedMessage = "كلمة المرور ضعيفة (6 أحرف على الأقل)";
      }
      setError({
        message: mappedMessage,
        type: isWarning ? "warning" : "error",
      });
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#1f2029]">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <View className="bg-[#2a2b38] w-full max-w-5xl self-center rounded-xl border border-[#ffeba7]/10 flex-1">
            <View className="px-5 py-4 border-b border-[#ffeba7]/10 flex-row-reverse items-center justify-between bg-[#2a2b38]">
              <View className="flex-row-reverse items-center gap-4">
                <View className="w-10 h-10 bg-[#1f2029] rounded-lg border border-[#ffeba7]/10 items-center justify-center">
                  <Ionicons name="person-add" size={20} color="#ffeba7" />
                </View>
                <View className="items-end">
                  <Text className="text-[#ffeba7] text-xl font-semibold text-right">{S.headerTitle}</Text>
                  <Text className="text-[#969081] text-xs text-right mt-1">{S.headerSubtitle}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => navigation?.goBack()}
                className="w-10 h-10 rounded-lg border border-[#ffeba7]/10 bg-[#1f2029] items-center justify-center hover:bg-[#2c2a25] active:bg-[#2c2a25] cursor-pointer"
              >
                <Ionicons name="close" size={20} color="#969081" />
              </Pressable>
            </View>

            <ScrollView className="flex-1" contentContainerClassName="p-5 gap-5" showsVerticalScrollIndicator={false}>
              {error ? (
                <View
                  className={`px-4 py-3 rounded-lg flex-row-reverse items-center gap-3 ${error.type === "warning" ? "bg-yellow-500/10 border border-yellow-400/40" : "bg-red-500/10 border border-red-400/40"}`}
                >
                  <Ionicons
                    name={error.type === "warning" ? "warning-outline" : "alert-circle-outline"}
                    size={18}
                    color={error.type === "warning" ? "#facc15" : "#fca5a5"}
                  />
                  <Text className={`text-right text-sm ${error.type === "warning" ? "text-yellow-300" : "text-red-300"}`}>
                    {error.message}
                  </Text>
                </View>
              ) : null}

              <View className="flex-col lg:flex-row-reverse gap-5">
                <View className="w-full lg:w-[34%] bg-[#1f2029] border border-[#ffeba7]/10 rounded-xl p-5">
                  <View className="flex-row-reverse items-center gap-3 mb-6">
                    <Ionicons name="lock-closed" size={20} color="#ffeba7" />
                    <Text className="text-[#ffeba7] text-xl font-semibold text-right">{S.sectionAccount}</Text>
                  </View>

                  <View className="gap-5">
                    <View className="gap-2">
                      <Text className="text-[#969081] text-sm text-right">{S.email}</Text>
                      <View className="w-full bg-[#2a2b38] border border-[#ffeba7]/10 rounded-lg px-3 py-3 flex-row-reverse items-center gap-2 hover:bg-[#2c2a25] focus-within:border-[#ffeba7]/50 transition-colors">
                        <Ionicons name="at" size={18} color="#969081" />
                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          placeholder="name@company.com"
                          placeholderTextColor="#969081"
                          className="flex-1 text-[#e7e2da] text-right  outline-none  bg-transparent"
                          style={{ outlineStyle: "none" } as any}
                        />
                      </View>
                    </View>

                    <View className="gap-2">
                      <Text className="text-[#969081] text-sm text-right">{S.password}</Text>

                      <View className="w-full bg-[#2a2b38] border border-[#ffeba7]/10 rounded-lg px-3 py-3 flex-row-reverse items-center gap-2 hover:bg-[#2c2a25] focus-within:border-[#ffeba7]/50 transition-colors">
                        <Ionicons name="key" size={18} color="#969081" />
                        <TextInput
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                          placeholder="********"
                          placeholderTextColor="#969081"
                          className="flex-1 text-[#e7e2da] text-right outline-none bg-transparent"
                        />
                      </View>
                    </View>
                  </View>

                  <View className="mt-8 pt-6 border-t border-[#ffeba7]/10">
                    <Text className="text-[#969081] text-xs leading-5 text-right">{S.setupHint}</Text>
                  </View>
                </View>

                <View className="w-full lg:flex-1 gap-5">
                  <View className="bg-[#1f2029] border border-[#ffeba7]/10 rounded-xl p-5">
                    <View className="flex-row-reverse items-center gap-3 mb-6">
                      <Ionicons name="person" size={20} color="#ffeba7" />
                      <Text className="text-[#ffeba7] text-xl font-semibold text-right">{S.sectionPersonal}</Text>
                    </View>

                    <View className="flex-col md:flex-row-reverse gap-6 items-center md:items-start">
                      <View className="items-center gap-4">
                        <View className="w-32 h-32 rounded-full bg-[#2a2b38] border border-[#ffeba7]/10 items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <Ionicons name="camera" size={36} color="#969081" />
                          )}
                        </View>
                        <Pressable
                          onPress={handleUploadAvatar}
                          disabled={isUploading}
                          className="bg-[#ffeba7] px-4 py-2 rounded-lg flex-row-reverse items-center gap-2 disabled:opacity-70 hover:bg-[#e4d295] active:bg-[#d4c285] transition-colors cursor-pointer"
                        >
                          {isUploading ? (
                            <ActivityIndicator size="small" color="#1f2029" />
                          ) : (
                            <Ionicons name="cloud-upload-outline" size={14} color="#1f2029" />
                          )}
                          <Text className="text-[#1f2029] font-bold text-sm">{S.upload}</Text>
                        </Pressable>
                      </View>

                      <View className="flex-1 w-full gap-4">
                        <View className="gap-2">
                          <Text className="text-[#969081] text-sm text-right">{S.name}</Text>
                          <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="..."
                            placeholderTextColor="#969081"
                            className="w-full bg-[#2a2b38] border border-[#ffeba7]/10 rounded-lg px-4 py-3 text-[#e7e2da] text-right focus:border-[#ffeba7] hover:bg-[#2c2a25] transition-colors outline-none focus:outline-none focus:ring-0 "
                            style={{ outlineStyle: "none" } as any}
                          />
                        </View>

                        <View className="gap-2">
                          <Text className="text-[#969081] text-sm text-right">{S.phone}</Text>
                          <View className="w-full bg-[#2a2b38] border border-[#ffeba7]/10 rounded-lg px-4 py-3 flex-row-reverse items-center gap-2 hover:bg-[#2c2a25] focus-within:border-[#ffeba7]/50 transition-colors">
                            <Ionicons name="call" size={18} color="#969081" />
                            <TextInput
                              value={phone}
                              onChangeText={setPhone}
                              keyboardType="phone-pad"
                              placeholder="+966 5X XXX XXXX"
                              placeholderTextColor="#969081"
                              textAlign="right"
                              className="flex-1 text-[#e7e2da] outline-none bg-transparent"
                              style={{ outlineStyle: "none" } as any}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View className="flex-col md:flex-row-reverse gap-5">
                    <View className="flex-1 bg-[#1f2029] border border-[#ffeba7]/10 rounded-xl p-5 gap-4">
                      <View className="flex-row-reverse items-center gap-3 mb-2">
                        <Ionicons name="briefcase" size={20} color="#ffeba7" />
                        <Text className="text-[#ffeba7] text-xl font-semibold text-right">{S.sectionWork}</Text>
                      </View>

                      <View className="gap-2" style={{ zIndex: 100, position: "relative" } as any}>
                        <Text className="text-[#969081] text-sm text-right">{S.department}</Text>
                        <View className="relative z-50 flex-1">
                          <Pressable
                            onPress={() => setShowDepartments((prev) => !prev)}
                            className="w-full bg-[#2a2b38] border border-[#ffeba7]/10 rounded-lg px-4 py-3 flex-row-reverse items-center justify-between hover:bg-[#2c2a25] active:bg-[#2c2a25] transition-colors cursor-pointer"
                          >
                            <Text className="text-[#e7e2da] text-right">
                              {department || (loadingDepartments ? S.loadDepartments : S.noDepartments)}
                            </Text>
                            <Ionicons name={showDepartments ? "chevron-up" : "chevron-down"} size={16} color="#969081" />
                          </Pressable>

                          {showDepartments && departments.length > 0 && (
                            <>
                              {/* Transparent overlay to close dropdown when clicking outside */}
                              <Pressable
                                style={[
                                  StyleSheet.absoluteFill,
                                  {
                                    position: "absolute",
                                    top: -5000,
                                    bottom: -5000,
                                    left: -5000,
                                    right: -5000,
                                    zIndex: 40,
                                    cursor: "pointer" as any,
                                  },
                                ]}
                                onPress={() => setShowDepartments(false)}
                              />
                              {/* The Dropdown Menu */}
                              <View
                                className="absolute top-[100%] mt-1 left-0 right-0 bg-[#2a2b38] border border-[#ffeba7]/20 rounded-lg z-50 overflow-hidden shadow-xl"
                                style={{ elevation: 15 }}
                              >
                                {departments.map((item) => (
                                  <Pressable
                                    key={item}
                                    onPress={() => {
                                      setDepartment(item);
                                      setShowDepartments(false);
                                    }}
                                    className="px-4 py-3 hover:bg-[#37352f] active:bg-[#37352f] border-b border-[#ffeba7]/10 last:border-b-0 transition-colors cursor-pointer"
                                  >
                                    <Text className={`text-right ${department === item ? "text-[#ffeba7]" : "text-[#e7e2da]"}`}>
                                      {item}
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            </>
                          )}
                        </View>
                      </View>

                      <View className="gap-2">
                        <Text className="text-[#969081] text-sm text-right">{S.role}</Text>
                        <View className="flex-row-reverse gap-2">
                          <Pressable
                            onPress={() => setRole("employee")}
                            className={`flex-1 rounded-lg border border-[#ffeba7]/10 p-3 transition-colors cursor-pointer ${role === "employee" ? "bg-[#ffeba7]" : "bg-[#2a2b38] hover:bg-[#2c2a25]"}`}
                          >
                            <Text className={`text-center font-semibold ${role === "employee" ? "text-[#1f2029]" : "text-[#969081]"}`}>
                              {S.employee}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setRole("admin")}
                            className={`flex-1 rounded-lg border border-[#ffeba7]/10 p-3 transition-colors cursor-pointer ${role === "admin" ? "bg-[#ffeba7]" : "bg-[#2a2b38] hover:bg-[#2c2a25]"}`}
                          >
                            <Text className={`text-center font-semibold ${role === "admin" ? "text-[#1f2029]" : "text-[#969081]"}`}>
                              {S.admin}
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      <View className="gap-2">
                        <Text className="text-[#969081] text-sm text-right">{S.salary}</Text>
                        <View className="w-full bg-[#2a2b38] border border-[#ffeba7]/10 rounded-lg px-4 py-3 flex-row items-center hover:bg-[#2c2a25] focus-within:border-[#ffeba7]/50 transition-colors">
                          <Text className="text-[#969081] text-xs">SAR</Text>
                          <TextInput
                            value={salary}
                            onChangeText={setSalary}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#969081"
                            className="flex-1 text-[#e7e2da] text-right outline-none  bg-transparent"
                            style={{ outlineStyle: "none" } as any}
                          />
                        </View>
                      </View>
                    </View>

                    <View className="flex-1 bg-[#1f2029] border border-[#ffeba7]/10 rounded-xl p-5 gap-5">
                      <View className="flex-row-reverse items-center gap-3 mb-2">
                        <Ionicons name="time" size={20} color="#ffeba7" />
                        <Text className="text-[#ffeba7] text-xl font-semibold text-right">{S.sectionSchedule}</Text>
                      </View>

                      {/* --- وقت الحضور --- */}
                      <View className="gap-2">
                        <Text className="text-[#969081] text-sm text-right">{S.checkIn}</Text>
                        <View className="w-full bg-[#2a2b38] border border-[#ffeba7]/10 rounded-lg px-4 py-3 flex-row-reverse items-center gap-2 hover:bg-[#2c2a25] focus-within:border-[#ffeba7]/50 transition-colors">
                          {/* إخفاء الأيقونة في الويب لمنع التكرار مع أيقونة المتصفح */}
                          {Platform.OS !== "web" && <Ionicons name="time-outline" size={16} color="#969081" />}

                          {Platform.OS === "web" ? (
                            <input
                              type="time"
                              value={checkInTime}
                              onChange={(e: any) => setCheckInTime(e.target.value)}
                              style={{
                                flex: 1,
                                backgroundColor: "transparent",
                                color: "#e7e2da",
                                outline: "none",
                                border: "none",
                                textAlign: "right",
                                colorScheme: "dark",
                                cursor: "pointer",
                              }}
                            />
                          ) : (
                            <TextInput
                              value={checkInTime}
                              onChangeText={setCheckInTime}
                              placeholder="09:00"
                              placeholderTextColor="#969081"
                              className="flex-1 text-[#e7e2da] text-right outline-none bg-transparent"
                            />
                          )}
                        </View>
                      </View>

                      {/* --- وقت الانصراف --- */}
                      <View className="gap-2">
                        <Text className="text-[#969081] text-sm text-right">{S.checkOut}</Text>
                        <View className="w-full bg-[#2a2b38] border border-[#ffeba7]/10 rounded-lg px-4 py-3 flex-row-reverse items-center gap-2 hover:bg-[#2c2a25] focus-within:border-[#ffeba7]/50 transition-colors">
                          {/* إخفاء الأيقونة في الويب لمنع التكرار مع أيقونة المتصفح */}
                          {Platform.OS !== "web" && <Ionicons name="time-outline" size={16} color="#969081" />}

                          {Platform.OS === "web" ? (
                            <input
                              type="time"
                              value={checkOutTime}
                              onChange={(e: any) => setCheckOutTime(e.target.value)}
                              style={{
                                flex: 1,
                                backgroundColor: "transparent",
                                color: "#e7e2da",
                                outline: "none",
                                border: "none",
                                textAlign: "right",
                                colorScheme: "dark",
                                cursor: "pointer",
                              }}
                            />
                          ) : (
                            <TextInput
                              value={checkOutTime}
                              onChangeText={setCheckOutTime}
                              placeholder="17:00"
                              placeholderTextColor="#969081"
                              className="flex-1 text-[#e7e2da] text-right outline-none bg-transparent"
                            />
                          )}
                        </View>
                      </View>

                      <View className="pt-2 flex-row-reverse items-center gap-2">
                        <Ionicons name="information-circle-outline" size={14} color="#969081" />
                        <Text className="text-[#969081] text-xs text-right">{S.systemHint}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="px-5 py-4 border-t border-[#ffeba7]/10 bg-[#2a2b38] flex-row-reverse items-center justify-end gap-3">
              <Pressable
                onPress={() => navigation?.goBack()}
                className="px-7 py-3 rounded-lg border border-[#ffeba7]/10 bg-[#1f2029] hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer"
              >
                <Text className="text-[#e7e2da] text-sm font-semibold">{S.cancel}</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={isSaving || loading}
                className="px-8 py-3 rounded-lg bg-[#ffeba7] flex-row-reverse items-center gap-2 disabled:opacity-70 hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer"
              >
                {isSaving ? <ActivityIndicator size="small" color="#1f2029" /> : <MaterialIcons name="save" size={18} color="#1f2029" />}
                <Text className="text-[#1f2029] text-sm font-bold">{S.save}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AddEmployeeContent;
