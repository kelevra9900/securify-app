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

			<View style={styles.statsRow}>
				<StatItem color="#FFC107" label="Abiertos" theme={theme} value={open} />
				<StatItem color="#4CAF50" label="Resueltos" theme={theme} value={resolved} />
				<StatItem color="#F44336" label="Rechazados" theme={theme} value={rejected} />
			</View>

			<Text style={[styles.totalText,{color: theme.textSecondary}]}>
				Total:{' '}
				<Text style={{color: theme.textPrimary,fontWeight: 'bold'}}>
					{total}
				</Text>
			</Text>
		</View>
	);
};

const StatItem = ({
	color,
	label,
	theme,
	value,
}: {
	color: string;
	label: string;
	theme: ReturnType<typeof useTheme>['theme'];
	value: number;
}) => (
	<View style={styles.stat}>
		<View style={[styles.dot,{backgroundColor: color}]} />
		<Text style={[styles.label,{color: theme.textSecondary}]}>{label}</Text>
		<Text style={[styles.value,{color: theme.textPrimary}]}>{value}</Text>
	</View>
);

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
		marginBottom: 2,
		width: 10,
	},
	label: {
		fontSize: 13,
	},
	stat: {
		alignItems: 'center',
		flex: 1,
		gap: 4,
	},
	statsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 4,
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
