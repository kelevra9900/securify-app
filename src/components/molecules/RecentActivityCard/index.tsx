import React from 'react';
import {FlatList,StyleSheet,Text,View} from 'react-native';
import {useTheme} from '@/context/Theme';
import {AlertCircleIcon,CalendarIcon} from 'lucide-react-native';

const mockActivities = [
	{
		description: 'Puerta 4 – Terminal A',
		id: '1',
		timestamp: 'Hace 3 min',
		title: 'Alerta atendida',
		type: 'alert',
	},
	{
		description: 'Turno nocturno iniciado',
		id: '2',
		timestamp: 'Hace 20 min',
		title: 'Cambio de turno',
		type: 'shift',
	},
	{
		description: 'Sector carga – Juan Pérez',
		id: '3',
		timestamp: 'Hace 40 min',
		title: 'Acceso registrado',
		type: 'access',
	},
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: any = {
	access: <CalendarIcon color="#5CE27F" size={20} />,
	alert: <AlertCircleIcon color="#E94560" size={20} />,
	shift: <CalendarIcon color="#1F4BDC" size={20} />,
};

const RecentActivityCard = () => {
	const {theme} = useTheme();

	const renderItem = ({item}: {item: typeof mockActivities[0]}) => (
		<View style={styles.item}>
			<View style={styles.icon}>{iconMap[item.type]}</View>
			<View style={styles.content}>
				<Text numberOfLines={1} style={[styles.title,{color: theme.textPrimary}]}>
					{item.title}
				</Text>
				<Text numberOfLines={1} style={[styles.description,{color: theme.textSecondary}]}>
					{item.description}
				</Text>
			</View>
			<Text style={[styles.time,{color: theme.textSecondary}]}>{item.timestamp}</Text>
		</View>
	);

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<Text style={[styles.header,{color: theme.textPrimary}]}>Actividad reciente</Text>
			<FlatList
				data={mockActivities}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				scrollEnabled={false}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		elevation: 2,
		marginTop: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		width: '100%',
	},
	content: {
		flex: 1,
	},
	description: {
		fontSize: 13,
		marginTop: 2,
	},
	header: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
	},
	icon: {
		marginRight: 12,
	},
	item: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	separator: {
		height: 12,
	},
	time: {
		fontSize: 12,
		marginLeft: 8,
	},
	title: {
		fontSize: 14,
		fontWeight: '600',
	},
});

export default RecentActivityCard;
