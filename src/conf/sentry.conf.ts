/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CurrentUserData} from '@/types/user';
import {DNS_SENTRY} from '@/utils/constants';
import * as Sentry from '@sentry/react-native';
import DeviceInfo from 'react-native-device-info';


const MAX_BREADCRUMB_STRING_LENGTH = 300;
const MAX_BREADCRUMB_OBJECT_KEYS = 10;
const MAX_BREADCRUMB_ARRAY_ITEMS = 10;

type BreadcrumbLevel = 'debug' | 'error' | 'fatal' | 'info' | 'warning';
type BreadcrumbType = 'default' | 'http' | 'navigation' | 'process' | 'user';

const truncateString = (value: string,maxLength = MAX_BREADCRUMB_STRING_LENGTH): string =>
	value.length > maxLength ? `${value.slice(0,maxLength)}…` : value;

export type SanitizedBreadcrumbValue =
	| boolean
	| null
	| number
	| Record<string,any>
	| string
	| undefined;

const sanitizeBreadcrumbValue = (
	value: unknown,
	depth = 0,
	seen: WeakSet<object> = new WeakSet(),
): SanitizedBreadcrumbValue => {
	if (value === null || value === undefined) {
		return value;
	}

	if (typeof value === 'boolean' || typeof value === 'number') {
		return value;
	}

	if (typeof value === 'string') {
		return truncateString(value);
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (Array.isArray(value)) {
		if (seen.has(value)) {
			return '[Circular]';
		}
		seen.add(value);

		const limited: SanitizedBreadcrumbValue[] = value
			.slice(0,MAX_BREADCRUMB_ARRAY_ITEMS)
			.map(item => sanitizeBreadcrumbValue(item,depth + 1,seen));

		if (value.length > MAX_BREADCRUMB_ARRAY_ITEMS) {
			limited.push(`[+${value.length - MAX_BREADCRUMB_ARRAY_ITEMS} more]`);
		}

		return limited;
	}

	if (typeof value === 'object') {
		const record = value as Record<string,unknown>;
		const weakRef = value as object;
		if (seen.has(weakRef)) {
			return '[Circular]';
		}
		seen.add(weakRef);

		if (depth >= 2) {
			return '[Object]';
		}

		const entries = Object.entries(record);
		const sanitized: Record<string,SanitizedBreadcrumbValue> = {};

		for (const [key,val] of entries.slice(0,MAX_BREADCRUMB_OBJECT_KEYS)) {
			sanitized[key] = sanitizeBreadcrumbValue(val,depth + 1,seen);
		}

		if (entries.length > MAX_BREADCRUMB_OBJECT_KEYS) {
			sanitized.__truncated__ = `[+${entries.length - MAX_BREADCRUMB_OBJECT_KEYS} keys]`;
		}

		return sanitized;
	}

	return truncateString(String(value));
};

export const sanitizeBreadcrumbData = (data: unknown): SanitizedBreadcrumbValue =>
	sanitizeBreadcrumbValue(data);

export function addAppBreadcrumb({
	category,
	data,
	level = 'info',
	message,
	type = 'default',
}: {
	category: string;
	data?: unknown;
	level?: BreadcrumbLevel;
	message?: string;
	type?: BreadcrumbType;
}) {
	try {
		Sentry.addBreadcrumb({
			category,
			data: data === undefined ? undefined : (sanitizeBreadcrumbData(data) as Sentry.Breadcrumb['data']),
			level,
			message: message ? truncateString(message) : undefined,
			type,
		});
	} catch { }
}

export function initializeSentry() {
	const appVersion = DeviceInfo.getVersion();

	Sentry.init({
		beforeBreadcrumb(breadcrumb) {
			const sanitized: Sentry.Breadcrumb = {...breadcrumb};

			if (typeof sanitized.message === 'string') {
				sanitized.message = truncateString(sanitized.message);
			}

			if (sanitized.data) {
				sanitized.data = sanitizeBreadcrumbData(sanitized.data) as Sentry.Breadcrumb['data'];
			}

			return sanitized;
		},
		dist: '1',
		dsn: DNS_SENTRY,
		enableAutoSessionTracking: true,
		profilesSampleRate: 1.0,
		release: `com.drivana@${appVersion}`,
		sendDefaultPii: true,
		tracesSampleRate: 1.0,
	});
}

export const withSentry = Sentry.wrap;

export function setSentryUser(user: Pick<CurrentUserData,'user'>) {
	const {email,firstName,id,lastName,role} = user.user;
	try {
		Sentry.setUser({
			email,
			id,
			username: [firstName,lastName].filter(Boolean).join(' ').trim() || undefined,
		});
		Sentry.setContext('user',{
			role,
		});
	} catch { }
}

export function clearSentryUser() {
	try {
		Sentry.setUser(null);
	} catch { }
}

export function addNetworkBreadcrumb(data: {
	category: string;
	method?: string;
	requestBodySize?: number;
	status?: number;
	url?: string;
}) {
	const level: BreadcrumbLevel =
		typeof data.status === 'number'
			? data.status >= 500
				? 'error'
				: data.status >= 400
					? 'warning'
					: 'info'
			: 'info';

	addAppBreadcrumb({
		category: data.category,
		data: {
			method: data.method,
			requestBodySize: data.requestBodySize,
			status: data.status,
			url: data.url,
		},
		level,
		type: 'http',
	});
}
