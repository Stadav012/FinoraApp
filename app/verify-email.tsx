import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase'; // Adjust path if your structure is different
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export default function VerifyEmailScreen() {
  // Grab the email passed from the signup screen
  const params = useLocalSearchParams();
  
  const [email, setEmail] = useState((params?.email as string) || '');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validation: Email required, OTP must be exactly 6 chars
  const isValid = email.trim().length > 0 && otp.trim().length === 6;

  const handleVerify = async () => {
    if (!isValid) return;
    setIsLoading(true);

    // Notice the type is 'signup' here!
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'signup',
    });

    setIsLoading(false);

    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Verification Failed: ' + error.message);
      } else {
        Alert.alert('Verification Failed', error.message);
      }
    } else {
      // Success! The user is now fully authenticated. Send them to onboarding.
      router.replace('/onboarding/currency' as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} keyboardShouldPersistTaps="handled">
          <Text style={styles.headline}>Verify your email</Text>
          <Text style={styles.subheadline}>We sent a 6-digit code to your email. Enter it below to confirm your account.</Text>

          {/* Email Input (Pre-filled, but editable just in case) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* OTP Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>6-Digit Code</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor={Colors.textTertiary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleVerify}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.continueButtonText}>Verify Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  backButton: { padding: Spacing.xs, alignSelf: 'flex-start', marginLeft: -Spacing.xs },
  scrollContent: { flex: 1 },
  scrollInner: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  headline: { fontSize: Typography.sizes.heading, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  subheadline: { fontSize: Typography.sizes.body, color: Colors.textSecondary, marginBottom: Spacing['3xl'] },
  inputGroup: { marginBottom: Spacing.xl },
  label: { fontSize: Typography.sizes.caption, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  bottomContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  continueButton: { backgroundColor: Colors.text, paddingVertical: 16, borderRadius: BorderRadius.pill, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: Colors.border },
  continueButtonText: { color: Colors.background, fontSize: Typography.sizes.body, fontWeight: '600' },
});