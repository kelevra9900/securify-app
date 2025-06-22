import React from 'react';
import {Image,StyleSheet,Text,View} from 'react-native';

import {useTheme} from '@/context/Theme';

const mockUser = {
	avatar: 'https://trablisa-assets.s3.eu-south-2.amazonaws.com/roger.jpeg',
	name: 'Roger Torres', // nombre largo para pruebas
	position: 'Guardia de Seguridad',
	sector: 'Terminal Internacional - Zona de Carga y Control de Acceso Principal',
	shift: '07:00 - 15:00',
	socketStatus: 'connected', // 'connected' | 'connecting' | 'disconnected'
	status: 'Activo',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const socketColors: any = {
	connected: '#4CAF50',
	connecting: '#FFC107',
	disconnected: '#F44336',
};

const UserStatusCard = () => {
	const {theme} = useTheme();

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.avatarWrapper}>
				<Image source={{uri: mockUser.avatar}} style={styles.avatar} />
				<View
					style={[
						styles.socketBadge,
						{backgroundColor: socketColors[mockUser.socketStatus] || theme.border},
					]}
				/>
			</View>

			<View style={styles.info}>
				<Text numberOfLines={1} style={[styles.name,{color: theme.textPrimary}]}>
					{mockUser.name}
				</Text>
				<Text numberOfLines={1} style={[styles.position,{color: theme.textSecondary}]}>
					{mockUser.position}
				</Text>

				<View style={styles.extraInfo}>
					<Text style={[styles.label,{color: theme.textSecondary}]}>Turno:</Text>
					<Text numberOfLines={1} style={[styles.value,{color: theme.textPrimary}]}>
						{mockUser.shift}
					</Text>

					<Text style={[styles.label,{color: theme.textSecondary}]}>Sector:</Text>
					<Text numberOfLines={2} style={[styles.value,{color: theme.textPrimary}]}>
						{mockUser.sector}
					</Text>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	avatar: {
		borderRadius: 28,
		height: 56,
		width: 56,
	},
	avatarWrapper: {
		position: 'relative',
	},
	card: {
		alignItems: 'flex-start',
		borderRadius: 16,
		elevation: 2,
		flexDirection: 'row',
		marginVertical: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		width: '100%',
	},
	extraInfo: {
		marginTop: 12,
	},
	info: {
		flex: 1,
		marginLeft: 16,
	},
	label: {
		fontSize: 12,
		opacity: 0.8,
	},
	name: {
		fontSize: 16,
		fontWeight: '600',
	},
	position: {
		fontSize: 13,
		marginTop: 2,
	},
	socketBadge: {
		borderColor: '#fff',
		borderRadius: 7,
		borderWidth: 2,
		bottom: 0,
		height: 14,
		position: 'absolute',
		right: 0,
		width: 14,
	},
	value: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 4,
	},
});

export default UserStatusCard;
