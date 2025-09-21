import type { RoundCheckpoint } from '@/types/rounds';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { darkTheme } from '@/assets/theme';

import Badge from '../Badge';
import PrimaryButton from '../Buttons/Primary';

function CheckpointRow({
  isNext,
  item,
  onPress,
}: {
  isNext: boolean;
  item: RoundCheckpoint;
  onPress: () => void;
}) {
  const done = !!item.done;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={done}
      onPress={onPress}
      style={[
        styles.cpCard,
        done && { opacity: 0.5 },
        isNext && styles.cpCardNext,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.cpTitle}>
          {item.name}
        </Text>
        <Text style={styles.cpMeta}>
          {done ? 'Registrado' : 'Pendiente'} {item.id ? '· NFC' : ''}
        </Text>
      </View>
      {done ? (
        <Badge text="Hecho" tone="ok" />
      ) : (
        <PrimaryButton
          label={isNext ? 'Escanear NFC' : 'Registrar'}
          onPress={onPress}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cpCard: {
    alignItems: 'center',
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  cpCardNext: {
    borderColor: darkTheme.highlight,
  },
  cpMeta: { color: darkTheme.textSecondary, fontSize: 12, marginTop: 2 },

  cpTitle: { color: darkTheme.textPrimary, fontSize: 16, fontWeight: '600' },
});

export default CheckpointRow;
