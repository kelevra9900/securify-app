// src/screens/RoundWalkScreen.tsx
import type {RoundCheckpoint} from '@/types/rounds';

import {FlashList} from '@shopify/flash-list';
import {MotiView} from 'moti';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useRoute} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

import {useActiveRound,useRegisterCheckpoint,useStartRound} from '@/hooks/rounds';

import {
  CheckpointRow,
  CSafeAreaView,
  Header,
  ProgressPill,
  ScanModal,
} from '@/components/atoms';

import type {RouteProp} from '@react-navigation/native';
import type {Paths} from '@/navigation/paths';
import type {RootStackParamList} from '@/navigation/types';
import {addAppBreadcrumb} from '@/conf/sentry.conf';
import {darkTheme} from '@/assets/theme';
import {scanCheckpointTag} from '@/utils/nfc';
import {showErrorToast,showInfoToast,showSuccessToast} from '@/utils/toast';
import {getCurrentPositionNative} from '@/utils/tracking';
import {useNfcTracking} from '@/hooks/useNfcTracking';
import {useEndRoundWithTracking} from '@/hooks/useEndRoundWithTracking';
import {EndRoundDialog} from '@/components/molecules/EndRoundDialog';

export default function RoundWalkScreen() {
  const {top} = useSafeAreaInsets();
  const {params} = useRoute<RouteProp<RootStackParamList,Paths.Walk>>();
  const targetRoundId = params?.roundId;

  const {data: active,isPending,refetch} = useActiveRound();


  const {
    isPending: startingRound,
    mutateAsync: startRound,
  } = useStartRound();


  const startRequestedRef = useRef<null | number>(null);

  useEffect(() => {
    if (!targetRoundId) {
      return;
    }
    if (isPending || startingRound) {
      return;
    }
    if (active?.data?.id === targetRoundId) {
      return;
    }
    if (startRequestedRef.current === targetRoundId) {
      return;
    }

    startRequestedRef.current = targetRoundId;
    
    // Si ya hay una ronda activa en IN_PROGRESS, solo refetch (no llamar a /start)
    // Esto ocurre cuando se viene de un /restart
    if (active?.data?.status === 'IN_PROGRESS') {
      addAppBreadcrumb({
        category: 'rounds.refetch',
        data: {roundId: targetRoundId, currentActiveId: active.data.id},
        message: 'Ronda ya está en progreso, solo refetch',
      });
      refetch();
      return;
    }

    addAppBreadcrumb({
      category: 'rounds.start',
      data: {roundId: targetRoundId},
      message: 'Intentando iniciar ronda desde WalkScreen',
    });

    (async () => {
      try {
        await startRound({roundId: targetRoundId});
        await refetch();
      } catch (error) {
        startRequestedRef.current = null;
        showErrorToast(error);
        Sentry.captureException(error);
      }
    })();
  },[active?.data?.id,active?.data?.status,isPending,refetch,startRound,startingRound,targetRoundId]);

  const {isPending: registering,mutateAsync: registerCheckpoint} =
    useRegisterCheckpoint();
  const [scanning,setScanning] = useState<{cp: RoundCheckpoint; ready: boolean} | null>(
    null,
  );

  // Activar tracking de eventos NFC nativos
  useNfcTracking();

  const done = active?.data?.progress.done ?? 0;
  const total = active?.data?.progress.total ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const roundId = active?.data?.id;
  const roundName = active?.data?.name;
  const currentLap = active?.data?.progress.currentLap ?? 1;
  const completedLaps = active?.data?.progress.completedLaps ?? 0;
  const isCompleted = pct >= 100;

  // Hook para manejo de finalización de ronda con tracking
  const {
    handleEndRound,
    hideEndRoundDialog,
    isEndingRound,
    showDialog,
    showEndRoundDialog,
    willStopTracking,
  } = useEndRoundWithTracking({
    completionPercentage: pct,
    isCompleted,
    roundId,
    roundName,
  });

  // DEBUG: Removed console logs

  const nextCheckpoint = useMemo(() => {
    if (!active?.data?.checkpoints) {
      return undefined;
    }
    return active.data?.checkpoints.find((c) => !c.done);
  },[active?.data?.checkpoints]);

  // Detectar cuando se completa una vuelta
  useEffect(() => {
    if (!active?.data) {
      return;
    }

    const {progress} = active.data;
    const isLapCompleted = progress.done === progress.total && progress.done > 0;

    if (isLapCompleted && currentLap > 1) {
      // Vuelta completada (no es la primera)
      showSuccessToast(
        `🎉 ¡Vuelta ${currentLap} completada! Puedes continuar con otra vuelta o finalizar la ronda.`,
      );
    } else if (isLapCompleted && currentLap === 1) {
      // Primera vuelta completada
      showSuccessToast(
        `🎉 ¡Todos los checkpoints completados! Puedes hacer otra vuelta escaneando nuevamente o finalizar la ronda.`,
      );
    }
  },[active?.data,currentLap]);

  const onScanFor = useCallback(
    async (cp: RoundCheckpoint) => {
      if (registering) {
        showInfoToast('Estamos registrando un checkpoint, espera un momento.');
        return;
      }
      if (!roundId) {
        showErrorToast('No hay una ronda activa para registrar.');
        return;
      }

      addAppBreadcrumb({
        category: 'rounds.checkpoint.scan',
        data: {
          checkpointId: cp.id,
          checkpointName: cp.name,
          roundId,
          roundName,
        },
        message: 'Inicio de registro de checkpoint',
      });

      let currentPosition:
        | {latitude: number; longitude: number}
        | null = null;
      let distanceMeters: null | number = null;
      let tagResult: Awaited<ReturnType<typeof scanCheckpointTag>> | null = null;
      let parsedPayload: CheckpointTagPayload | null = null;

      try {
        // 1) Pide ubicación y valida geocerca
        const pos = await getCurrentPositionNative({
          enableHighAccuracy: true,
          timeoutMs: 8000,
        });
        currentPosition = pos;
        const dist = haversineMeters(
          pos.latitude,
          pos.longitude,
          cp.latitude,
          cp.longitude,
        );
        distanceMeters = dist;

        // 2) Abre modal escaneo en estado "preparando"
        setScanning({cp,ready: false});

        // Delay para que el modal se muestre antes de activar NFC
        await new Promise((resolve) => setTimeout(resolve,500));

        // 3) Marca como listo para escanear
        setScanning({cp,ready: true});

        addAppBreadcrumb({
          category: 'nfc.scan',
          data: {checkpointId: cp.id,timeout: 10_000},
          message: 'ReaderMode activándose',
        });

        // 4) Lee NFC
        // eslint-disable-next-line no-console
        console.log('🔵 [NFC] ReaderMode activado - Usuario puede acercar tag');
        const tag = await scanCheckpointTag(10_000);

        // eslint-disable-next-line no-console
        console.log('✅ [NFC] Tag detectado - UID:',tag.uid);
        addAppBreadcrumb({
          category: 'nfc.scan',
          data: {
            hasNdef: Boolean(tag.ndef),
            tech: tag.tech,
            uid: tag.uid,
          },
          message: 'Tag NFC leído exitosamente',
        });
        tagResult = tag;

        // 🔎 CORREGIR: Parsear el payload corrigiendo el prefijo 'ication/json'
        let sanitizedPayload = tag.ndef?.payload;
        if (sanitizedPayload && typeof sanitizedPayload === 'string') {
          // Detectar si accidentalmente empieza con 'ication/json' (falta 'appl')
          const garbagePrefix = 'ication/json';
          if (sanitizedPayload.startsWith(garbagePrefix)) {
            // Eliminar el prefijo basura
            sanitizedPayload = sanitizedPayload.slice(garbagePrefix.length);
          }
          // También puede venir como 'application/json' y luego el json --> procesar el mismo
          const applicationPrefix = 'application/json';
          if (sanitizedPayload.startsWith(applicationPrefix)) {
            sanitizedPayload = sanitizedPayload.slice(applicationPrefix.length);
          }
          // Finalmente, recortar espacios al inicio (por si acaso)
          sanitizedPayload = sanitizedPayload.trim();
        }

        // Lint fix: remove console logs, fix parseCheckpointPayload argument type
        // Ensure the payload passed is always a string (or empty string fallback)
        const payload = parseCheckpointPayload(
          (typeof sanitizedPayload === 'string' ? sanitizedPayload : (tag.ndef?.payload ?? ''))
        );

        if (!payload) {
          throw new Error('El tag NFC no contiene datos válidos.');
        }
        parsedPayload = payload;
        if (payload.roundId && payload.roundId !== roundId) {
          throw new Error('El tag NFC no pertenece a esta ronda.');
        }
        if (payload.id !== cp.id) {
          throw new Error('El tag leído no corresponde a este checkpoint.');
        }

        const effectiveRoundId = payload.roundId ?? roundId;
        if (!effectiveRoundId) {
          throw new Error('No se pudo determinar la ronda para registrar el checkpoint.');
        }

        // 4) Registra el checkpoint con datos del NFC y GPS
        // Nota: El backend acepta lat/lon pero actualmente no los guarda
        // Solo registra checkpointId, guardId, roundId y timestamp
        await registerCheckpoint({
          checkpointId: payload.id,
          latitude: currentPosition?.latitude, // Coordenadas GPS del dispositivo
          longitude: currentPosition?.longitude,
          roundId: effectiveRoundId,
        },{
          onError: (error) => {
            showErrorToast(error);
          },
          onSuccess: () => {
            showSuccessToast('Checkpoint registrado correctamente con NFC');
          }
        });
        // La query se invalida automáticamente en el hook
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console
        console.error('❌ [NFC] Error:',errorMessage);

        addAppBreadcrumb({
          category: 'rounds.checkpoint.scan',
          data: {
            checkpointId: cp.id,
            distanceMeters,
            errorMessage,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            hasTagResult: Boolean(tagResult),
            roundId,
            roundName,
          },
          level: 'error',
          message: 'Fallo al registrar checkpoint',
        });

        Sentry.withScope((scope) => {
          scope.setLevel('error');
          scope.setTag('feature','round_walk_register_checkpoint');
          scope.setFingerprint([
            'round-walk',
            'register-checkpoint',
            String(roundId ?? 'unknown'),
            String(cp.id),
          ]);
          scope.setContext('checkpoint',{
            done: Boolean(cp.done),
            id: cp.id,
            latitude: cp.latitude,
            longitude: cp.longitude,
            name: cp.name,
          });
          if (roundId) {
            scope.setContext('round',{
              id: roundId,
              name: roundName,
            });
          }
          if (currentPosition) {
            scope.setContext('device_position',{
              latitude: currentPosition.latitude,
              longitude: currentPosition.longitude,
            });
          }
          scope.setExtras({
            distanceMeters,
            nfcPayloadRaw: tagResult?.ndef?.payload,
            nfcTagTech: tagResult?.tech,
            nfcTagUid: tagResult?.uid,
            parsedPayload,
          });
          Sentry.captureException(error);
        });
        // toast?.error?.(error?.message ?? 'Error al registrar');
        const message =
          error instanceof Error ? error.message : 'Error al registrar';
        showErrorToast(message);
      } finally {
        setScanning(null);
      }
    },
    [registerCheckpoint,registering,roundId,roundName],
  );

  if ((isPending || startingRound) && !active?.data) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={{backgroundColor: darkTheme.background,flex: 1}}
      >
        <Header title="Caminata" />
        <View style={styles.skeletonContainer}>
          {Array.from({length: 6}).map((_,index) => (
            <View key={index} style={styles.skeletonItem}>
              <View style={styles.skeletonCircle} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine,{marginTop: 8,width: '60%'}]} />
              </View>
            </View>
          ))}
        </View>
      </CSafeAreaView>
    );
  }

  if (!active?.data) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={{backgroundColor: darkTheme.background,flex: 1}}
      >
        <Header title="Caminata" />
        <View style={styles.center}>
          <Text style={styles.text}>No tienes una ronda en curso.</Text>
          <Text onPress={() => refetch()} style={styles.link}>
            Actualizar
          </Text>
        </View>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView
      edges={['top']}
      style={{backgroundColor: darkTheme.background,flex: 1}}
    >
      <Header title={active.data?.name ?? ''} />

      {/* Header de progreso con Moti */}
      <MotiView
        animate={{opacity: 1,translateY: 0}}
        from={{opacity: 0,translateY: -8}}
        style={[styles.headerBox,{marginTop: 8 + top}]}
        transition={{duration: 250,type: 'timing'}}
      >
        <View style={{flex: 1}}>
          <Text numberOfLines={1} style={styles.hTitle}>
            {currentLap > 1 ? `Vuelta ${currentLap}` : 'Ronda en curso'}
          </Text>
          <Text style={styles.hMeta}>
            {done}/{total} completados · {pct}%
            {completedLaps > 0 && ` · ${completedLaps} ${completedLaps === 1 ? 'vuelta' : 'vueltas'} completadas`}
          </Text>
        </View>
        <View style={{alignItems: 'flex-end',gap: 8}}>
          <ProgressPill pct={pct} />

          {/* Botón de finalizar ronda */}
          <TouchableOpacity
            disabled={isEndingRound}
            onPress={showEndRoundDialog}
            style={[
              styles.endButton,
              {
                backgroundColor: isCompleted ? '#10B981' : '#F59E0B',
                opacity: isEndingRound ? 0.5 : 1
              }
            ]}
          >
            {isEndingRound ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.endButtonText}>
                {isCompleted ? '✅ Finalizar' : '⏹️ Terminar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </MotiView>

      {/* Lista de checkpoints */}
      <FlashList
        contentContainerStyle={styles.list}
        data={active.data?.checkpoints}
        ItemSeparatorComponent={() => <View style={{height: 10}} />}
        keyExtractor={(c) => String(c.id)}
        renderItem={({item}) => (
          <CheckpointRow
            isNext={item.id === nextCheckpoint?.id}
            item={item}
            onPress={() => onScanFor(item)}
          />
        )}
      />

      {/* Modal de escaneo */}
      <ScanModal
        isReady={scanning?.ready ?? false}
        name={scanning?.cp.name ?? ''}
        onCancel={() => setScanning(null)}
        visible={!!scanning}
      />

      {/* Diálogo de finalización de ronda */}
      <EndRoundDialog
        completionPercentage={pct}
        isCompleted={isCompleted}
        isLoading={isEndingRound}
        onCancel={hideEndRoundDialog}
        onConfirm={handleEndRound}
        roundName={roundName}
        visible={showDialog}
        willStopTracking={willStopTracking}
      />
    </CSafeAreaView>
  );
}

