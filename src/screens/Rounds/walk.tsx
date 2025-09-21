/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
// src/screens/RoundWalkScreen.tsx
import type { RoundCheckpoint } from '@/types/rounds';

import { FlashList } from '@shopify/flash-list';
import { MotiView } from 'moti';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActiveRound } from '@/hooks/rounds';

import {
  CheckpointRow,
  CSafeAreaView,
  Header,
  ProgressPill,
  ScanModal,
} from '@/components/atoms';

import { darkTheme } from '@/assets/theme';
import { scanCheckpointTag } from '@/utils/nfc';
import { showErrorToast, showInfoToast } from '@/utils/toast';
import { getCurrentPositionNative } from '@/utils/tracking';

const GEO_RADIUS_M = 30;

export default function RoundWalkScreen() {
  const { top } = useSafeAreaInsets();
  const { data: active, isPending, refetch } = useActiveRound();
  const [scanning, setScanning] = useState<{ cp: RoundCheckpoint } | null>(
    null,
  );

  const done = active?.data?.progress.done ?? 0;
  const total = active?.data?.progress.total ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const nextCheckpoint = useMemo(() => {
    if (!active?.data?.checkpoints) {
      return undefined;
    }
    return active.data?.checkpoints.find((c) => !c.done);
  }, [active?.data?.checkpoints]);

  const onScanFor = useCallback(async (cp: RoundCheckpoint) => {
    try {
      // 1) Pide ubicación y valida geocerca
      const pos = await getCurrentPositionNative({
        enableHighAccuracy: true,
        timeoutMs: 8000,
      });
      const dist = haversineMeters(
        pos.latitude,
        pos.longitude,
        cp.latitude,
        cp.longitude,
      );
      if (dist > GEO_RADIUS_M) {
        // toast?.warn?.(`Acércate ${Math.max(1,Math.round(dist - GEO_RADIUS_M))} m para registrar`);
        showInfoToast(
          `Acércate ${Math.max(1, Math.round(dist - GEO_RADIUS_M))} m para registrar`,
        );
        return;
      }

      // 2) Abre modal escaneo
      setScanning({ cp });

      // 3) Lee NFC
      const tag = await scanCheckpointTag(10_000);

      console.log('Tag information ====>', tag);
    } catch (error: any) {
      // toast?.error?.(error?.message ?? 'Error al registrar');
      showErrorToast(error?.message ?? 'Error al registrar');
    } finally {
      setScanning(null);
    }
  }, []);

  if (isPending && !active) {
    return (
      <CSafeAreaView edges={['top']} style={styles.center}>
        <Header title="Caminata" />
        <ActivityIndicator color={darkTheme.highlight} />
      </CSafeAreaView>
    );
  }

  if (!active) {
    return (
      <CSafeAreaView edges={['top']} style={styles.center}>
        <Header title="Caminata" />
        <Text style={styles.text}>No tienes una ronda en curso.</Text>
        <Text onPress={() => refetch()} style={styles.link}>
          Actualizar
        </Text>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: darkTheme.background, flex: 1 }}
    >
      <Header title={active.data?.name ?? ''} />

      {/* Header de progreso con Moti */}
      <MotiView
        animate={{ opacity: 1, translateY: 0 }}
        from={{ opacity: 0, translateY: -8 }}
        style={[styles.headerBox, { marginTop: 8 + top }]}
        transition={{ duration: 250, type: 'timing' }}
      >
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.hTitle}>
            Ronda en curso
          </Text>
          <Text style={styles.hMeta}>
            {done}/{total} completados · {pct}%
          </Text>
        </View>
        <ProgressPill pct={pct} />
      </MotiView>

      {/* Lista de checkpoints */}
      <FlashList
        contentContainerStyle={styles.list}
        data={active.data?.checkpoints}
        estimatedItemSize={92}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => (
          <CheckpointRow
            isNext={item.id === nextCheckpoint?.id}
            item={item}
            onPress={() => onScanFor(item)}
          />
        )}
      />

      {/* Modal de escaneo */}
      <ScanModal
        name={scanning?.cp.name ?? ''}
        onCancel={() => setScanning(null)}
        visible={!!scanning}
      />
    </CSafeAreaView>
  );
}

/* ───────────────────────────── Helpers ───────────────────────────── */

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ───────────────────────────── Styles ───────────────────────────── */

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    flex: 1,
    justifyContent: 'center',
  },

  headerBox: {
    alignItems: 'center',
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    padding: 14,
  },
  hMeta: { color: darkTheme.textSecondary, fontSize: 12, marginTop: 2 },
  hTitle: { color: darkTheme.textPrimary, fontSize: 14, fontWeight: '700' },
  link: {
    color: darkTheme.highlight,
    marginTop: 8,
    textDecorationLine: 'underline',
  },

  list: { padding: 16 },

  text: { color: darkTheme.textPrimary, marginTop: 8 },
});
