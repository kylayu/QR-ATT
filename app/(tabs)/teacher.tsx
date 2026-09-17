import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { createEvent } from '@/lib/events';
import { getProfile, type Role } from '@/lib/profiles';
import { buildQRPayload } from '@/lib/qr';

export default function TeacherScreen() {
  const { user } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const [payload, setPayload] = useState<string | null>(null);
  const [createdEventTitle, setCreatedEventTitle] = useState('');
  const [createdEventId, setCreatedEventId] = useState('');

  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!user) {
        setRoleLoading(false);

        return () => {
          active = false;
        };
      }

      getProfile(user.id).then((profile) => {
        if (!active) return;

        setRole(profile?.role ?? 'student');
        setRoleLoading(false);
      });

      return () => {
        active = false;
      };
    }, [user])
  );

  const handleCreateEvent = async () => {
    if (!eventId.trim()) {
      Alert.alert(
        'Missing Event Code',
        'Please enter an event code.'
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert(
        'Missing Event Title',
        'Please enter an event title.'
      );
      return;
    }

    if (!start.trim()) {
      Alert.alert(
        'Missing Start Time',
        'Please enter the start time.'
      );
      return;
    }

    if (!end.trim()) {
      Alert.alert(
        'Missing End Time',
        'Please enter the end time.'
      );
      return;
    }

    setCreating(true);

    try {
      const eventData = {
        eventId: eventId.trim(),
        title: title.trim(),
        start: start.trim(),
        end: end.trim(),
      };

      const { error } = await createEvent(eventData);

    if (error) {
       Alert.alert(
       'Create Event Error',
       error
      );
      return;
    }

      const qrPayload = buildQRPayload(eventData);

      setPayload(qrPayload);
      setCreatedEventTitle(eventData.title);
      setCreatedEventId(eventData.eventId);

      setEventId('');
      setTitle('');
      setStart('');
      setEnd('');

      Alert.alert(
        'Success',
        'Event created successfully!'
      );
    } catch (error) {
      console.error('Create event error:', error);

      Alert.alert(
        'Create Event Error',
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating the event.'
      );
    } finally {
      setCreating(false);
    }
  };

  if (roleLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loadingIndicator}
        />

        <Text style={styles.loadingText}>
          Checking your account...
        </Text>
      </View>
    );
  }

  if (role !== 'teacher') {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.lockCircle}>
          <Ionicons
            name="lock-closed-outline"
            size={42}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.restrictedTitle}>
          Teachers Only
        </Text>

        <Text style={styles.restrictedText}>
          Only teacher accounts can create attendance events.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="school-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Teacher
            </Text>

            <Text style={styles.headerSubtitle}>
              Create an attendance event
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Create Event
          </Text>

          <Text style={styles.cardDescription}>
            Enter the details of your attendance event below.
          </Text>

          <Text style={styles.label}>
            Event Code
          </Text>

          <TextInput
            style={styles.input}
            value={eventId}
            onChangeText={setEventId}
            placeholder="EVT-2026-0002"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!creating}
          />

          <Text style={styles.label}>
            Event Title
          </Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter event title"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="sentences"
            editable={!creating}
          />

          <Text style={styles.label}>
            Start Time
          </Text>

          <TextInput
            style={styles.input}
            value={start}
            onChangeText={setStart}
            placeholder="2026-09-15T08:00:00"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!creating}
          />

          <Text style={styles.label}>
            End Time
          </Text>

          <TextInput
            style={styles.input}
            value={end}
            onChangeText={setEnd}
            placeholder="2026-09-15T10:00:00"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!creating}
          />

          <TouchableOpacity
            style={[
              styles.createButton,
              creating && styles.createButtonDisabled,
            ]}
            onPress={handleCreateEvent}
            disabled={creating}
            activeOpacity={0.8}
          >
            {creating ? (
              <ActivityIndicator
                size="small"
                color={COLORS.textOnPrimary}
              />
            ) : (
              <>
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={COLORS.textOnPrimary}
                />

                <Text style={styles.createButtonText}>
                  Create Event
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {payload && (
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>
              Attendance QR Code
            </Text>

            <Text style={styles.qrDescription}>
              Students can scan this QR code to record
              their attendance.
            </Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={payload}
                size={240}
                backgroundColor={COLORS.card}
              />
            </View>

            <View style={styles.eventInfo}>
              <Text style={styles.eventInfoLabel}>
                Event
              </Text>

              <Text style={styles.eventInfoValue}>
                {createdEventTitle}
              </Text>

              <Text style={styles.eventInfoLabel}>
                Event Code
              </Text>

              <Text style={styles.eventInfoValue}>
                {createdEventId}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={COLORS.primary}
          />

          <Text style={styles.infoText}>
            The event code will be used by students when
            scanning the attendance QR code.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
    backgroundColor: COLORS.background,
  },

  loadingIndicator: {
    marginBottom: 14,
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  lockCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  restrictedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },

  restrictedText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 2,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 8,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 17,
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.card,
  },

  createButton: {
    height: 54,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 30,
    gap: 8,
  },

  createButtonDisabled: {
    opacity: 0.6,
  },

  createButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },

  qrCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 2,
  },

  qrTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  qrDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },

  qrContainer: {
    padding: 15,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  eventInfo: {
    width: '100%',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  eventInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 6,
  },

  eventInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 3,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
});