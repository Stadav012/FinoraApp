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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = email.trim().length > 0;

  const handleSendResetLink = async () => {
    if (!isValid) return;
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

    setIsLoading(false);

    if (error) {
        Alert.alert('Error', error.message);
    } else {
        Alert.alert(
        'Check your email',
        'We sent a 6-digit recovery code to your inbox.',
        [
            { 
            text: 'OK', 
            // Push them straight to the reset screen so they can enter the code
            onPress: () => router.push('/reset-password') 
            }
        ]
        );
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
          <Text style={styles.headline}>Reset Password</Text>
          <Text style={styles.subheadline}>Enter your email address and we'll send you a link to reset your password.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSendResetLink}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSendResetLink}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <Text style={styles.continueButtonText}>Send Reset Link</Text>
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
  input: { fontSize: Typography.sizes.body, color: Colors.text, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.base, paddingVertical: 14, backgroundColor: Colors.surface },
  bottomContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  continueButton: { backgroundColor: Colors.text, paddingVertical: 16, borderRadius: BorderRadius.pill, alignItems: 'center' },
  continueButtonDisabled: { backgroundColor: Colors.border },
  continueButtonText: { color: Colors.background, fontSize: Typography.sizes.body, fontWeight: '600' },
});