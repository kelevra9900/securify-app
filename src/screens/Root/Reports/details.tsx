/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Clock, ImageOff, MapPin, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlertDetail } from '@/hooks/alerts/useAlertDetail';

import { CSafeAreaView, TextLabel } from '@/components/atoms';

import { moderateScale } from '@/constants';
import { useTheme } from '@/context/Theme';

type RouteParams = { id: number };

function fullName(u?: { firstName?: null | string; lastName?: null | string }) {
  const first = u?.firstName?.trim() ?? '';
  const last = u?.lastName?.trim() ?? '';
  return [first, last].filter(Boolean).join(' ') || 'Usuario';
}

function formatWhen(iso?: string, locale: string = 'es-MX') {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function statusChip(status?: 'CREATED' | 'REJECTED' | 'SOLVED') {
  switch (status) {
    case 'REJECTED':
      return { bg: '#ef444420', fg: '#ef4444', label: 'Rechazado' };
    case 'SOLVED':
      return { bg: '#16a34a20', fg: '#16a34a', label: 'Resuelto' };
    default:
      return { bg: '#f59e0b20', fg: '#f59e0b', label: 'Creado' };
  }
}

export default function ReportDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute() as unknown as { params: RouteParams };
  const alertId = route?.params?.id;

  const { data, error, isError, isPending } = useAlertDetail(alertId);

  const chip = useMemo(() => statusChip(data?.status), [data?.status]);
  const authorName = useMemo(() => fullName(data?.user), [data?.user]);
  const when = useMemo(() => formatWhen(data?.createdAt), [data?.createdAt]);
  const hasPhoto = !!data?.image;

  const [viewerOpen, setViewerOpen] = useState(false);

  const openMaps = () => {
    const lat = data?.location?.lat;
    const lng = data?.location?.lng;
    if (lat == null || lng == null) {
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  };

  // Loading
  if (isPending) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={{ backgroundColor: theme.background }}
      >
        <View
          style={[styles.header, { borderBottomColor: theme.cardBackground }]}
        >
          <ArrowLeft
            color={theme.textPrimary}
            onPress={navigation.goBack as any}
            size={24}
          />
          <TextLabel
            color={theme.textPrimary}
            style={{ marginLeft: 12 }}
            type="B16"
          >
            Reporte
          </TextLabel>
        </View>
        <View style={{ flex: 1, gap: 16, padding: 20 }}>
          <View
            style={[styles.card, { backgroundColor: theme.cardBackground }]}
          >
            <View
              style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}
            >
              <View
                style={[styles.avatar, { backgroundColor: theme.border }]}
              />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={[styles.skelLine, { width: '55%' }]} />
                <View style={[styles.skelLine, { width: '35%' }]} />
              </View>
            </View>
            <View
              style={[
                styles.skelLine,
                { height: 18, marginTop: 16, width: '80%' },
              ]}
            />
            <View style={[styles.skelBox, { marginTop: 16 }]} />
          </View>
          <View
            style={[styles.card, { backgroundColor: theme.cardBackground }]}
          >
            <View style={[styles.skelLine, { width: '40%' }]} />
            <View style={[styles.skelLine, { marginTop: 8, width: '60%' }]} />
          </View>
        </View>
      </CSafeAreaView>
    );
  }

  // Error
  if (isError || !data) {
    return (
      <CSafeAreaView
        edges={['top']}
        style={{ backgroundColor: theme.background }}
      >
        <View
          style={[styles.header, { borderBottomColor: theme.cardBackground }]}
        >
          <ArrowLeft
            color={theme.textPrimary}
            onPress={navigation.goBack as any}
            size={24}
          />
          <TextLabel
            color={theme.textPrimary}
            style={{ marginLeft: 12 }}
            type="B16"
          >
            Reporte
          </TextLabel>
        </View>
        <View
          style={{
            alignItems: 'center',
            flex: 1,
            gap: 8,
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <TextLabel color={theme.textPrimary} type="B16">
            No se pudo cargar el reporte
          </TextLabel>
          <TextLabel color={theme.textSecondary} type="R12">
            {(error as Error)?.message || 'Inténtalo más tarde'}
          </TextLabel>
        </View>
      </CSafeAreaView>
    );
  }

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: theme.background }}
    >
      {/* HEADER */}
      <View
        style={[styles.header, { borderBottomColor: theme.cardBackground }]}
      >
        <ArrowLeft
          color={theme.textPrimary}
          onPress={navigation.goBack as any}
          size={24}
        />
        <TextLabel
          color={theme.textPrimary}
          style={{ marginLeft: 12 }}
          type="B16"
        >
          Reporte
        </TextLabel>
      </View>

      <View
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {/* TARJETA PRINCIPAL */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          {/* Autor + fecha + estado */}
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            {/* Avatar */}
            {data.user?.image ? (
              <Image source={{ uri: data.user.image }} style={styles.avatar} />
            ) : (
              <View
                style={[styles.avatar, { backgroundColor: theme.border }]}
              />
            )}

            <View style={{ flex: 1, marginLeft: 12 }}>
              <TextLabel color={theme.textPrimary} type="B14">
                {authorName}
              </TextLabel>
              <View
                style={{
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Clock color={theme.textSecondary} size={14} />
                <TextLabel color={theme.textSecondary} type="R12">
                  {when}
                </TextLabel>
              </View>
            </View>

            <View style={[styles.chip, { backgroundColor: chip.bg }]}>
              <TextLabel color={chip.fg} type="B12">
                {chip.label}
              </TextLabel>
            </View>
          </View>

          {/* Título */}
          <TextLabel
            color={theme.textPrimary}
            style={{ marginTop: 12 }}
            type="B18"
          >
            {data.title}
          </TextLabel>

          {/* Imagen */}
          <Pressable
            disabled={!hasPhoto}
            onPress={() => setViewerOpen(true)}
            style={{ marginTop: 14 }}
          >
            {hasPhoto ? (
              <Image
                resizeMode="cover"
                source={{ uri: data.image as string }}
                style={styles.photo}
              />
            ) : (
              <View
                style={[
                  styles.photo,
                  {
                    alignItems: 'center',
                    backgroundColor: theme.border,
                    justifyContent: 'center',
                  },
                ]}
              >
                <ImageOff color={theme.textSecondary} size={28} />
                <TextLabel
                  color={theme.textSecondary}
                  style={{ marginTop: 6 }}
                  type="R12"
                >
                  Sin imagen
                </TextLabel>
              </View>
            )}
          </Pressable>

          {/* Ubicación */}
          {data.location?.lat != null && data.location?.lng != null && (
            <Pressable
              onPress={openMaps}
              style={[
                styles.locationRow,
                { backgroundColor: theme.background },
              ]}
            >
              <MapPin color={theme.textPrimary} size={18} />
              <TextLabel
                color={theme.textPrimary}
                style={{ marginLeft: 8 }}
                type="R14"
              >
                Abrir en Google Maps
              </TextLabel>
            </Pressable>
          )}

          {/* Descripción (si la manejas) */}
          {data.description ? (
            <View style={{ marginTop: 12 }}>
              <TextLabel color={theme.textPrimary} type="B14">
                Descripción
              </TextLabel>
              <TextLabel
                color={theme.textSecondary}
                style={{ marginTop: 6 }}
                type="R14"
              >
                {data.description}
              </TextLabel>
            </View>
          ) : null}
        </View>

        {/* Metadatos opcionales */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <TextLabel color={theme.textPrimary} type="B14">
            ID
          </TextLabel>
          <TextLabel
            color={theme.textSecondary}
            style={{ marginTop: 4 }}
            type="R14"
          >
            # {data.id}
          </TextLabel>
        </View>
      </View>

      {/* IMAGE VIEWER */}
      <Modal
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
        transparent
        visible={viewerOpen}
      >
        <View style={styles.viewerBackdrop}>
          <Pressable
            onPress={() => setViewerOpen(false)}
            style={styles.viewerClose}
          >
            <X color="#fff" size={22} />
          </Pressable>
          {hasPhoto && (
            <Image
              resizeMode="contain"
              source={{ uri: data.image as string }}
              style={styles.viewerImage}
            />
          )}
        </View>
      </Modal>
    </CSafeAreaView>
  );
}

const AVATAR = 44;

const styles = StyleSheet.create({
  avatar: {
    borderRadius: AVATAR / 2,
    height: AVATAR,
    width: AVATAR,
  },
  card: {
    borderRadius: 16,
    elevation: 1,
    gap: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  container: { flex: 1, padding: 16 },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 16,
  },
  locationRow: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  photo: {
    borderRadius: 12,
    height: 190,
    width: '100%',
  },
  // skeleton bits
  skelBox: {
    backgroundColor: 'rgba(150,150,150,0.15)',
    borderRadius: 12,
    height: 160,
  },
  skelLine: {
    backgroundColor: 'rgba(150,150,150,0.15)',
    borderRadius: 6,
    height: 12,
  },
  // viewer
  viewerBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.92)',
    flex: 1,
    justifyContent: 'center',
  },
  viewerClose: {
    padding: 8,
    position: 'absolute',
    right: moderateScale(20),
    top: moderateScale(20),
  },
  viewerImage: {
    height: '80%',
    width: '100%',
  },
});
