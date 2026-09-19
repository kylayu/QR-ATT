import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { signUp } from '@/lib/auth';

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError('');
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(
        email.trim().toLowerCase(),
        password,
        {
          full_name: fullName.trim(),
          role,
        }
      );

      if (authError) {
        const message = authError.message.toLowerCase();

        if (
          message.includes('email rate limit exceeded') ||
          message.includes('rate limit')
        ) {
          setError(
            'Too many confirmation emails have been requested. Please wait a while before trying again.'
          );
        } else if (
          message.includes('user already registered') ||
          message.includes('already registered')
        ) {
          setError(
            'This email is already registered. Please log in instead.'
          );
        } else if (message.includes('invalid email')) {
          setError('Please enter a valid email address.');
        } else if (message.includes('password')) {
          setError(authError.message);
        } else {
          setError(authError.message);
        }

        return;
      }

      if (data.session) {
        router.replace('/(tabs)');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      const message = err?.message?.toLowerCase?.() ?? '';

      if (
        message.includes('email rate limit exceeded') ||
        message.includes('rate limit')
      ) {
        setError(
          'Too many confirmation emails have been requested. Please wait a while before trying again.'
        );
      } else {
        setError(
          err?.message ||
            'Registration failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>

        <Text style={styles.subtitle}>
          Your account was created successfully. Please check your
          email to confirm your account.
        </Text>

        <AppButton
          theme="primary"
          title="Back to Login"
          icon="arrow-back"
          onPress={() => router.replace('/login')}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.subtitle}>
            Register for the QR Attendance App
          </Text>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          <Text style={styles.label}>Full Name</Text>

          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={styles.label}>Confirm Password</Text>

          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />

          <Text style={styles.label}>I am a...</Text>

          <View style={styles.roleRow}>
            <Pressable
              style={[
                styles.roleChip,
                role === 'student' && styles.roleChipActive,
              ]}
              onPress={() => setRole('student')}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === 'student' &&
                    styles.roleChipTextActive,
                ]}
              >
                Student
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.roleChip,
                role === 'teacher' && styles.roleChipActive,
              ]}
              onPress={() => setRole('teacher')}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === 'teacher' &&
                    styles.roleChipTextActive,
                ]}
              >
                Teacher
              </Text>
            </Pressable>
          </View>

          <View style={styles.buttonContainer}>
            <AppButton
              theme="primary"
              title={loading ? 'Creating Account...' : 'Register'}
              icon="person-add"
              onPress={handleRegister}
              disabled={loading}
            />
          </View>

          <Pressable
            style={styles.loginLink}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginTextBold}>Log in</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },

  error: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },

  roleChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roleChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '14',
  },

  roleChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  roleChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  buttonContainer: {
    marginTop: 28,
  },

  loginLink: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 10,
  },

  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  loginTextBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});