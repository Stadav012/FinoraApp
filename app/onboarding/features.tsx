import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    id: '1',
    icon: 'chatbubble-ellipses-outline' as const,
    title: 'Just type it',
    description: 'Type a transaction like "Spent $12 on lunch" and Finora will categorize and log it for you automatically.',
    color: Colors.finoraGreen,
  },
  {
    id: '2',
    icon: 'repeat-outline' as const,
    title: 'Track subscriptions',
    description: 'Add your recurring subscriptions and never be surprised by a charge again. Get reminders before renewals.',
    color: Colors.finoraSkyBlue,
  },
  {
    id: '3',
    icon: 'bar-chart-outline' as const,
    title: 'Smart analysis',
    description: 'See where your money goes with beautiful charts and AI-powered spending insights.',
    color: '#a570ff',
  },
  {
    id: '4',
    icon: 'flag-outline' as const,
    title: 'Set financial goals',
    description: 'Whether saving for a trip or paying off debt, set goals and track your progress visually.',
    color: Colors.finoraYellow,
  },
];

export default function FeaturesScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLastSlide = currentIndex === FEATURES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      router.push('/onboarding/complete' as any);
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderItem = ({ item }: { item: typeof FEATURES[0] }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
          <Ionicons name={item.icon} size={48} color={item.color} />
        </View>
        <Text style={styles.featureTitle}>{item.title}</Text>
        <Text style={styles.featureDescription}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '95%' }]} />
        </View>
        <View style={styles.spacer} />
      </View>

      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={FEATURES}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.pagination}>
          {FEATURES.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: Colors.finoraGreen,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <Text style={styles.continueButtonText}>
            {isLastSlide ? "Let's go!" : 'Next'}
          </Text>
        </TouchableOpacity>

        {!isLastSlide && (
          <TouchableOpacity
            style={styles.skipButton}
            activeOpacity={0.6}
            onPress={() => router.push('/onboarding/complete' as any)}
          >
            <Text style={styles.skipButtonText}>Skip tutorial</Text>
          </TouchableOpacity>
        )}
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
  carouselContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing['4xl'],
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['3xl'],
  },
  featureTitle: {
    fontSize: Typography.sizes.headingSm,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  featureDescription: {
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  continueButton: {
    backgroundColor: Colors.text,
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
  },
  continueButtonText: {
    color: Colors.background,
    fontSize: Typography.sizes.body,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.caption,
    fontWeight: '500',
  },
});
