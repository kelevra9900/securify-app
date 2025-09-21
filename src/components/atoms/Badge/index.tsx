import { StyleSheet, Text, View } from 'react-native';

import { darkTheme } from '@/assets/theme';

function Badge({ text, tone }: { text: string; tone: 'idle' | 'ok' | 'warn' }) {
  const style =
    tone === 'ok'
      ? styles.badgeOk
      : tone === 'warn'
        ? styles.badgeWarn
        : styles.badgeIdle;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

export default Badge;

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeIdle: { backgroundColor: 'transparent', borderColor: darkTheme.border },
  badgeOk: { backgroundColor: '#2ecc7130', borderColor: '#2ecc71' },
  badgeText: { color: darkTheme.textPrimary, fontSize: 11, fontWeight: '700' },
  badgeWarn: { backgroundColor: '#f39c1230', borderColor: '#f39c12' },
});
