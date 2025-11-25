import React from 'react';
import {
	Dimensions,
	Modal,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

import {darkTheme} from '@/assets/theme';

type ActiveRoundModalProps = {
	activeName: string;
	activeProgress: string;
	onCancel: () => void;
	onContinue: () => void;
	visible: boolean;
};

export const ActiveRoundModal: React.FC<ActiveRoundModalProps> = ({
	activeName,
	activeProgress,
	onCancel,
	onContinue,
	visible,
}) => {
	return (
		<Modal
			animationType="slide"
			statusBarTranslucent
			transparent
			visible={visible}
		>
			<View style={styles.overlay}>
				<View style={styles.modal}>
					{/* Header con emoji */}
					<View style={styles.header}>
						<Text style={styles.emoji}>🚶‍♂️</Text>
						<Text style={styles.title}>Caminata en curso</Text>
					</View>

					{/* Contenido */}
					<View style={styles.content}>
						<Text style={styles.message}>
							Ya tienes una caminata activa:
						</Text>

						<View style={styles.activeRoundInfo}>
							<Text style={styles.roundName}>"{activeName}"</Text>
							<Text style={styles.progress}>{activeProgress}</Text>
						</View>

						<Text style={styles.warning}>
							Debes terminarla antes de iniciar otra caminata.
						</Text>
					</View>

					{/* Botones */}
					<View style={styles.buttons}>
						<TouchableOpacity
							activeOpacity={0.8}
							onPress={onCancel}
							style={[styles.button,styles.cancelButton]}
						>
							<Text style={styles.cancelButtonText}>Entendido</Text>
						</TouchableOpacity>

						<TouchableOpacity
							activeOpacity={0.8}
							onPress={onContinue}
							style={[styles.button,styles.continueButton]}
						>
							<Text style={styles.continueButtonText}>Continuar</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default ActiveRoundModal;

const {width} = Dimensions.get('window');

const styles = StyleSheet.create({
	activeRoundInfo: {
		alignItems: 'center',
		backgroundColor: darkTheme.cardBackground,
		borderRadius: 12,
		marginVertical: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	button: {
		alignItems: 'center',
		borderRadius: 12,
		flex: 1,
		justifyContent: 'center',
		paddingVertical: 14,
		textAlign: 'center',
	},
	buttons: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 24,
	},
	cancelButton: {
		backgroundColor: darkTheme.border,
	},
	cancelButtonText: {
		color: darkTheme.textSecondary,
		fontSize: 16,
		fontWeight: '600',
	},
	content: {
		marginTop: 8,
	},
	continueButton: {
		backgroundColor: darkTheme.highlight,
	},
	continueButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '600',
	},
	emoji: {
		fontSize: 32,
		marginBottom: 8,
	},
	header: {
		alignItems: 'center',
	},
	message: {
		color: darkTheme.textPrimary,
		fontSize: 16,
		textAlign: 'center',
	},
	modal: {
		backgroundColor: darkTheme.background,
		borderRadius: 20,
		margin: 20,
		maxWidth: width - 40,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: {
			height: 10,
			width: 0,
		},
		shadowOpacity: 0.3,
		shadowRadius: 20,
		width: width - 40,
	},
	overlay: {
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		flex: 1,
		justifyContent: 'center',
	},
	progress: {
		color: darkTheme.highlight,
		fontSize: 14,
		fontWeight: '500',
		marginTop: 4,
	},
	roundName: {
		color: darkTheme.textPrimary,
		fontSize: 18,
		fontWeight: '700',
		textAlign: 'center',
	},
	title: {
		color: darkTheme.textPrimary,
		fontSize: 22,
		fontWeight: '700',
		textAlign: 'center',
	},
	warning: {
		color: darkTheme.textSecondary,
		fontSize: 14,
		textAlign: 'center',
	},
});
