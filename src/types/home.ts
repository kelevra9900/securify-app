// types/home.ts

// --- Enums (string unions) ---
export type Role =
	| 'ADMIN'
	| 'CHIEF_SECURITY'
	| 'COORDINATOR'
	| 'OPERATOR'
	| 'SECURITY_ANALYST'
	| 'SUPER_ADMIN'
	| 'USER';

export type AttendanceStatus = 'DONE' | 'OFF_SITE' | 'ON_SITE';

export type AlertStatus =
	| 'CREATED'
	| 'FALSE_ALARM'
	| 'REJECTED'
	| 'SOLVED'
	| 'UNDER_REVIEW';

export type RecentActivityType =
	| 'ALERT_CREATED'
	| 'CHECK_IN'
	| 'CHECK_OUT'
	| 'SECTOR_CHANGED';

// --- Bloques de datos ---
export interface UserSummary {
	environmentId: null | number;
	firstName: string;
	id: number;
	image: null | string;
	jobPosition: {icon: null | string; id: number; name: string;} | null;
	lastName: string;
	role: Role | string;               // si en el backend viene como Role | string
}

export interface EnvironmentBrand {
	id: number;
	logo: null | string;
	name: string;
	primaryColor: string;              // hex
	secondaryColor: string;            // hex
	// timezone?: string;              // si luego lo expones
}

export interface ConfigFlags {
	chatV2: boolean;
	faceLogin: boolean;
	overtimeRequests: boolean;
}
export interface Config {
	features: ConfigFlags;
	minAppVersion: string;             // semver
	uploadMaxMb: number;
}

export interface DocumentsStats {
	expiringSoon: number;
	missingTypes: Array<{id: number; name: string}>;
	percentage: number;                // 0..100
	requiredTotal: number;
	uploaded: number;
	valid: number;
}

export interface AttendanceMini {
	checkedIn: boolean;
	onShift: boolean;
	status: AttendanceStatus | string;
}

export interface Stats {
	activeAlerts: number;
	attendance: AttendanceMini;
	documents: DocumentsStats;
	pendingOvertimes: number;
	roundsActive: number;
	unreadMessages: number;
	unreadNotifications: number;
}

export interface Shift {
	end: string;                       // "HH:mm"
	endsAt?: string;                   // ISO (opcional si lo expones)
	id: number;
	name: string;
	remainingMinutes: number,
	start: string;                     // "HH:mm"
}

export interface Sector {
	id: number;
	name: string;
}

export interface ActivityItem {
	meta?: {
		alertId?: number;
		fromSectorId?: null | number;
		status?: AlertStatus | null | string;
		toSectorId?: null | number;
	} & Record<string,unknown>;
	timestamp: string;                 // ISO
	title: string;
	type: RecentActivityType;
}

export interface AlertsBlock {
	openCount: number;
	recent: Array<{
		createdAt: string;               // ISO
		id: number;
		image: null | string;
		latitude: null | number;
		longitude: null | number;
		status: AlertStatus | string;
	}>;
}

export interface AnnouncementItem {
	createdAt: string;                 // ISO
	id: number;
	image: null | string;
	title: string;
}

export interface LastCheckpoint {
	checkedAt: string; // ISO
	id: number;
	latitude: null | number;
	location: string;
	longitude: null | number;
	roundId: number;
}


export interface HomeData {
	alerts: AlertsBlock;
	announcements: AnnouncementItem[];
	config: Config;
	environment: EnvironmentBrand;
	lastCheckpoint: LastCheckpoint | null;
	recentActivity: ActivityItem[];
	sector: null | Sector;
	shift: null | Shift;
	stats: Stats;
	user: UserSummary;
}

export interface HomeQuery {
	/** Max activity items to return (default: 10) */
	limitActivity?: number;
	/** Max alerts to return (default: 5) */
	limitAlerts?: number;
	/** Max announcements to return (default: 3) */
	limitAnnouncements?: number;
	/** Documents expiring window in days (default: 30) */
	expiringDays?: number;
}

// --- Envelope de API (acepta ok|success) ---
export interface ApiErrorPayload {
	code: string;
	message: string;
	status: number;
}

export type HomeResponse =
	| {data: HomeData; etag?: string; serverTime: string; success: true;}
	| {error: ApiErrorPayload; serverTime: string; success: false;};


export type HomeSuccess = {data: HomeData; etag?: string; ok: true; serverTime?: string} |
{data: HomeData; etag?: string; serverTime?: string; success: true;}; // por compat

export type HomeError = {error: {code: string; message: string; status: number;}; ok: false;} |
{error: {code: string; message: string; status: number;}; success: false;};
export type ApiError = {code: string; message: string; status: number;};
