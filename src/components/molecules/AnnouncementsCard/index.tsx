// components/molecules/AnnouncementsCard.tsx
import React,{useMemo} from 'react';
import {Image,Pressable,StyleSheet,Text,View} from 'react-native';
import {Megaphone} from 'lucide-react-native';
import {MotiView} from 'moti';
import {DateTime} from 'luxon';
import {useTheme} from '@/context/Theme';
import type {AnnouncementItem} from '@/types/home';

// RNLocalize opcional (fallback para web)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RNLocalize: any;
try {RNLocalize = require('react-native-localize');} catch {RNLocalize = null;}

type Props = {
	items: AnnouncementItem[] | undefined;   // data.announcements
	/** IANA timezone (si no, usa la del dispositivo) */
	timezone?: string;
	/** Límite de elementos a mostrar */
	limit?: number;
	/** Tocar para ver detalle/lista completa */
	onItemPress?: (id: number) => void;
	/** Texto cuando no hay anuncios */
	emptyText?: string;
	/** Mostrar botón Ver todos (si pasas onSeeAll) */
	onSeeAll?: () => void;
};

const AnnouncementsCard: React.FC<Props> = ({
	emptyText = 'Sin anuncios',
	items,
	limit = 3,
	onItemPress = undefined,
	onSeeAll = undefined,
	timezone = undefined,
}) => {
	const {theme} = useTheme();
	const tz = timezone || RNLocalize?.getTimeZone?.() || 'America/Mexico_City';

	const list = useMemo(() => {
		const src = Array.isArray(items) ? items : [];
		return src.slice(0,limit);
	},[items,limit]);

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.headerRow}>
				<View style={styles.headerL}>
					<Megaphone color={theme.highlight} size={20} />
					<Text style={[styles.title,{color: theme.textPrimary}]}>Anuncios</Text>
				</View>
				{onSeeAll && (
					<Pressable hitSlop={8} onPress={onSeeAll}>
						<Text style={[styles.seeAll,{color: theme.highlight}]}>Ver todos</Text>
					</Pressable>
				)}
			</View>

			{list.length === 0 ? (
				<Text style={{color: theme.textSecondary,fontSize: 13}}>{emptyText}</Text>
			) : (
				list.map((a,idx) => {
					const rel = DateTime.fromISO(a.createdAt)
						.setZone(tz)
						.setLocale('es')
						.toRelative({style: 'short'}) ?? '';

					const Row = onItemPress ? Pressable : View;

					return (
						<MotiView
							animate={{opacity: 1,translateY: 0}}
							from={{opacity: 0,translateY: 6}}
							key={a.id}
							style={styles.itemWrap}
							transition={{delay: idx * 80,duration: 280,type: 'timing'}}
						>
							<Row
								accessibilityRole={onItemPress ? 'button' : 'summary'}
								onPress={onItemPress ? () => onItemPress(a.id) : undefined}
								style={styles.item}
							>
								{a.image ? (
									<Image source={{uri: a.image}} style={styles.thumb} />
								) : (
									<View style={[styles.thumb,{backgroundColor: theme.border}]} />
								)}

								<View style={styles.content}>
									<Text numberOfLines={2} style={[styles.message,{color: theme.textPrimary}]}>
										{a.title}
									</Text>
									<Text style={[styles.meta,{color: theme.textSecondary}]}>
										{rel} ({tz})
									</Text>
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
	card: {
		borderRadius: 16,
		elevation: 2,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		width: '100%',
	},
	content: {flex: 1},
	headerL: {alignItems: 'center',flexDirection: 'row',gap: 8},
	headerRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	item: {alignItems: 'center',flexDirection: 'row'},

	itemWrap: {marginTop: 8},
	message: {fontSize: 14,fontWeight: '600'},
	meta: {fontSize: 12,marginTop: 2},
	seeAll: {fontSize: 13,fontWeight: '600'},
	thumb: {borderRadius: 8,height: 44,marginRight: 12,width: 44},
	title: {fontSize: 16,fontWeight: '600'},
});

export default AnnouncementsCard;
