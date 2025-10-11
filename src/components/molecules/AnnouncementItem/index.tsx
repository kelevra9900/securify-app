import type {AnnouncementListItem} from "@/types/announcements";
import {DateTime} from "luxon";
import {useMemo} from "react";
import {Image,Pressable,StyleSheet,Text,View} from "react-native";

type AnnouncementItemType = {
	item: AnnouncementListItem,
	onPress: () => void;
}
const AnnouncementItem = ({
	item,
	onPress,
}: AnnouncementItemType) => {

	const created = useMemo(
		() => {
			const dt = DateTime.fromISO(item.createdAt);
			if (!dt.isValid) {
				return '';
			}
			return (
				dt.toRelative({locale: 'es'}) ??
				dt.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
			);
		},
		[item.createdAt],
	);

	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={({pressed}) => [styles.card,pressed && styles.cardPressed]}
		>
			{item.image ? (
				<Image
					accessibilityIgnoresInvertColors
					accessible
					resizeMode="cover"
					source={{uri: item.image}}
					style={styles.cover}
				/>
			) : (
				<View style={[styles.cover,styles.coverPlaceholder]}>
					<Text style={styles.coverPlaceholderText}>Sin imagen</Text>
				</View>
			)}

			<View style={styles.cardBody}>
				<View style={styles.cardHeader}>
					<Text numberOfLines={2} style={styles.title}>
						{item.title}
					</Text>

					{item.isApproved ? (
						<View style={[styles.badge,styles.badgeSuccess]}>
							<Text style={styles.badgeText}>Aprobado</Text>
						</View>
					) : (
						<View style={[styles.badge,styles.badgeWarning]}>
							<Text style={styles.badgeText}>Pendiente</Text>
						</View>
					)}
				</View>

				{item.environmentName ? (
					<View style={styles.chipsRow}>
						<View style={styles.chip}>
							<Text style={styles.chipText}>{item.environmentName}</Text>
						</View>
					</View>
				) : null}

				<Text numberOfLines={3} style={styles.content}>
					{item.excerpt ?? 'Sin descripción disponible.'}
				</Text>

				{created ? (
					<View style={styles.metaRow}>
						<Text style={styles.metaText}>
							{item.author?.name ?? 'Equipo Trablisa'}
						</Text>
						<Text style={styles.dot}> • </Text>
						<Text style={styles.metaText}>{created}</Text>
					</View>
				) : null}
			</View>
		</Pressable>
	);
};

export default AnnouncementItem;

const styles = StyleSheet.create({
	badge: {
		alignSelf: 'flex-start',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	badgeSuccess: {
		backgroundColor: 'rgba(16,185,129,0.15)'
	},
	badgeText: {
		color: '#C7F9E3',
		fontSize: 12,
		fontWeight: '600'
	},
	badgeWarning: {
		backgroundColor: 'rgba(245,158,11,0.15)'
	},
	card: {
		backgroundColor: '#131A20',
		borderColor: 'rgba(255,255,255,0.06)',
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: 'hidden',
	},
	cardBody: {
		padding: 12
	},
	cardHeader: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8
	},
	cardPressed: {
		opacity: 0.92
	},
	chip: {
		backgroundColor: '#1B232B',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	chipsRow: {
		flexDirection: 'row',
		gap: 8,
		marginTop: 8
	},
	chipText: {
		color: '#9BA7B4',
		fontSize: 12
	},
	content: {
		color: '#C8D2DE',
		fontSize: 14,
		lineHeight: 20,
		marginTop: 8,
	},
	cover: {
		aspectRatio: 16 / 9,
		backgroundColor: '#1B232B',
		width: '100%',
	},
	coverPlaceholder: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	coverPlaceholderText: {
		color: '#6B7380',
		fontSize: 13
	},
	dot: {
		color: '#394452'
	},
	metaRow: {
		alignItems: 'center',
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 10,
	},
	metaText: {color: '#8C99A7',fontSize: 12},
	title: {color: '#EAF0F5',flex: 1,fontSize: 16,fontWeight: '700'},
})