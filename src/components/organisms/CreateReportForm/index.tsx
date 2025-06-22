import React,{useState} from 'react';
import {StyleSheet,View} from 'react-native';

import {CGInput,PrimaryButton,TextArea,TextLabel} from '@/components/atoms';
import {useTheme} from '@/context/Theme';

interface Props {
	isLoading?: boolean;
	onSubmit: (data: {content: string; title: string;}) => void;
}

export const CreateReportForm = ({isLoading = false,onSubmit}: Props) => {
	const {theme} = useTheme();

	const [title,setTitle] = useState('');
	const [content,setContent] = useState('');

	const isValid = title.trim().length > 0 && content.trim().length > 0;

	return (
		<View style={[styles.container,{backgroundColor: theme.background}]}>
			<TextLabel color={theme.textPrimary} style={styles.header} type="B20">
				Crear reporte
			</TextLabel>

			<CGInput
				label="Título del reporte"
				onChangeText={setTitle}
				placeholder="Ej. Persona sospechosa en el perímetro"
				value={title}
			/>

			<TextArea
				label="Descripción"
				multiline
				numberOfLines={6}
				onChangeText={setContent}
				placeholder="Describe lo sucedido con el mayor detalle posible."
				value={content}
			/>

			<PrimaryButton
				disabled={!isValid || isLoading}
				label="Enviar reporte"
				loading={isLoading}
				onPress={() => onSubmit({content,title})}
				style={styles.submitButton}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		gap: 16,
		padding: 16,
	},
	header: {
		marginBottom: 8,
	},
	submitButton: {
		marginTop: 16,
	},
});
