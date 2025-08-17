/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/molecules/RecentAlertsCard.tsx
import React,{useMemo} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {MotiView} from 'moti';
import {DateTime} from 'luxon';
import {useTheme} from '@/context/Theme';
import {TextLabel} from '@/components/atoms';
import type {AlertsBlock,AlertStatus} from '@/types/home';
import {
	AlertTriangle,     // ámbar (advertencia)
	CheckCircle2,      // verde (resuelta)
	CircleOff,         // gris (rechazada / falsa)
	ShieldAlert,       // rojo (peligro)
} from 'lucide-react-native';

// RNLocalize opcional (fallback para web)
let RNLocalize: any;
try {RNLocalize = require('react-native-localize');} catch {RNLocalize = null;}

type Props = {
	alerts: AlertsBlock | undefined;
	limit?: number;
	timezone?: string;
	/** Llamado al tocar una alerta */
	emptyText?: string;
	onItemPress?: (id: number) => void;
};

const statusMeta = (st: AlertStatus | string) => {
	switch (st) {
		case 'CREATED':
			return {color: '#F44336',Icon: ShieldAlert,label: 'Pendiente'};     // rojo
		case 'FALSE_ALARM':
			return {color: '#94A3B8',Icon: CircleOff,label: 'Falsa alarma'};    // gris
		case 'REJECTED':
			return {color: '#94A3B8',Icon: CircleOff,label: 'Rechazada'};       // gris
		case 'SOLVED':
			return {color: '#10B981',Icon: CheckCircle2,label: 'Resuelta'};     // verde
		case 'UNDER_REVIEW':
			return {color: '#FFC107',Icon: AlertTriangle,label: 'En revisión'}; // ámbar
		default:
			return {color: '#94A3B8',Icon: AlertTriangle,label: String(st)};
	}
};

const RecentAlertsCard: React.FC<Props> = ({
	alerts,
	emptyText = 'Sin alertas recientes',
	limit = 5,
	onItemPress = undefined,
	timezone = undefined,
}) => {
	const {theme} = useTheme();
	const tz = timezone || RNLocalize?.getTimeZone?.() || 'America/Mexico_City';

	const list = useMemo(() => {
		const src = alerts?.recent ?? [];
		return typeof limit === 'number' ? src.slice(0,limit) : src;
	},[alerts,limit]);

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.headerRow}>
				<TextLabel color={theme.textPrimary} type="B16">Alertas recientes</TextLabel>
				<Text style={[styles.badge,{color: theme.textSecondary}]}>
					Abiertas: {alerts?.openCount ?? 0}
				</Text>
			</View>

			{list.length === 0 ? (
				<Text style={{color: theme.textSecondary,fontSize: 13}}>{emptyText}</Text>
			) : (
				list.map((a,idx) => {
					const {color,Icon,label} = statusMeta(a.status);
					const rel = DateTime.fromISO(a.createdAt)
						.setZone(tz)
						.setLocale('es')
						.toRelative({style: 'short'}) ?? '';

					const Row = onItemPress ? Pressable : View;

					return (
						<MotiView
							animate={{opacity: 1,translateY: 0}}
							from={{opacity: 0,translateY: 8}}
							key={`${a.id}-${a.createdAt}`}
							style={styles.itemWrap}
							transition={{delay: idx * 80,duration: 320,type: 'timing'}}
						>
							<Row
								accessibilityRole={onItemPress ? 'button' : 'summary'}
								onPress={onItemPress ? () => onItemPress(a.id) : undefined}
								style={styles.item}
							>
								<View style={styles.icon}>
									<Icon color={color} size={20} />
								</View>

								<View style={styles.content}>
									<Text numberOfLines={1} style={[styles.title,{color: theme.textPrimary}]}>
										{label}
									</Text>
									<Text numberOfLines={1} style={[styles.subtitle,{color: theme.textSecondary}]}>
										{rel} • ID #{a.id}
									</Text>
								</View>

								<View style={[styles.statusBadge,{backgroundColor: color}]}>
									<Text style={styles.statusText}>{label}</Text>
								</View>
							</Row>
						</MotiView>
					);
				})
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	badge: {fontSize: 12},
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
	content: {flex: 1},
	headerRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	icon: {alignItems: 'center',justifyContent: 'center',marginRight: 12},
	item: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	itemWrap: {marginTop: 10},
	statusBadge: {borderRadius: 12,marginLeft: 8,paddingHorizontal: 10,paddingVertical: 4},
	statusText: {color: '#fff',fontSize: 12,fontWeight: '600',textTransform: 'capitalize'},
	subtitle: {fontSize: 12,marginTop: 2},
	title: {fontSize: 14,fontWeight: '600'},
});

export default RecentAlertsCard;
