import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

/**
 * Shared premium modal form styles used across Goals, Subscriptions,
 * and any future modal forms to ensure visual consistency.
 *
 * These styles use the light-mode defaults. For dark mode, the modal
 * sheet background is set dynamically in KeyboardAwareModal, and text/input
 * colors are overridden inline using `colors` from `useTheme()`.
 *
 * For form elements (inputs, chips, buttons) we keep the structural styles
 * here and rely on the `useTheme` color overrides at the component level
 * to avoid circular imports.
 */
export const sharedModalStyles = StyleSheet.create({
  // ── Header ──
  title: {
    fontSize: Typography.sizes.headingSm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },

  // ── Sections ──
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },

  // ── Inputs ──
  input: {
    fontSize: Typography.sizes.body,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    borderRadius: 14,
    paddingHorizontal: Spacing.base,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  inputFocused: {
    borderColor: Colors.finoraGreen,
    backgroundColor: Colors.background,
  },

  // ── Chips (cycle, reminders) ──
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.finoraGreen,
    backgroundColor: Colors.finoraGreen + '12',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.finoraGreenDark,
  },

  // ── Icon picker ──
  iconRow: {
    marginBottom: Spacing.sm,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  iconBtnSelected: {
    borderWidth: 2,
  },

  // ── Color picker ──
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: Colors.text,
    transform: [{ scale: 1.1 }],
  },

  // ── Actions ──
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  saveText: {
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
