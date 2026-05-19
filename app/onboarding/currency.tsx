import { Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const CURRENCIES = [
  { id: 'USD', symbol: '$', name: 'US Dollar' },
  { id: 'EUR', symbol: '\u20AC', name: 'Euro' },
  { id: 'GBP', symbol: '\u00A3', name: 'British Pound' },
  { id: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { id: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { id: 'JPY', symbol: '\u00A5', name: 'Japanese Yen' },
];

export default function CurrencyScreen() {
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedCurrency) return;
    setIsLoading(true);

    // getting currently logged user to update their profile with the selected currency
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ currency: selectedCurrency })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating currency:', error);
      }
    }
    // if successfully updated, navigate to the next onboarding screen
    setIsLoading(false);
    router.push('/onboarding/goal' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '40%' }]} />
        </View>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.headline}>Select your default currency</Text>
          <Text style={styles.subheadline}>You can always change this later in settings.</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {CURRENCIES.map((currency) => {
              const isSelected = selectedCurrency === currency.id;
              return (
                <TouchableOpacity
                  key={currency.id}
                  style={[styles.currencyCard, isSelected && styles.currencyCardSelected]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedCurrency(currency.id)}
                >
                  <View style={[styles.symbolContainer, isSelected && styles.symbolContainerSelected]}>
                    <Text style={[styles.symbol, isSelected && styles.symbolSelected]}>
                      {currency.symbol}
                    </Text>
                  </View>
                  <View style={styles.currencyInfo}>
                    <Text style={[styles.currencyId, isSelected && styles.textSelected]}>
                      {currency.id}
                    </Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={Colors.finoraGreen} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !selectedCurrency && styles.continueButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={!selectedCurrency || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderSubtle,
    borderRadius: BorderRadius.pill,
    marginHorizontal: Spacing.xl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.finoraGreen,
    borderRadius: BorderRadius.pill,
  },
  spacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 1,
  },
  headline: {
    fontSize: Typography.sizes.headingSm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subheadline: {
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
    marginBottom: Spacing['2xl'],
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currencyCardSelected: {
    backgroundColor: Colors.background,
    borderColor: Colors.finoraGreen,
  },
  symbolContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  symbolContainerSelected: {
    backgroundColor: '#58cc021A',
  },
  symbol: {
    fontSize: Typography.sizes.subheading,
    fontWeight: '600',
    color: Colors.text,
  },
  symbolSelected: {
    color: Colors.finoraGreenDark,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyId: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text,
  },
  currencyName: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  textSelected: {
    color: Colors.finoraGreenDark,
  },
  continueButton: {
    backgroundColor: Colors.text,
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.border,
  },
  continueButtonText: {
    color: Colors.background,
    fontSize: Typography.sizes.body,
    fontWeight: '600',
  },
});
