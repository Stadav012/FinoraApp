import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bar1 = useRef(new Animated.Value(0)).current;
  const bar2 = useRef(new Animated.Value(0)).current;
  const bar3 = useRef(new Animated.Value(0)).current;
  const bar4 = useRef(new Animated.Value(0)).current;
  const bar5 = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Card entrance
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Bars animate in staggered
    const bars = [bar1, bar2, bar3, bar4, bar5];
    bars.forEach((bar, i) => {
      Animated.sequence([
        Animated.delay(600 + i * 150),
        Animated.spring(bar, { toValue: [0.4, 0.7, 0.55, 0.85, 0.3][i], friction: 6, tension: 40, useNativeDriver: false }),
      ]).start();
    });

    // Pulse loop on icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Dot crawl animation
    Animated.loop(
      Animated.timing(dotAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const bars = [bar1, bar2, bar3, bar4, bar5];
  const barColors = ['#58cc02', '#1cb0f6', '#ffc700', '#a570ff', '#ff6b6b'];

  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>Analytics</Text>

      <View style={styles.centerWrap}>
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
          {/* Ambient blobs */}
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          <View style={styles.glass}>
            {/* Mini chart bars */}
            <View style={styles.chartArea}>
              {bars.map((bar, i) => (
                <View key={i} style={styles.barCol}>
                  <Animated.View style={[styles.bar, {
                    backgroundColor: barColors[i],
                    height: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  }]} />
                  <View style={[styles.barDot, { backgroundColor: barColors[i] }]} />
                </View>
              ))}
            </View>

            {/* Divider with crawling dot */}
            <View style={styles.dividerWrap}>
              <View style={styles.divider} />
              <Animated.View style={[styles.crawlDot, {
                transform: [{
                  translateX: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.55] }),
                }],
              }]} />
            </View>

            {/* Icon + text */}
            <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="analytics" size={32} color="#fff" />
            </Animated.View>

            <Text style={styles.comingSoonText}>Coming Soon</Text>
            <Text style={styles.comingSoonSub}>
              Deep spending insights, trend analysis, and smart budgeting.
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pageTitle: {
    fontSize: Typography.sizes.heading, fontWeight: '700', color: Colors.text,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg,
  },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },

  card: {
    width: '100%', borderRadius: 24, backgroundColor: '#1a1a2e', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.25, shadowRadius: 32, elevation: 10,
  },
  blob1: {
    position: 'absolute', top: -40, right: -30, width: 140, height: 140,
    borderRadius: 70, backgroundColor: '#a570ff', opacity: 0.2,
  },
  blob2: {
    position: 'absolute', bottom: -30, left: -20, width: 120, height: 120,
    borderRadius: 60, backgroundColor: '#1cb0f6', opacity: 0.15,
  },
  glass: {
    padding: 28, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)',
  },

  // Chart
  chartArea: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    height: 80, alignItems: 'flex-end', marginBottom: 20, paddingHorizontal: 8,
  },
  barCol: { alignItems: 'center', width: 20 },
  bar: { width: 12, borderRadius: 6 },
  barDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 6, opacity: 0.5 },

  // Divider
  dividerWrap: { width: '100%', height: 2, marginBottom: 28, position: 'relative' },
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  crawlDot: {
    position: 'absolute', top: -2, left: 0, width: 6, height: 6,
    borderRadius: 3, backgroundColor: '#58cc02',
  },

  // Content
  iconWrap: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  comingSoonText: {
    fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginBottom: 8,
  },
  comingSoonSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20, maxWidth: 260,
  },
});
