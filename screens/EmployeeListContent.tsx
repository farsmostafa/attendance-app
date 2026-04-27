import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RootStackNavigationProp } from "../types";
import { Department, fetchCompanyEmployees, fetchDepartments } from "../services/adminService";

interface Props {
  navigation?: RootStackNavigationProp;
  companyId: string;
}

type EmployeeStatus = "active" | "inactive";

interface EmployeeCardItem {
  id: string;
  name: string;
  role: "admin" | "employee";
  email: string;
  department: string;
  status: EmployeeStatus;
  avatar: string;
}

const ALL_DEPARTMENTS = "\u062c\u0645\u064a\u0639 \u0627\u0644\u0623\u0642\u0633\u0627\u0645";

const getRoleLabel = (role: "admin" | "employee") => {
  return role === "admin" ? "\u0645\u062f\u064a\u0631 \u0646\u0638\u0627\u0645" : "\u0645\u0648\u0638\u0641";
};

const FLAT_ITEM_INTERACTIVE_CLASS =
  "bg-[#2a2b38] border border-[#ffeba7]/10 rounded-[12px] hover:bg-[#2c2a25] active:bg-[#2c2a25] hover:border-[#ffeba7]/30 active:border-[#ffeba7]/30 transition-colors duration-200";

const EmployeeListContent: React.FC<Props> = ({ companyId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(ALL_DEPARTMENTS);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [employees, setEmployees] = useState<EmployeeCardItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await fetchCompanyEmployees(companyId);
        const mapped: EmployeeCardItem[] = data.map((emp) => ({
          id: emp.id,
          name: emp.name || "\u0628\u062f\u0648\u0646 \u0627\u0633\u0645",
          role: emp.role === "admin" ? "admin" : "employee",
          email: emp.email || "",
          department: emp.department || "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f",
          status: emp.status === "inactive" ? "inactive" : "active",
          avatar: "https://images.unsplash.com/photo-1594824388122-649cf0d5fbe4?w=300&q=80",
        }));
        setEmployees(mapped);

        try {
          const departmentsData = await fetchDepartments(companyId);
          setDepartments(departmentsData);
        } catch (departmentsError: any) {
          setDepartments([]);
          setError(departmentsError.message || "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062c\u0644\u0628 \u0627\u0644\u0623\u0642\u0633\u0627\u0645");
        }
      } catch (err: any) {
        setError(err.message || "\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062c\u0644\u0628 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a");
      } finally {
        setIsLoading(false);
      }
    };

    if (companyId) {
      loadEmployees();
    }
  }, [companyId]);

  const departmentOptions = useMemo(() => {
    return [ALL_DEPARTMENTS, ...departments.map((department) => department.name)];
  }, [departments]);

  useEffect(() => {
    if (!departmentOptions.includes(departmentFilter)) {
      setDepartmentFilter(ALL_DEPARTMENTS);
    }
  }, [departmentFilter, departmentOptions]);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [departmentFilter]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === ALL_DEPARTMENTS || employee.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchTerm, departmentFilter]);

  return (
    <ScrollView
      className="flex-1 bg-[#1f2029]"
      contentContainerClassName="px-6 pt-12 lg:pt-0 pb-12 gap-6"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-col md:flex-row-reverse justify-between items-start md:items-end gap-4">
        <View className="items-end">
          <Text className="text-[32px] font-bold text-[#ffeba7] text-right">{"\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646"}</Text>
          <Text className="text-base text-[#969081] mt-1 text-right">{"\u0639\u0631\u0636 \u0648\u0625\u062f\u0627\u0631\u0629 \u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646"}</Text>
        </View>
        <Pressable className="bg-[#ffeba7] px-6 py-3 rounded-[12px] flex-row-reverse items-center gap-2 self-start">
          <MaterialIcons name="add" size={20} color="#1f2029" />
          <Text className="text-[#102770] font-semibold text-sm text-right">{"\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0638\u0641"}</Text>
        </Pressable>
      </View>

      <View
        className="bg-[#2a2b38] p-4 rounded-[12px] border border-[#ffeba7]/10 flex-col md:flex-row-reverse gap-4 items-center justify-between z-50"
        style={{ elevation: 10 }}
      >
        <View className="flex-col md:flex-row-reverse gap-4 w-full md:w-auto flex-1">
          <View className="relative w-full md:w-96">
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder={"\u0627\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0628\u0631\u064a\u062f..."}
              placeholderTextColor="#969081"
              className="w-full bg-[#1f2029] border border-[#3e3f4b] rounded-[12px] py-3 pr-10 pl-4 text-[#e7e2da] text-right"
            />
            <View className="absolute right-3 top-3">
              <Ionicons name="search" size={20} color="#969081" />
            </View>
          </View>

          <View className="w-full md:w-64">
            <View className="relative z-50" style={{ zIndex: 50, elevation: 10 }}>
              <Pressable
                onPress={() => setIsDropdownOpen((prev) => !prev)}
                className="w-full bg-[#1f2029] border border-[#3e3f4b] rounded-[12px] py-3 px-4 flex-row-reverse items-center justify-between"
              >
                <Text className="text-[#e7e2da] text-right" numberOfLines={1}>{departmentFilter}</Text>
                <MaterialIcons name={isDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#969081" />
              </Pressable>

              {isDropdownOpen && (
                <View
                  className="absolute top-full mt-2 w-full bg-[#2a2b38] brutalist-border rounded-custom overflow-hidden z-50"
                  style={{ zIndex: 50, elevation: 10, maxHeight: 192 }}
                >
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {departmentOptions.map((option) => {
                      const isActive = option === departmentFilter;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => {
                            setDepartmentFilter(option);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-4 py-3 border-b border-[#ffeba7]/10 last:border-b-0 hover:bg-[#37352f] active:bg-[#37352f] transition-colors ${
                            isActive ? "bg-[#37352f]" : "bg-transparent"
                          }`}
                        >
                          <Text className={`text-right ${isActive ? "text-[#ffeba7]" : "text-[#e7e2da]"}`} numberOfLines={1}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row-reverse items-center gap-3 w-full md:w-auto justify-end">
          <Text className="text-[#e7e2da] text-sm font-semibold">{"\u0639\u0631\u0636:"}</Text>
          <View className="flex-row-reverse bg-[#1f2029] rounded-[12px] border border-[#3e3f4b] p-1 gap-1">
            <Pressable
              onPress={() => setViewMode("list")}
              className={`p-2 rounded-[8px] hover:bg-[#37352f] transition-colors ${viewMode === "list" ? "bg-[#37352f]" : "bg-transparent"}`}
            >
              <MaterialIcons name="list" size={20} color={viewMode === "list" ? "#ffeba7" : "#969081"} />
            </Pressable>
            <Pressable
              onPress={() => setViewMode("grid")}
              className={`p-2 rounded-[8px] hover:bg-[#37352f] transition-colors ${viewMode === "grid" ? "bg-[#37352f]" : "bg-transparent"}`}
            >
              <MaterialIcons name="grid-view" size={20} color={viewMode === "grid" ? "#ffeba7" : "#969081"} />
            </Pressable>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center py-20 mt-10">
          <ActivityIndicator size="large" color="#ffeba7" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center py-20 mt-10">
          <Text className="text-red-400 text-lg font-bold">{error}</Text>
        </View>
      ) : filteredEmployees.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20 mt-10">
          <Text className="text-[#969081] text-lg font-bold">{"\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0648\u0638\u0641\u064a\u0646 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645 \u062d\u0627\u0644\u064a\u0627\u064b"}</Text>
        </View>
      ) : viewMode === "list" ? (
        <View className="flex-col gap-2">
          <View className="hidden md:flex flex-row-reverse items-center gap-3 px-4 py-2">
            <Text className="flex-[2] text-[#969081] text-[11px] font-semibold text-right">{"\u0627\u0644\u0645\u0648\u0638\u0641"}</Text>
            <Text className="flex-[1.5] text-[#969081] text-[11px] font-semibold text-right">{"\u0627\u0644\u0642\u0633\u0645"}</Text>
            <Text className="flex-[2] text-[#969081] text-[11px] font-semibold text-right">{"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"}</Text>
            <Text className="flex-1 text-[#969081] text-[11px] font-semibold text-center">{"\u0627\u0644\u062d\u0627\u0644\u0629"}</Text>
            <Text className="flex-[1.5] text-[#969081] text-[11px] font-semibold text-left">{"\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a"}</Text>
          </View>

          {filteredEmployees.map((employee) => {
            const isActive = employee.status === "active";
            return (
              <Pressable
                key={employee.id}
                className={`${FLAT_ITEM_INTERACTIVE_CLASS} p-3 md:px-4 flex-col md:flex-row-reverse items-start md:items-center gap-3 md:gap-3 ${
                  !isActive ? "opacity-70" : ""
                }`}
              >
                <View className="w-full md:flex-[2] min-w-0 flex-row-reverse items-center gap-3">
                  <View
                    className={`w-10 h-10 rounded-[12px] overflow-hidden border border-[#ffeba7]/20 bg-[#37352f] ${
                      !isActive ? "grayscale" : ""
                    }`}
                  >
                    <Image source={{ uri: employee.avatar }} className="w-full h-full" resizeMode="cover" />
                  </View>
                  <View className="flex-col items-end flex-1 min-w-0">
                    <Text className="text-[#e7e2da] font-bold text-sm text-right" numberOfLines={1}>{employee.name}</Text>
                    <Text className="text-[#969081] text-xs text-right mt-0.5">{getRoleLabel(employee.role)}</Text>
                  </View>
                </View>

                <View className="w-full md:flex-[1.5] min-w-0">
                  <Text className="text-[#e7e2da] text-sm text-right flex-shrink" numberOfLines={1}>{employee.department}</Text>
                </View>

                <View className="w-full md:flex-[2] min-w-0">
                  <Text className="text-[#969081] text-sm text-right flex-shrink" numberOfLines={1}>{employee.email}</Text>
                </View>

                <View className="w-full md:flex-1 md:items-center">
                  <View className="px-2 py-0.5 border border-[#3e3f4b] rounded-[4px] bg-[#1f2029] self-end md:self-auto">
                    <Text className={`text-[10px] font-bold ${isActive ? "text-[#ffeba7]" : "text-[#ffb4ab]"}`}>
                      {isActive ? "\u0646\u0634\u0637" : "\u063a\u064a\u0631 \u0646\u0634\u0637"}
                    </Text>
                  </View>
                </View>

                <View className="w-full md:flex-[1.5] flex-row-reverse md:flex-row gap-2 justify-end md:justify-start">
                  <Pressable className="border border-[#3e3f4b] py-2 px-3 rounded-[12px] flex-row-reverse items-center gap-1.5 bg-transparent hover:bg-[#1f2029] active:bg-[#1f2029] hover:border-[#ffeba7]/50 transition-colors">
                    <Ionicons name="eye-outline" size={16} color="#e7e2da" />
                    <Text className="text-[#e7e2da] text-xs font-semibold">{"\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644"}</Text>
                  </Pressable>
                  <Pressable className="px-2.5 py-2 border border-[#3e3f4b] rounded-[12px] items-center justify-center bg-transparent hover:bg-[#1f2029] active:bg-[#1f2029] hover:border-[#ffeba7]/50 transition-colors">
                    <Ionicons name="settings" size={18} color="#e7e2da" />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View className="flex-row-reverse flex-wrap gap-6 w-full justify-start">
          {filteredEmployees.map((employee) => {
            const isActive = employee.status === "active";
            return (
              <Pressable
                key={employee.id}
                className={`w-full sm:w-[48%] lg:w-[31%] xl:w-[23%] ${FLAT_ITEM_INTERACTIVE_CLASS} p-5 flex-col gap-4 relative ${
                  !isActive ? "opacity-70" : ""
                }`}
              >
                <View className="absolute top-4 left-4 z-10">
                  <View className="px-2 py-1 border border-[#3e3f4b] rounded-[4px] bg-[#1f2029]">
                    <Text className={`text-[12px] ${isActive ? "text-[#ffeba7]" : "text-[#ffb4ab]"}`}>
                      {isActive ? "\u0646\u0634\u0637" : "\u063a\u064a\u0631 \u0646\u0634\u0637"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row-reverse items-center gap-4 justify-end mt-2">
                  <View
                    className={`w-16 h-16 rounded-[12px] overflow-hidden border border-[#ffeba7]/20 bg-[#37352f] items-center justify-center ${
                      !isActive ? "grayscale" : ""
                    }`}
                  >
                    <Image source={{ uri: employee.avatar }} className="w-full h-full" resizeMode="cover" />
                  </View>
                  <View className="flex-col items-end flex-1">
                    <Text className="text-[18px] font-bold text-[#e7e2da] text-right" numberOfLines={1}>{employee.name}</Text>
                    <Text className="text-sm text-[#969081] text-right w-full mt-1">{getRoleLabel(employee.role)}</Text>
                  </View>
                </View>

                <View className="flex-col gap-3 mt-2 border-t border-[#ffeba7]/10 pt-4">
                  <View className="flex-row-reverse items-center gap-3 justify-start">
                    <MaterialIcons name="mail" size={18} color="#969081" />
                    <Text className="text-sm text-[#969081] text-right flex-1" numberOfLines={1}>{employee.email}</Text>
                  </View>
                  <View className="flex-row-reverse items-center gap-3 justify-start">
                    <MaterialIcons name="apartment" size={18} color="#969081" />
                    <Text className="text-sm text-[#969081] text-right">{employee.department}</Text>
                  </View>
                </View>

                <View className="flex-row-reverse gap-3 mt-auto pt-4 border-t border-[#ffeba7]/10">
                  <Pressable className="flex-1 bg-transparent border border-[#3e3f4b] py-2.5 rounded-[12px] flex-row-reverse items-center justify-center gap-2 hover:bg-[#1f2029] active:bg-[#1f2029] hover:border-[#ffeba7]/50 transition-colors">
                    <Ionicons name="eye-outline" size={16} color="#e7e2da" />
                    <Text className="text-[#e7e2da] text-sm font-semibold">{"\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644"}</Text>
                  </Pressable>
                  <Pressable className="px-4 py-2.5 bg-transparent border border-[#3e3f4b] rounded-[12px] items-center justify-center hover:bg-[#1f2029] active:bg-[#1f2029] hover:border-[#ffeba7]/50 transition-colors">
                    <Ionicons name="settings" size={18} color="#e7e2da" />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

    </ScrollView>
  );
};

export default EmployeeListContent;
