import React from 'react';
import {ScrollView,StyleSheet,View} from 'react-native';
import {CSafeAreaView,PrimaryButton} from '@/components/atoms';
import {ReportsListCard,ReportsSummaryCard} from '@/components/molecules';
import {useTheme} from '@/context/Theme';
import type {RootScreenProps} from '@/navigation/types';
import {Paths} from '@/navigation/paths';


type Props = {
	navigation: RootScreenProps<Paths.Reports>['navigation'];
};

const ReportsScreen = ({navigation}: Props) => {
	const {theme} = useTheme();

	// 🔁 Simulación de datos de resumen y reportes
	const summary = {
		open: 5,
		rejected: 2,
		resolved: 12,
		total: 19,
	};

	const recentReports = [
		{date: '21 junio, 12:30 PM',id: 'r1',status: 'pending',title: 'Falla en cámara de seguridad'},
		{date: '20 junio, 10:15 AM',id: 'r2',status: 'resolved',title: 'Puerta trasera forzada'},
		{date: '19 junio, 9:00 PM',id: 'r3',status: 'review',title: 'Persona sospechosa'},
	];

	const handlePressReport = (id: string) => {
		// Aquí puedes navegar a la pantalla de detalle del reporte
		console.log('Ver detalle del reporte:',id);

	};

	const handleCreateReport = () => {
		navigation.navigate(Paths.CreateReport);
	};

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.content}>
					<ReportsSummaryCard
						open={summary.open}
						rejected={summary.rejected}
						resolved={summary.resolved}
						total={summary.total}
					/>

					<ReportsListCard onPressReport={handlePressReport} reports={recentReports as any} />
					<PrimaryButton label="Crear reporte" onPress={handleCreateReport} />

				</View>
			</ScrollView>
		</CSafeAreaView>
	);
};

export default ReportsScreen;

const styles = StyleSheet.create({
	container: {
		paddingBottom: 40,
		paddingHorizontal: 20,
	},
	content: {
		gap: 16,
	},
});
