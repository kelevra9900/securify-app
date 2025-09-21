// src/screens/CreateReportScreen.tsx
import type { Asset } from 'react-native-image-picker';
import type { RootState } from '@/store';

import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import { useCreateAlert } from '@/hooks/alerts/useCreateAlert';

import {
  CGInput,
  CSafeAreaView,
  PrimaryButton,
  TextArea,
  TextLabel,
} from '@/components/atoms';
import { ImagePickerInput } from '@/components/molecules';

import { useTheme } from '@/context/Theme';
import { tryGetCurrentLatLng } from '@/utils/location';
import { showToast } from '@/utils/toast';

type FormValues = {
  description: string;
  title: string;
};

const CreateReportScreen = () => {
  const { control, handleSubmit, reset } = useForm<FormValues>();
  const [image, setImage] = useState<Asset | null>(null);
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isPending, mutateAsync } = useCreateAlert();

  const envId = useSelector((s: RootState) => s.profile.environment?.id) as
    | number
    | undefined;

  const onSubmit = async (data: FormValues) => {
    const loc = await tryGetCurrentLatLng().catch(() => null);

    try {
      await mutateAsync(
        {
          description: data.description,
          environmentId: envId,
          image,
          latitude: loc?.latitude,
          longitude: loc?.longitude,
          title: data.title,
        },
        {
          onError: (error) => {
            showToast({
              title: 'Error al crear la alerta',
              variant: 'error',
            });
          },
          onSuccess: (data) => {
            showToast({
              description: 'Alerta creada correctamente',
              title: 'Listo',
              variant: 'success',
            });
            reset();
            setImage(null);
            navigation.goBack();
          },
        },
      );
    } catch {}
  };

  return (
    <CSafeAreaView
      edges={['top']}
      style={{ backgroundColor: theme.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ArrowLeft
            color={theme.textPrimary}
            onPress={navigation.goBack}
            size={24}
          />
          <TextLabel
            color={theme.textPrimary}
            style={styles.headerText}
            type="B16"
          >
            Crear reporte
          </TextLabel>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              shadowColor: theme.border,
            },
          ]}
        >
          <ImagePickerInput
            image={image}
            onImageSelected={setImage}
            onRemoveImage={() => setImage(null)}
          />

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CGInput
                error={error?.message}
                label="Título del reporte"
                onChangeText={onChange}
                placeholder="Ej. Puerta trasera sin candado"
                value={value}
              />
            )}
            rules={{ required: 'El título es obligatorio' }}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <TextArea
                error={error?.message}
                label="Descripción"
                numberOfLines={6}
                onChangeText={onChange}
                placeholder="Describe con detalle lo que ocurrió..."
                value={value}
              />
            )}
            rules={{ required: 'La descripción es obligatoria' }}
          />

          <PrimaryButton
            disabled={isPending}
            label={isPending ? 'Enviando...' : 'Enviar reporte'}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </ScrollView>
    </CSafeAreaView>
  );
};

export default CreateReportScreen;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    elevation: 2,
    gap: 16,
    padding: 20,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  container: { padding: 16 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  headerText: { fontWeight: '600' },
});
