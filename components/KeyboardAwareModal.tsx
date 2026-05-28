import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface KeyboardAwareModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Premium bottom-sheet modal with handle bar, frosted backdrop,
 * and proper keyboard avoidance on both platforms.
 */
export default function KeyboardAwareModal({ visible, onClose, children }: KeyboardAwareModalProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            {/* Handle bar */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Content with scroll for long forms */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollInner}
            >
              {children}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  keyboardView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.88,
    // Top shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  scrollContent: {
    flexGrow: 0,
  },
  scrollInner: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
});