/* ───────────────────────────── Helpers ───────────────────────────── */

type CheckpointTagPayload = {
  alias?: string;
  id: number;
  latitude?: number;
  longitude?: number;
  name?: string;
  roundId?: number;
};

function parseCheckpointPayload(cleanJson: string): CheckpointTagPayload | null {
  try {
    const parsed = JSON.parse(cleanJson) as Record<string,unknown>;


    const toNum = (v: unknown): number | undefined => {
      if (typeof v === 'number' && Number.isFinite(v)) {return v;}
      if (typeof v === 'string') {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      }
      return undefined;
    };

    const id = toNum(parsed.id) ?? toNum(parsed.checkpointId);
    if (typeof id !== 'number') {return null;}

    const roundId = toNum(parsed.roundId);
    const latitude = toNum(parsed.latitude);
    const longitude = toNum(parsed.longitude);
    const name =
      typeof parsed.name === 'string'
        ? parsed.name
        : typeof parsed.alias === 'string'
          ? parsed.alias
          : undefined;

    return {
      alias: typeof parsed.alias === 'string' ? parsed.alias : undefined,
      id,
      latitude,
      longitude,
      name,
      roundId,
    };
  } catch {
    addAppBreadcrumb({
      category: 'nfc.parse',
      data: {cleanPreview: cleanJson?.slice(0,200)},
      level: 'warning',
      message: 'JSON inválido en NDEF'
    });
    return null;
  }
}


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
  const c = 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1 - a));
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

  endButton: {
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 80,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  endButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  hMeta: {color: darkTheme.textSecondary,fontSize: 12,marginTop: 2},
  hTitle: {color: darkTheme.textPrimary,fontSize: 14,fontWeight: '700'},

  link: {
    color: darkTheme.highlight,
    marginTop: 8,
    textDecorationLine: 'underline',
  },

  list: {padding: 16},

  skeletonCircle: {
    backgroundColor: darkTheme.border,
    borderRadius: 20,
    height: 40,
    width: 40,
  },

  skeletonContainer: {
    padding: 16,
  },

  skeletonContent: {
    flex: 1,
  },

  skeletonItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },

  skeletonLine: {
    backgroundColor: darkTheme.border,
    borderRadius: 8,
    height: 16,
  },

  text: {color: darkTheme.textPrimary,marginTop: 8},
});
