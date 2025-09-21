/* eslint-disable @typescript-eslint/no-explicit-any */
// src/screens/ReportsScreen.tsx
import type { RootScreenProps } from '@/navigation/types';

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useSummaryReports } from '@/hooks/alerts/useSummaryReports';
import { Paths } from '@/navigation/paths';

import { CSafeAreaView, PrimaryButton, TextLabel } from '@/components/atoms';
import { ReportsListCard, ReportsSummaryCard } from '@/components/molecules';
import {
  ReportsListSkeleton,
  ReportsSummarySkeleton,
} from '@/components/molecules/ReportSkeleton';

import { useTheme } from '@/context/Theme';
import { mapCountersToCard, mapRecentToCardItems } from '@/utils/alerts';

type Props = { navigation: RootScreenProps<Paths.Reports>['navigation'] };

const ReportsScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const { data, error, isError, isPending } = useSummaryReports();

  const summary = useMemo(
    () =>
      mapCountersToCard(
        data?.counters ?? { created: 0, rejected: 0, resolved: 0 },
      ),
    [data],
  );
  const recentReports = useMemo(
    () => mapRecentToCardItems(data?.recent ?? [], 'es-MX'),
    [data],
  );

  const handlePressReport = (id: string) => {
    navigation.navigate(Paths.AlertDetail, { id: Number(id) });
  };

  const handleCreateReport = () => {
    navigation.navigate(Paths.CreateReport);
  };

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: theme.background }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {isPending ? (
            <>
              <ReportsSummarySkeleton cardBg={theme.cardBackground} />
              <ReportsListSkeleton cardBg={theme.cardBackground} count={3} />
            </>
          ) : isError ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <TextLabel color={theme.textPrimary} type="R14">
                {(error as Error)?.message || 'No se pudo cargar el resumen'}
              </TextLabel>
            </View>
          ) : (
            <>
              <ReportsSummaryCard
                open={summary.open}
                rejected={summary.rejected}
                resolved={summary.resolved}
                total={summary.total}
              />
              <ReportsListCard
                onPressReport={handlePressReport}
                reports={recentReports as any}
              />
            </>
          )}

          <PrimaryButton label="Crear reporte" onPress={handleCreateReport} />
        </View>
      </ScrollView>
    </CSafeAreaView>
  );
};

export default ReportsScreen;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  content: {
    gap: 16,
  },
});
