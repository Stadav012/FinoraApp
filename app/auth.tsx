import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

export default function AuthScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Image
            source={require('../assets/finora-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.headline}>Take control of{'\n'}your finances</Text>
          <Text style={styles.subheadline}>
            Track spending, set budgets, and watch your savings grow.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/onboarding' as any)}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            activeOpacity={0.6}
            onPress={() => router.push('/login' as any)}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    justifyContent: 'space-between',
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  textContainer: {
    marginBottom: Spacing['4xl'],
  },
  headline: {
    fontSize: Typography.sizes.headingLg,
    lineHeight: Typography.lineHeights.headingLg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  subheadline: {
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacing.body,
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.finoraGreen,
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    letterSpacing: Typography.letterSpacing.body,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: Typography.sizes.body,
    fontWeight: '500',
    letterSpacing: Typography.letterSpacing.body,
  },
});
