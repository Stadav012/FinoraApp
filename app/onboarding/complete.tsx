import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SETUP_STEPS = [
  { label: 'Creating your profile', icon: 'person-outline' as const },
  { label: 'Setting preferences', icon: 'settings-outline' as const },
  { label: 'Preparing your dashboard', icon: 'grid-outline' as const },
  { label: 'Enabling smart insights', icon: 'sparkles-outline' as const },
];

export default function CompleteScreen() {
  const [activeStep, setActiveStep] = useState(-1);
  const [allDone, setAllDone] = useState(false);

  // Logo animation
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Step fade-ins
  const stepOpacities = useRef(SETUP_STEPS.map(() => new Animated.Value(0))).current;
  const stepTranslates = useRef(SETUP_STEPS.map(() => new Animated.Value(20))).current;

  // Checkmark scales
  const checkScales = useRef(SETUP_STEPS.map(() => new Animated.Value(0))).current;

  // Final celebration
  const doneScale = useRef(new Animated.Value(0)).current;
  const doneOpacity = useRef(new Animated.Value(0)).current;

  // Screen exit
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Stage 1: Logo animates in
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Steps appear one by one with staggered timing
    const stepDelay = 600;
    SETUP_STEPS.forEach((_, index) => {
      // Fade in the step
      setTimeout(() => {
        setActiveStep(index);
        Animated.parallel([
          Animated.timing(stepOpacities[index], {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(stepTranslates[index], {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }, 800 + index * stepDelay);

      // Checkmark pops in after a beat
      setTimeout(() => {
        Animated.spring(checkScales[index], {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }).start();
      }, 800 + index * stepDelay + 400);
    });

    // Stage 3: Celebration after all steps
    const celebrationTime = 800 + SETUP_STEPS.length * stepDelay + 500;
    setTimeout(() => {
      setAllDone(true);
      Animated.parallel([
        Animated.spring(doneScale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(doneOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, celebrationTime);

    // Stage 4: Navigate to dashboard
    setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/(tabs)' as any);
      });
    }, celebrationTime + 1500);
  }, []);

  return (
    <Animated.View style={[styles.outerContainer, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Finora icon */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('../../assets/finora-icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Setup steps */}
          <View style={styles.stepsContainer}>
            {SETUP_STEPS.map((step, index) => (
              <Animated.View
                key={step.label}
                style={[
                  styles.stepRow,
                  {
                    opacity: stepOpacities[index],
                    transform: [{ translateY: stepTranslates[index] }],
                  },
                ]}
              >
                <View style={[
                  styles.stepIconContainer,
                  index <= activeStep && styles.stepIconActive,
                ]}>
                  <Ionicons
                    name={step.icon}
                    size={18}
                    color={index <= activeStep ? Colors.finoraGreen : Colors.textTertiary}
                  />
                </View>
                <Text style={[
                  styles.stepLabel,
                  index <= activeStep && styles.stepLabelActive,
                ]}>
                  {step.label}
                </Text>
                <Animated.View style={{ transform: [{ scale: checkScales[index] }] }}>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.finoraGreen} />
                </Animated.View>
              </Animated.View>
            ))}
          </View>

          {/* Done celebration */}
          {allDone && (
            <Animated.View
              style={[
                styles.doneContainer,
                {
                  opacity: doneOpacity,
                  transform: [{ scale: doneScale }],
                },
              ]}
            >
              <View style={styles.doneBadge}>
                <Ionicons name="checkmark" size={32} color={Colors.background} />
              </View>
              <Text style={styles.doneTitle}>{"You're all set!"}</Text>
              <Text style={styles.doneSubtitle}>Welcome to Finora</Text>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: Spacing['4xl'],
  },
  logo: {
    width: 72,
    height: 72,
  },
  stepsContainer: {
    width: '100%',
    gap: Spacing.base,
    marginBottom: Spacing['4xl'],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepIconActive: {
    backgroundColor: '#58cc021A',
  },
  stepLabel: {
    flex: 1,
    fontSize: Typography.sizes.caption,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  stepLabelActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  doneContainer: {
    alignItems: 'center',
  },
  doneBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.finoraGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  doneTitle: {
    fontSize: Typography.sizes.headingSm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  doneSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.textSecondary,
  },
});
