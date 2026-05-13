import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const GOALS = [
  { id: 'track', title: 'Track my daily spending', icon: 'wallet-outline' as const },
  { id: 'save', title: 'Save for a specific goal', icon: 'trending-up-outline' as const },
  { id: 'subs', title: 'Manage my subscriptions', icon: 'calendar-outline' as const },
  { id: 'budget', title: 'Get better at budgeting', icon: 'pie-chart-outline' as const },
];

export default function GoalScreen() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '60%' }]} />
        </View>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.headline}>Why are you joining Finora?</Text>
          <Text style={styles.subheadline}>{"We'll customize your dashboard based on this."}</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {GOALS.map((goal) => {
              const isSelected = selectedGoal === goal.id;
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedGoal(goal.id)}
                >
                  <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <Ionicons
                      name={goal.icon}
                      size={24}
                      color={isSelected ? Colors.finoraGreenDark : Colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.goalTitle, isSelected && styles.textSelected]}>
                    {goal.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !selectedGoal && styles.continueButtonDisabled]}
          activeOpacity={0.8}
          onPress={() => router.push('/onboarding/knowledge' as any)}
          disabled={!selectedGoal}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    backgroundColor: Colors.background,
    borderColor: Colors.finoraGreen,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: '#58cc021A',
  },
  goalTitle: {
    flex: 1,
    fontSize: Typography.sizes.body,
    fontWeight: '500',
    color: Colors.text,
  },
  textSelected: {
    color: Colors.finoraGreenDark,
    fontWeight: '600',
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
