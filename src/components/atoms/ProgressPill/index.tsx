import { StyleSheet, Text, View } from 'react-native';

import { darkTheme } from '@/assets/theme';

function ProgressPill({ pct }: { pct: number }) {
  return (
    <View style={styles.pill}>
      <View
        style={[
          styles.pillFill,
          { width: `${Math.min(100, Math.max(0, pct))}%` },
        ]}
      />
      <Text style={styles.pillText}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#2a2a2a',
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 88,
  },
  pillFill: {
    backgroundColor: darkTheme.highlight,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  pillText: { color: '#0B0B0B', fontWeight: '700', textAlign: 'center' },
});
export default ProgressPill;
