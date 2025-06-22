import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {useTheme} from '@/context/Theme';

type Props = {
	open: number;
	rejected: number;
	resolved: number;
	total: number;
};

const ReportsSummaryCard = ({open,rejected,resolved,total}: Props) => {
	const {theme} = useTheme();

	return (
		<View style={[styles.container,{backgroundColor: theme.cardBackground}]}>
			<Text style={[styles.title,{color: theme.textPrimary}]}>Resumen de Reportes</Text>

			<View style={styles.row}>
				<View style={styles.stat}>
					<View style={[styles.dot,{backgroundColor: '#FFC107'}]} />
					<Text style={[styles.label,{color: theme.textSecondary}]}>Abiertos</Text>
					<Text style={[styles.value,{color: theme.textPrimary}]}>{open}</Text>
				</View>

				<View style={styles.stat}>
					<View style={[styles.dot,{backgroundColor: '#4CAF50'}]} />
					<Text style={[styles.label,{color: theme.textSecondary}]}>Resueltos</Text>
					<Text style={[styles.value,{color: theme.textPrimary}]}>{resolved}</Text>
				</View>

				<View style={styles.stat}>
					<View style={[styles.dot,{backgroundColor: '#F44336'}]} />
					<Text style={[styles.label,{color: theme.textSecondary}]}>Rechazados</Text>
					<Text style={[styles.value,{color: theme.textPrimary}]}>{rejected}</Text>
				</View>
			</View>

			<Text style={[styles.totalText,{color: theme.textSecondary}]}>
				Total: <Text style={{color: theme.textPrimary,fontWeight: 'bold'}}>{total}</Text>
			</Text>
		</View>
	);
};

export default ReportsSummaryCard;

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		gap: 12,
		padding: 16,
	},
	dot: {
		borderRadius: 5,
		height: 10,
		width: 10,
	},
	label: {
		fontSize: 13,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	stat: {
		alignItems: 'center',
		gap: 4,
	},
	title: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	totalText: {
		fontSize: 13,
		marginTop: 8,
		textAlign: 'right',
	},
	value: {
		fontSize: 18,
		fontWeight: 'bold',
	},
});
