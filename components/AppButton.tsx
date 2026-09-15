import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from '@/constants/colors';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme?: 'primary';
  onPress: () => void;
  disabled?: boolean;
};

export default function AppButton({
  title,
  icon,
  theme,
  onPress,
  disabled = false,
}: Props) {
  return (
    <Pressable
      style={[
        styles.button,
        theme === 'primary' && styles.primaryButton,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={22}
        color={
          theme === 'primary'
            ? COLORS.textOnPrimary
            : COLORS.textSecondary
        }
        style={styles.icon}
      />

      <Text
        style={[
          styles.label,
          theme === 'primary' && styles.primaryLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    marginBottom: 14,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: COLORS.card,

    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 18,
  },

  disabled: {
    opacity: 0.5,
  },

  icon: {
    marginRight: 10,
  },

  label: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  primaryLabel: {
    color: COLORS.textOnPrimary,
  },
});