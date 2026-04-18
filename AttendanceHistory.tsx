import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getCurrentUserData } from "./services/authService";
import { RootStackParamList } from "./types";

type AttendanceHistoryProps = NativeStackScreenProps<RootStackParamList, "AttendanceHistory">;

interface DisplayRecord {
  id: string;
  date: string;
  type: string;
  time: string;
  timestamp: Timestamp;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ navigation }) => {
  const [records, setRecords] = useState<DisplayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      try {
        const userData = await getCurrentUserData();
        if (!userData || !userData.uid) {
          setLoading(false);
          return;
        }

        // Query all attendance records for current user, ordered by timestamp (most recent first)
        const q = query(collection(db, "attendance"), where("userId", "==", userData.uid), orderBy("timestamp", "desc"));

        const querySnapshot = await getDocs(q);

        // Transform Firestore documents into display format
        const displayRecords: DisplayRecord[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp);

          // Format date as DD/MM/YYYY
          const date = timestamp.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          // Format time as HH:MM
          const time = timestamp.toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
            second: undefined,
          });

          // Convert type to Arabic
          const typeLabel = data.type === "check-in" ? "حضور" : "انصراف";

          return {
            id: doc.id,
            date,
            type: typeLabel,
            time,
            timestamp,
          };
        });

        setRecords(displayRecords);
      } catch (err) {
        console.error("Error fetching attendance history:", err);
        Alert.alert("خطأ", "فشل في جلب السجل. يرجى المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceHistory();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>جاري تحميل السجل...</Text>
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>لا توجد سجلات حضور بعد.</Text>
      </View>
    );
  }

  const renderRecord = ({ item }: { item: DisplayRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordRow}>
        <View style={styles.recordColumn}>
          <Text style={styles.recordLabel}>التاريخ</Text>
          <Text style={styles.recordValue}>{item.date}</Text>
        </View>

        <View style={styles.recordColumn}>
          <Text style={styles.recordLabel}>الوقت</Text>
          <Text style={styles.recordValue}>{item.time}</Text>
        </View>

        <View style={[styles.recordColumn, styles.typeColumn]}>
          <Text style={styles.recordLabel}>النوع</Text>
          <View style={[styles.typeBadge, item.type === "حضور" ? styles.typeBadgeCheckIn : styles.typeBadgeCheckOut]}>
            <Text style={[styles.typeValue, item.type === "حضور" ? styles.typeValueCheckIn : styles.typeValueCheckOut]}>{item.type}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>سجل الحضور والانصراف</Text>

      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  listContainer: {
    paddingBottom: 20,
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordColumn: {
    flex: 1,
    alignItems: "center",
  },
  typeColumn: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  recordValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadgeCheckIn: {
    backgroundColor: "#d4edda",
  },
  typeBadgeCheckOut: {
    backgroundColor: "#fff3cd",
  },
  typeValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  typeValueCheckIn: {
    color: "#155724",
  },
  typeValueCheckOut: {
    color: "#856404",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 30,
  },
});

export default AttendanceHistory;
