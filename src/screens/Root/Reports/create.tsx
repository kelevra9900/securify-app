import React,{useState} from 'react';
import {ScrollView,StyleSheet,View} from 'react-native';
import {Controller,useForm} from 'react-hook-form';
import {useNavigation} from '@react-navigation/native';
import {ArrowLeft} from 'lucide-react-native';
import type {Asset} from 'react-native-image-picker';

import {
	CGInput,
	CSafeAreaView,
	PrimaryButton,
	TextArea,
	TextLabel,
} from '@/components/atoms';
import {ImagePickerInput} from '@/components/molecules';
import {useTheme} from '@/context/Theme';

type FormValues = {
	description: string;
	title: string;
};

const CreateReportScreen = () => {
	const {control,handleSubmit} = useForm<FormValues>();
	const [image,setImage] = useState<Asset | null>(null);
	const {theme} = useTheme();
	const navigation = useNavigation();

	const onSubmit = (data: FormValues) => {
		console.log('Formulario enviado:',{
			...data,
			image,
		});
	};

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
			<ScrollView contentContainerStyle={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<ArrowLeft color={theme.textPrimary} onPress={navigation.goBack} size={24} />
					<TextLabel color={theme.textPrimary} style={styles.headerText} type="B16">
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
						render={({field: {onChange,value},fieldState: {error}}) => (
							<CGInput
								error={error?.message}
								label="Título del reporte"
								onChangeText={onChange}
								placeholder="Ej. Puerta trasera sin candado"
								value={value}
							/>
						)}
						rules={{required: 'El título es obligatorio'}}
					/>

					<Controller
						control={control}
						name="description"
						render={({field: {onChange,value},fieldState: {error}}) => (
							<TextArea
								error={error?.message}
								label="Descripción"
								numberOfLines={6}
								onChangeText={onChange}
								placeholder="Describe con detalle lo que ocurrió..."
								value={value}
							/>
						)}
						rules={{required: 'La descripción es obligatoria'}}
					/>

					<PrimaryButton label="Enviar reporte" onPress={handleSubmit(onSubmit)} />
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
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.08,
		shadowRadius: 4,
	},
	container: {
		padding: 16,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
		marginBottom: 16,
	},
	headerText: {
		fontWeight: '600',
	},
});
