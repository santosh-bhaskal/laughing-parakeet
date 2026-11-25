import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: SkeletonProps) {
  const { isDark } = useAppTheme();
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacityAnim]);

  const defaultBg = isDark ? '#334155' : '#CBD5E1';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: defaultBg,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

// Reusable Metric Card Skeleton
export function MetricCardSkeleton() {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.metricCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
      <Skeleton width={75} height={11} borderRadius={4} />
      <Skeleton width={90} height={26} borderRadius={6} style={{ marginVertical: 8 }} />
      <Skeleton width={60} height={11} borderRadius={4} />
    </View>
  );
}

// Reusable Table Rows Skeleton
export function TableRowsSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 0, paddingHorizontal: 4 }}>
      {/* Header bar placeholder */}
      <View style={[styles.tableRow, { borderColor: theme.colors.cardBorder, borderBottomWidth: 1, paddingVertical: 10 }]}>
        {Array.from({ length: columns }).map((_, cIdx) => (
          <Skeleton
            key={cIdx}
            width={cIdx === 0 ? '25%' : '18%'}
            height={10}
            borderRadius={3}
            style={cIdx === columns - 1 ? { alignSelf: 'flex-end', marginLeft: 'auto' } : undefined}
          />
        ))}
      </View>

      {/* Row placeholders */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <View
          key={rIdx}
          style={[
            styles.tableRow,
            { borderColor: theme.colors.cardBorder, borderBottomWidth: rIdx === rows - 1 ? 0 : 1 },
          ]}
        >
          <View style={{ gap: 4, width: '28%' }}>
            <Skeleton width="90%" height={13} borderRadius={4} />
            <Skeleton width="60%" height={9} borderRadius={3} />
          </View>
          <Skeleton width="18%" height={14} borderRadius={4} />
          <Skeleton width="18%" height={14} borderRadius={4} />
          <Skeleton width="18%" height={16} borderRadius={6} style={{ marginLeft: 'auto' }} />
        </View>
      ))}
    </View>
  );
}

// Full Dashboard Screen Skeleton
export function DashboardSkeleton() {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 14 }}>
      {/* Hero Card Skeleton */}
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Skeleton width={110} height={20} borderRadius={6} />
              <Skeleton width={60} height={18} borderRadius={12} />
            </View>
            <Skeleton width={170} height={12} borderRadius={4} />
          </View>
          <Skeleton width={80} height={26} borderRadius={12} />
        </View>

        {/* Progress Track */}
        <View style={{ marginTop: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={90} height={10} borderRadius={3} />
            <Skeleton width={30} height={10} borderRadius={3} />
          </View>
          <Skeleton width="100%" height={8} borderRadius={4} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width={80} height={9} borderRadius={3} />
            <Skeleton width={90} height={9} borderRadius={3} />
            <Skeleton width={80} height={9} borderRadius={3} />
          </View>
        </View>
      </View>

      {/* 2x2 Metric Cards Grid */}
      <View style={styles.grid}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>
      <View style={styles.grid}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>

      {/* Table Card Skeleton */}
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Skeleton width={130} height={16} borderRadius={5} />
          <Skeleton width={70} height={20} borderRadius={10} />
        </View>
        <TableRowsSkeleton rows={4} columns={4} />
      </View>
    </View>
  );
}

// Full Inventories Screen Skeleton
export function InventoriesSkeleton() {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 14 }}>
      {/* 2 Summary Cards */}
      <View style={styles.grid}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>

      {/* Table Card Skeleton */}
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Skeleton width={150} height={16} borderRadius={5} />
          <Skeleton width={80} height={20} borderRadius={10} />
        </View>
        <TableRowsSkeleton rows={5} columns={4} />
      </View>
    </View>
  );
}

// Full StockOut Screen Skeleton
export function StockOutSkeleton() {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 14 }}>
      {/* 4 Metric Cards */}
      <View style={styles.grid}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>
      <View style={styles.grid}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>

      {/* Table Card Skeleton */}
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Skeleton width={140} height={16} borderRadius={5} />
          <Skeleton width={85} height={20} borderRadius={10} />
        </View>
        <TableRowsSkeleton rows={4} columns={4} />
      </View>
    </View>
  );
}

// Full Reports Screen Skeleton
export function ReportsSkeleton() {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 14 }}>
      {/* 4 Metric Cards */}
      <View style={styles.grid}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>
      <View style={styles.grid}>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </View>

      {/* Table Card Skeleton */}
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Skeleton width={160} height={16} borderRadius={5} />
          <Skeleton width={90} height={20} borderRadius={10} />
        </View>
        <TableRowsSkeleton rows={4} columns={4} />
      </View>
    </View>
  );
}

// Profile Screen Skeleton
export function ProfileSkeleton() {
  const { theme } = useAppTheme();

  return (
    <View style={{ gap: 14 }}>
      {/* User Card */}
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        <Skeleton width={52} height={52} borderRadius={26} />
        <View style={{ gap: 6, flex: 1 }}>
          <Skeleton width="60%" height={16} borderRadius={4} />
          <Skeleton width="45%" height={12} borderRadius={4} />
        </View>
      </View>

      {/* Settings Card */}
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.cardBorder, gap: 14 }]}>
        <Skeleton width={150} height={16} borderRadius={4} />
        <Skeleton width="100%" height={40} borderRadius={8} />
        <Skeleton width="100%" height={40} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 90,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
});
