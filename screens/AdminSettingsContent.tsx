import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackNavigationProp } from "../types";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface Props {
  navigation?: RootStackNavigationProp;
  companyId: string;
}

const AdminSettingsContent: React.FC<Props> = ({ companyId }) => {
  const [settings, setSettings] = useState({
    latitude: "",
    longitude: "",
    workStartTime: "09:00",
    workEndTime: "17:00",
    gracePeriodMinutes: "15",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const companyDoc = await getDoc(doc(db, "companies", "MainCompany"));
        if (companyDoc.exists()) {
          const data = companyDoc.data();
          setSettings({
            latitude: data.latitude?.toString() || "",
            longitude: data.longitude?.toString() || "",
            workStartTime: data.workStartTime || "09:00",
            workEndTime: data.workEndTime || "17:00",
            gracePeriodMinutes: data.gracePeriodMinutes?.toString() || "15",
          });
        }
      } catch (error: any) {
        setErrorMessage(error.message || "فشل في تحميل الإعدادات");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const latitudeValue = parseFloat(settings.latitude);
    const longitudeValue = parseFloat(settings.longitude);
    const graceValue = parseInt(settings.gracePeriodMinutes, 10);

    if (isNaN(latitudeValue) || isNaN(longitudeValue)) {
      setErrorMessage("يرجى إدخال خطوط عرض وطول صحيحة");
      return;
    }

    if (!settings.workStartTime.trim() || !settings.workEndTime.trim()) {
      setErrorMessage("يرجى إدخال وقت بدء ونهاية العمل");
      return;
    }

    if (isNaN(graceValue) || graceValue < 0) {
      setErrorMessage("يرجى إدخال مدة سماح صحيحة بالدقائق");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "companies", "MainCompany"),
        {
          latitude: latitudeValue,
          longitude: longitudeValue,
          workStartTime: settings.workStartTime,
          workEndTime: settings.workEndTime,
          gracePeriodMinutes: graceValue,
        },
        { merge: true },
      );
      setSuccessMessage("تم حفظ الإعدادات بنجاح");
    } catch (error: any) {
      setErrorMessage(error.message || "فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>إعدادات الشركة</Text>
      <Text style={styles.subtitle}>تحكم في إعدادات الشركة العامة</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <View style={styles.card}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={settings.latitude}
              onChangeText={(value) => setSettings((prev) => ({ ...prev, latitude: value }))}
              placeholder="مثال: 30.0444"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={settings.longitude}
              onChangeText={(value) => setSettings((prev) => ({ ...prev, longitude: value }))}
              placeholder="مثال: 31.2357"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Work Start Time</Text>
            <TextInput
              style={styles.input}
              value={settings.workStartTime}
              onChangeText={(value) => setSettings((prev) => ({ ...prev, workStartTime: value }))}
              placeholder="مثال: 09:00"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Work End Time</Text>
            <TextInput
              style={styles.input}
              value={settings.workEndTime}
              onChangeText={(value) => setSettings((prev) => ({ ...prev, workEndTime: value }))}
              placeholder="مثال: 17:00"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Grace Period (Minutes)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={settings.gracePeriodMinutes}
              onChangeText={(value) => setSettings((prev) => ({ ...prev, gracePeriodMinutes: value }))}
              placeholder="مثال: 15"
              placeholderTextColor="#888"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>حفظ الإعدادات</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "right",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    textAlign: "right",
    fontWeight: "600",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    fontSize: 14,
    color: "#111827",
  },
  errorBox: {
    backgroundColor: "#fdecea",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f5c2c7",
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: "#b02a37",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "right",
  },
  successBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    padding: 14,
    marginBottom: 16,
  },
  successText: {
    color: "#065f46",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "right",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default AdminSettingsContent;
