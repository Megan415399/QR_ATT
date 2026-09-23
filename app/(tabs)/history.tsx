import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';
import { getProfile, type Role } from '@/lib/profiles';

function shortId(id: string) {
  return id ? `…${id.slice(-8)}` : 'unknown';
}

function formatTime(iso: string) {
  return iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    : '';
}

function formatDate(iso: string) {
  return iso ? new Date(iso).toLocaleString() : '';
}

export default function HistoryScreen() {
  const { user } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const profile = await getProfile(user.id);
    const currentRole = profile?.role ?? 'student';

    setRole(currentRole);

    if (currentRole === 'teacher') {
      const events = await getTeacherEventAttendance(user.id);

      setTeacherEvents(events);
      setStudentRecords([]);
    } else {
      const records = await getAttendanceHistory(user.id);

      setStudentRecords(records);
      setTeacherEvents([]);
    }

    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (role === 'teacher') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Teacher Attendance Register</Text>

        {loading ? (
          <Text style={styles.subtitle}>Loading records...</Text>
        ) : teacherEvents.length === 0 ? (
          <Text style={styles.subtitle}>
            No events or attendance records found.
          </Text>
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                </View>

                <Text style={styles.eventMeta}>
                  Code: {item.eventCode}
                </Text>

                <Text style={styles.attendeeHeading}>
                  Attendees ({item.attendeeCount})
                </Text>

                {item.attendees.map((att, idx) => (
                  <View key={idx} style={styles.attendeeRow}>
                    <Text style={styles.studentLabel}>Student</Text>

                    <Text style={styles.studentName}>
                      {att.studentName || shortId(att.studentId)}
                    </Text>

                    <Text style={styles.scannedText}>
                      Scanned: {formatTime(att.scannedAt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : studentRecords.length === 0 ? (
        <Text style={styles.subtitle}>
          No records yet. Scan a QR code to register your attendance.
        </Text>
      ) : (
        <FlatList
          data={studentRecords}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.eventTitle}</Text>

              <Text style={styles.eventMeta}>{item.eventId}</Text>

              <Text style={styles.eventMeta}>
                {formatDate(item.scannedAt)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'left',
    lineHeight: 21,
    marginTop: 32,
  },

  list: {
    paddingBottom: 24,
  },

  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },

  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  eventTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 10,
  },

  eventMeta: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  attendeeHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  attendeeRow: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },

  studentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  scannedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});