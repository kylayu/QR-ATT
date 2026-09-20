import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { signOut, useAuth } from '@/lib/auth';
import {
  getProfile,
  updateProfile,
  type Profile,
} from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

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

    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            full_name: draftName.trim(),
          }
        : prev
    );

    setEditing(false);
  };

  const handleSignOut = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const { error } = await signOut();

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      router.replace('/login');
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        'Error',
        err?.message || 'Failed to sign out.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      <View style={styles.profileCard}>
        {profile?.role === 'teacher' ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Teacher</Text>
          </View>
        ) : (
          <View
            style={[
              styles.roleBadge,
              styles.roleBadgeStudent,
            ]}
          >
            <Text style={styles.roleBadgeText}>Student</Text>
          </View>
        )}

        <Text style={styles.label}>Name</Text>

        {editing ? (
          <View style={styles.nameEditRow}>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.nameInput}
              autoFocus
              editable={!saving}
            />

            <Pressable
              onPress={handleSaveName}
              disabled={saving}
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            style={styles.nameRow}
          >
            <Text style={styles.value}>
              {profile?.full_name || 'Tap to add your name'}
            </Text>

            <Text style={styles.editHint}>Edit</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Email</Text>
        <Text>
        {user?.email ?? profile?.email ?? 'No email found'}
       </Text>

        <Text style={styles.label}>User ID</Text>
        <Text style={styles.valueSmall}>
          {profile?.id ?? user?.id ?? ''}
        </Text>
      </View>

      <AppButton
        title="Sign Out"
        icon="log-out-outline"
        onPress={handleSignOut}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 16 },
  profileCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 18, marginBottom: 24 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginBottom: 18},
  roleBadgeStudent: { backgroundColor: COLORS.textSecondary },
  roleBadgeText: { color: COLORS.textOnPrimary, fontSize: 13, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 5, marginTop: 10 },
  value: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  valueSmall: { fontSize: 11, color: COLORS.textSecondary },
  nameRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  editHint: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginLeft: 12 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  nameInput: { flex: 1, borderWidth: 1, borderColor: COLORS.textSecondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.background },
  saveButton: { marginLeft: 10, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: COLORS.primary },
  disabledButton: { opacity: 0.5 },
  saveButtonText: { color: COLORS.textOnPrimary, fontSize: 14, fontWeight: '700' },
});