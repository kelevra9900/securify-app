// src/screens/AttendancesScreen.tsx
import type { AttendanceDTO } from '@/types/attendances';

import { CalendarDays } from 'lucide-react-native';
import { DateTime } from 'luxon';
import { MotiView } from 'moti';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAttendancesInfinite } from '@/hooks/attendances/useGetAttendances';

import { CSafeAreaView, Header, TextLabel } from '@/components/atoms';

import { moderateScale } from '@/constants';
import { useTheme } from '@/context/Theme';
import { formatDuration } from '@/utils/attendances';
import { formatISODateModern } from '@/utils/dates';

export default function AttendancesScreen() {
  const { theme } = useTheme();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useAttendancesInfinite({ limit: 20 });

  // ✅ Aplana pages -> items
  const items = useMemo<AttendanceDTO[]>(
    () => data?.pages.flatMap((p) => (p?.items ?? []) as AttendanceDTO[]) ?? [],
    [data],
  );

  const onEnd = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={{ backgroundColor: theme.background }}
      >
        <View style={styles.container}>
          <Header title="Asistencias" />
          <SkeletonList />
        </View>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: theme.background }}
    >
      <View style={styles.container}>
        <Header title="Asistencias" />

        <FlatList
          contentContainerStyle={{ paddingVertical: 12 }}
          data={items}
          initialNumToRender={12}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <TextLabel color={theme.textSecondary} type="R14">
                No hay asistencias registradas.
              </TextLabel>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 14 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          maxToRenderPerBatch={12}
          onEndReached={onEnd}
          onEndReachedThreshold={0.2}
          refreshControl={
            <RefreshControl
              colors={[theme.textSecondary]}
              onRefresh={refetch}
              refreshing={isRefetching}
              tintColor={theme.textSecondary}
            />
          }
          renderItem={({ index, item }) => (
            <AttendanceCard
              colors={{
                bg: theme.cardBackground,
                chipBg: chipBgByStatus(item.status ?? ''),
                chipFg: chipFgByStatus(item.status ?? ''),
                shadow: theme.border,
                sub: theme.textSecondary,
                text: theme.textPrimary,
              }}
              index={index}
              item={item}
            />
          )}
          windowSize={7}
        />
      </View>
    </CSafeAreaView>
  );
}

function AttendanceCard({
  colors,
  index,
  item,
  onPress = () => {},
}: {
  colors: {
    bg: string;
    chipBg: string;
    chipFg: string;
    shadow: string;
    sub: string;
    text: string;
  };
  index: number;
  item: AttendanceDTO;
  onPress?: () => void;
}) {
  // 🗓️ Fecha principal: checkInAt || createdAt
  const dayLabel = formatISODateModern(item.checkIn, 'DATE');

  // 🕘 Secundaria: Entrada / Salida o “Creada”
  const inTime = item.checkIn ? formatTime(item.checkIn) : '';
  const outTime = item.checkOut ? formatTime(item.checkOut) : '';
  const createdTime = !item.checkIn ? formatTime(item.checkIn) : '';
  const secondary = inTime
    ? `Entrada ${inTime}${outTime ? `  ·  Salida ${outTime}` : ''}`
    : `Creada ${createdTime}`;

  const duration = formatDuration(item.checkIn, item.checkOut);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <MotiView
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        from={{ opacity: 0, scale: 0.98, translateY: 8 }}
        style={[
          styles.card,
          { backgroundColor: colors.bg, shadowColor: colors.shadow },
        ]}
        transition={{ delay: index * 40, duration: 300, type: 'timing' }}
      >
        <View style={styles.leftIcon}>
          <CalendarDays color={'#5C6EF8'} size={18} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <TextLabel color={colors.text} numberOfLines={1} type="B14">
              {dayLabel}
            </TextLabel>

            {item.status ? (
              <View style={[styles.chip, { backgroundColor: colors.chipBg }]}>
                <TextLabel color={colors.chipFg} type="B11">
                  {statusPretty(item.status)}
                </TextLabel>
              </View>
            ) : null}
          </View>

          <TextLabel color={colors.sub} style={{ marginTop: 4 }} type="R13">
            {secondary}
          </TextLabel>

          {duration ? (
            <TextLabel color={colors.sub} style={{ marginTop: 4 }} type="R12">
              {duration}
            </TextLabel>
          ) : null}
        </View>
      </MotiView>
    </TouchableOpacity>
  );
}

