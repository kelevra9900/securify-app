import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {AlertTriangle,ShieldAlert} from 'lucide-react-native';
import {MotiView} from 'moti';

import {useTheme} from '@/context/Theme';
import {TextLabel} from '@/components/atoms';

const mockAlerts = [
	{
		icon: <ShieldAlert color="#E94560" size={20} />,
		id: 1,
		status: 'pendiente',
		time: 'Hace 5 min',
		type: 'Intruso detectado',
	},
	{
		icon: <AlertTriangle color="#FFC107" size={20} />,
		id: 2,
		status: 'resuelta',
		time: 'Hace 20 min',
		type: 'Puerta abierta',
	},
	{
		icon: <ShieldAlert color="#E94560" size={20} />,
		id: 3,
		status: 'pendiente',
		time: 'Hace 1 h',
		type: 'Objeto sospechoso',
	},
];

const RecentAlertsCard = () => {
	const {theme} = useTheme();

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<TextLabel color={theme.textPrimary} type="B16">
				Alertas recientes
			</TextLabel>

			{mockAlerts.map((alert,index) => (
				<MotiView
					animate={{opacity: 1,translateY: 0}}
					from={{opacity: 0,translateY: 10}}
					key={alert.id}
					style={styles.alertItem}
					transition={{
						delay: index * 100,
						duration: 400,
						type: 'timing',
					}}
				>
					<View style={styles.icon}>{alert.icon}</View>

					<View style={styles.alertText}>
						<Text
							numberOfLines={1}
							style={[styles.alertType,{color: theme.textPrimary}]}
						>
							{alert.type}
						</Text>
						<Text style={[styles.alertTime,{color: theme.textSecondary}]}>
							{alert.time}
						</Text>
					</View>

					<View
						style={[
							styles.statusBadge,
							{
								backgroundColor:
									alert.status === 'resuelta' ? '#5CE27F' : '#F44336',
							},
						]}
					>
						<Text style={styles.statusText}>{alert.status}</Text>
					</View>
				</MotiView>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	alertItem: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 12,
	},
	alertText: {
		flex: 1,
	},
	alertTime: {
		fontSize: 12,
		marginTop: 2,
	},
	alertType: {
		fontSize: 14,
		fontWeight: '600',
	},
	card: {
		borderRadius: 16,
		elevation: 2,
		marginVertical: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	icon: {
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	statusBadge: {
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	statusText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '500',
		textTransform: 'capitalize',
	},
});

export default RecentAlertsCard;
