import { MotiView } from 'moti';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type SkeletonProps = {
  h?: number;
  r?: number;
  style?: any;
  w?: number | string;
};

/** Bloque base con animación de “latido” */
const Skeleton = ({ h = 14, r = 8, style = {}, w = '100%' }: SkeletonProps) => (
  <MotiView
    animate={{ opacity: 1 }}
    from={{ opacity: 0.5 }}
    style={[
      {
        backgroundColor: 'rgba(150,150,150,0.15)',
        borderRadius: r,
        height: h,
        width: w,
      },
      style,
    ]}
    transition={{ duration: 800, loop: true, type: 'timing' }}
  />
);

export const ReportsSummarySkeleton = ({ cardBg }: { cardBg: string }) => {
  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={{ gap: 8 }}>
        <Skeleton h={16} w={140} />
        <Skeleton h={12} w={90} />
      </View>

      <View style={styles.row}>
        <View style={styles.kpi}>
          <Skeleton h={28} w={36} />
          <Skeleton h={10} w={50} />
        </View>
        <View style={styles.kpi}>
          <Skeleton h={28} w={36} />
          <Skeleton h={10} w={50} />
        </View>
        <View style={styles.kpi}>
          <Skeleton h={28} w={36} />
          <Skeleton h={10} w={50} />
        </View>
        <View style={styles.kpi}>
          <Skeleton h={28} w={36} />
          <Skeleton h={10} w={50} />
        </View>
      </View>
    </View>
  );
};

export const ReportsListSkeleton = ({
  cardBg,
  count = 3,
}: {
  cardBg: string;
  count?: number;
}) => {
  return (
    <View
      style={[styles.card, { backgroundColor: cardBg, paddingVertical: 12 }]}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.itemRow}>
          <Skeleton h={40} r={20} w={40} />
          <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
            <Skeleton h={14} w="70%" />
            <Skeleton h={12} w="40%" />
          </View>
          <Skeleton h={20} r={999} w={60} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  kpi: {
    alignItems: 'center',
    gap: 8,
    width: '22%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