/* ---------------- Luxon helpers ---------------- */
const ZONE = 'America/Mexico_City';
const LOCALE = 'es';

function dt(value?: null | string) {
  if (!value) {
    return DateTime.invalid('empty');
  }
  // La API te manda ISO; añadimos robustez adicional:
  const d =
    DateTime.fromISO(value, { locale: LOCALE, zone: ZONE }) ||
    DateTime.fromRFC2822(value, { locale: LOCALE, zone: ZONE });
  return d.isValid ? d : DateTime.invalid('bad');
}

function formatTime(iso?: null | string) {
  const d = dt(iso);
  if (!d.isValid) {
    return '';
  }
  // 24h simple: "13:40"
  return d.toFormat('HH:mm');
}

/* ---------------- status chips ---------------- */
function chipBgByStatus(status?: string) {
  switch ((status ?? '').toUpperCase()) {
    case 'ABSENT':
      return '#FFEBEE';
    case 'CLOSED':
    case 'PRESENT':
      return '#E8F5E9';
    case 'LATE':
      return '#FFF3E0';
    case 'OFF_SITE':
      return '#ECEFF1';
    case 'ON_SITE':
      return '#E3F2FD';
    default:
      return '#EEF2FF'; // OPEN / desconocido
  }
}
function chipFgByStatus(status?: string) {
  switch ((status ?? '').toUpperCase()) {
    case 'ABSENT':
      return '#C62828';
    case 'CLOSED':
    case 'PRESENT':
      return '#2E7D32';
    case 'LATE':
      return '#E65100';
    case 'OFF_SITE':
      return '#546E7A';
    case 'ON_SITE':
      return '#1565C0';
    default:
      return '#3949AB';
  }
}
function statusPretty(status?: string) {
  const s = (status ?? '').toUpperCase();
  if (s === 'ON_SITE') {
    return 'En sitio';
  }
  if (s === 'OFF_SITE') {
    return 'Fuera de sitio';
  }
  if (s === 'CLOSED') {
    return 'Cerrada';
  }
  if (s === 'OPEN') {
    return 'Abierta';
  }
  if (s === 'ABSENT') {
    return 'Ausente';
  }
  if (s === 'LATE') {
    return 'Tarde';
  }
  return s || '—';
}

/* ---------------- skeleton ---------------- */

function SkeletonList() {
  return (
    <View style={{ gap: 10, paddingVertical: 12 }}>
      {[...Array(6)].map((_, i) => (
        <MotiView
          animate={{ opacity: 1 }}
          from={{ opacity: 0.4 }}
          key={i}
          style={[styles.card, { backgroundColor: 'rgba(150,150,150,0.10)' }]}
          transition={{
            delay: i * 60,
            duration: 900,
            loop: true,
            type: 'timing',
          }}
        >
          <View
            style={[
              styles.leftIcon,
              { backgroundColor: 'rgba(150,150,150,0.20)' },
            ]}
          />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.skLineWide} />
            <View style={styles.skLine} />
            <View style={[styles.skLine, { width: '30%' }]} />
          </View>
        </MotiView>
      ))}
    </View>
  );
}

/* ---------------- styles ---------------- */

const AV_SIZE = moderateScale(40);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 14,
    elevation: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },

  container: { flex: 1, paddingHorizontal: 16 },

  header: { paddingBottom: 4, paddingTop: 12 },

  leftIcon: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: AV_SIZE / 2,
    height: AV_SIZE,
    justifyContent: 'center',
    width: AV_SIZE,
  },

  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  skLine: {
    backgroundColor: 'rgba(150,150,150,0.25)',
    borderRadius: 6,
    height: 10,
    width: '55%',
  },
  skLineWide: {
    backgroundColor: 'rgba(150,150,150,0.25)',
    borderRadius: 6,
    height: 12,
    width: '85%',
  },
});
