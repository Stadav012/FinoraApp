import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase'; 
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation: Email required, OTP must be 6 chars, Password >= 6 chars
  const isValid = email.trim().length > 0 && otp.trim().length === 6 && password.length >= 6;

  const handleUpdatePassword = async () => {
    if (!isValid) return;
    setIsLoading(true);

    try {
      // Step 1: Verify the 6-digit OTP code to establish a recovery session
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'recovery',
      });

      if (verifyError) throw verifyError;

      // Step 2: Now that the session is active, push the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Step 3: Success! Route them back to login
      Alert.alert(
        'Success',
        'Your password has been updated. You can now log in.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (err: any) {
      Alert.alert('Update Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} keyboardShouldPersistTaps="handled">
          <Text style={styles.headline}>Create New Password</Text>
          <Text style={styles.subheadline}>Enter your 6-digit recovery code and choose a new password.</Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.textInput}
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
            <Text style={styles.label}>6-Digit Recovery Code</Text>
            <TextInput
              style={styles.textInput}
              placeholder="000000"
              placeholderTextColor={Colors.textTertiary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleUpdatePassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleUpdatePassword}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.continueButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: Spacing['3xl'] },
  keyboardView: { flex: 1 },
  scrollContent: { flex: 1 },
  scrollInner: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  headline: { fontSize: Typography.sizes.heading, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  subheadline: { fontSize: Typography.sizes.body, color: Colors.textSecondary, marginBottom: Spacing['3xl'] },
  inputGroup: { marginBottom: Spacing.xl },
  label: { fontSize: Typography.sizes.caption, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    fontSize: Typography.sizes.body,
    color: Colors.text,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, backgroundColor: Colors.surface },
  passwordInput: { flex: 1, fontSize: Typography.sizes.body, color: Colors.text, paddingHorizontal: Spacing.base, paddingVertical: 14 },
  eyeButton: { paddingHorizontal: Spacing.base, paddingVertical: 14 },
  bottomContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  continueButton: { backgroundColor: Colors.text, paddingVertical: 16, borderRadius: BorderRadius.pill, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: Colors.border },
  continueButtonText: { color: Colors.background, fontSize: Typography.sizes.body, fontWeight: '600' },
});