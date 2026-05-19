import { Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: "I'm just starting to figure out my finances." },
  { id: 'intermediate', title: 'Intermediate', desc: 'I budget somewhat, but want to get better.' },
  { id: 'advanced', title: 'Advanced', desc: 'I track everything and want deep analytics.' },
];

export default function KnowledgeScreen() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
      if (!selectedLevel) return;
      setIsLoading(true);
  
      // getting currently logged user to update their profile with the selected knowledge_level
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ knowledge_level: selectedLevel })
          .eq('id', user.id);
  
        if (error) {
          Alert.alert('Error saving knowledge_level', error.message);
          setIsLoading(false);
          return;
        }
      }
      // if successfully updated, navigate to the next onboarding screen
      setIsLoading(false);
      router.push('/onboarding/features' as any);
    };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '80%' }]} />
        </View>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.headline}>Rate your financial knowledge</Text>
          <Text style={styles.subheadline}>This helps us tailor insights to your level.</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            {LEVELS.map((level) => {
              const isSelected = selectedLevel === level.id;
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedLevel(level.id)}
                >
                  <View style={styles.radioContainer}>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.levelTitle, isSelected && styles.textSelected]}>
                      {level.title}
                    </Text>
                    <Text style={styles.levelDesc}>{level.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, !selectedLevel && styles.continueButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={!selectedLevel || isLoading}
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
  levelCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelCardSelected: {
    backgroundColor: Colors.background,
    borderColor: Colors.finoraGreen,
  },
  radioContainer: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.finoraGreen,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.finoraGreen,
  },
  textContainer: {
    flex: 1,
  },
  levelTitle: {
    fontSize: Typography.sizes.subheading,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  levelDesc: {
    fontSize: Typography.sizes.caption,
    color: Colors.textSecondary,
    lineHeight: 20,
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
