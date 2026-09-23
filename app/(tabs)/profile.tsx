import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const p = await getProfile(user.id);
    setProfile(p);
    setDraftName(p?.full_name ?? '');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await updateProfile(user.id, { full_name: draftName.trim() });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error);
    } else {
      setProfile((prev) => (prev ? { ...prev, full_name: draftName.trim() } : prev));
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to sign out.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      {user && (
        <View style={styles.badgeWrapper}>
          {profile?.role === 'teacher' ? (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Teacher</Text>
            </View>
          ) : (
            <View style={[styles.roleBadge, styles.roleBadgeStudent]}>
              <Text style={styles.roleBadgeText}>Student</Text>
            </View>
          )}
        </View>
      )}

      {user && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Full Name</Text>
          {editing ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.input}
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Enter full name"
                placeholderTextColor={COLORS.textSecondary}
              />
              <Pressable onPress={handleSaveName} disabled={saving} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setEditing(true)} style={styles.nameRow}>
              <Text style={styles.value}>
                {profile?.full_name || 'Tap to add your name'}
              </Text>
              <Text style={styles.editHint}>Edit</Text>
            </Pressable>
          )}

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile?.email || user.email}</Text>

          <Text style={styles.label}>User ID</Text>
          <Text style={styles.valueSmall}>{user.id}</Text>
        </View>
      )}

      <AppButton
        title="Sign Out"
        icon="log-out-outline"
        onPress={handleSignOut}
        disabled={signingOut}
      />
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
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  badgeWrapper: {
    marginBottom: 16,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeStudent: {
    backgroundColor: '#4CAF50',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  value: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  valueSmall: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editHint: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});