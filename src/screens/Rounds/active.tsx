// src/screens/RoundActiveScreen.tsx
import {useNavigation,useRoute} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import React,{useMemo} from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {useEndRound,useLogCheckpoint,useRoundDetail} from '@/hooks/rounds';

import {CSafeAreaView,Header} from '@/components/atoms';

import {darkTheme} from '@/assets/theme';

export default function RoundActiveScreen() {
  const nav = useNavigation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const roundId = route.params?.roundId as number;

  const {data,isFetching,isLoading,refetch} = useRoundDetail(roundId);
  const end = useEndRound();
  const log = useLogCheckpoint();

  const completedIds = useMemo(
    () => new Set((data?.logs ?? []).map((l) => l.checkpointId)),
    [data],
  );

  const nextCp = useMemo(
    () => data?.checkpoints.find((c) => !completedIds.has(c.id)),
    [data,completedIds],
  );

  const onLog = async (cpId: number) => {
    // TODO: obtén location real del dispositivo si usarás método 'gps'
    await log.mutateAsync({body: {method: 'gps'},cpId,roundId});
    refetch();
  };

  const onEnd = () => {
    Alert.alert('Terminar caminata','¿Seguro que deseas terminar?',[
      {style: 'cancel',text: 'Cancelar'},
      {
        onPress: async () => {
          await end.mutateAsync({roundId});
          nav.goBack();
        },
        style: 'destructive',
        text: 'Terminar',
      },
    ]);
  };

  if (isLoading || !data) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={{backgroundColor: darkTheme.background}}
      >
        <Header title="Caminata en curso" />
        <ActivityIndicator color={darkTheme.highlight} style={styles.center} />
      </CSafeAreaView>
    );
  }

  const completed = completedIds.size;
  const total = data.checkpoints.length;

  return (
    <CSafeAreaView
      edges={['top']}
      style={{backgroundColor: darkTheme.background,flex: 1}}
    >
      <Header
        rightSlot={
          <Text
            onPress={onEnd}
            style={{color: darkTheme.error,fontWeight: '600'}}
          >
            Terminar
          </Text>
        }
        title="Caminata en curso"
      />

      <View style={styles.headerBox}>
        <Text style={styles.progressText}>
          {completed}/{total} completados
        </Text>
        <Text style={styles.meta}>
          {isFetching
            ? 'Actualizando…'
            : data.remainingMinutes != null
              ? `Restan ${data.remainingMinutes} min`
              : '—'}
        </Text>
        {nextCp && (
          <TouchableOpacity
            onPress={() => onLog(nextCp.id)}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>
              Registrar siguiente: {nextCp.location}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlashList
        contentContainerStyle={{padding: 16}}
        data={data.checkpoints}
        ItemSeparatorComponent={() => <View style={{height: 10}} />}
        keyExtractor={(c) => String(c.id)}
        renderItem={({item}) => {
          const done = completedIds.has(item.id);
          return (
            <View style={[styles.cpRow,done && styles.cpDone]}>
              <Text numberOfLines={1} style={styles.cpName}>
                {item.location}
              </Text>
              <Text style={styles.cpMeta}>
                {done ? 'Registrado' : 'Pendiente'}
              </Text>
              {!done && (
                <TouchableOpacity
                  onPress={() => onLog(item.id)}
                  style={styles.smallBtn}
                >
                  <Text style={styles.smallBtnText}>Registrar</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </CSafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: darkTheme.background,
    flex: 1,
    justifyContent: 'center',
  },
  cpDone: {opacity: 0.6},
  cpMeta: {color: darkTheme.textSecondary,fontSize: 12},
  cpName: {color: darkTheme.textPrimary,fontWeight: '600'},
  cpRow: {
    backgroundColor: darkTheme.cardBackground,
    borderColor: darkTheme.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    padding: 12,
  },
  headerBox: {gap: 8,padding: 16},
  meta: {color: darkTheme.textSecondary},
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: darkTheme.highlight,
    borderRadius: 10,
    marginTop: 8,
    padding: 12,
  },
  primaryBtnText: {color: '#fff',fontWeight: '700'},
  progressText: {
    color: darkTheme.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  smallBtn: {
    alignSelf: 'flex-start',
    backgroundColor: darkTheme.highlight,
    borderRadius: 8,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnText: {color: '#fff',fontSize: 12,fontWeight: '600'},
});
