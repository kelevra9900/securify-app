import RNFS from 'react-native-fs';
import type {PresignedPutResp} from '@/data/services/files';

export type LocalFile = {
	name: string;
	path: string;      // file://... (usar copia a caché)
	size?: number;
	type: string;      // mime
};

export function normalizePath(uri: string): string {
	// RNFS requiere ruta tipo file:///... o /data/...
	return uri.startsWith('file://') ? uri : uri.replace(/^content:\/\//,'');
}

export async function ensureSize(path: string): Promise<number> {
	const stat = await RNFS.stat(path);
	// RNFS.stat.size viene como string en iOS, número en Android -> conviértelo
	return typeof stat.size === 'string' ? Number(stat.size) : stat.size;
}

export type UploadHandle = {cancel: () => void; jobId: number;};

// Sube archivo local a la URL prefirmada con PUT (no multipart), reporta progreso (0-100)
export async function uploadToS3(
	file: LocalFile,
	presign: PresignedPutResp,
	onProgress?: (pct: number) => void,
): Promise<{handle: UploadHandle; key: string;}> {
	const headers = presign.headers ?? {'content-type': file.type || 'application/octet-stream'};

	const task = RNFS.uploadFiles({
		begin: () => { },
		binaryStreamOnly: true, // <- manda el binario crudo (no multipart)
		files: [
			{
				filename: file.name,
				filepath: normalizePath(file.path),
				filetype: file.type,
				name: 'file',
			},
		],
		headers,
		method: 'PUT',
		progress: (e) => {
			if (!onProgress || !e.totalBytesExpectedToSend) {return;}
			const pct = Math.round((e.totalBytesSent / e.totalBytesExpectedToSend) * 100);
			onProgress(pct);
		},
		toUrl: presign.url,
	});

	const handle: UploadHandle = {
		cancel: () => RNFS.stopUpload(task.jobId),
		jobId: task.jobId,
	};

	const res = await task.promise;
	if (res.statusCode < 200 || res.statusCode >= 300) {
		throw new Error(`S3 PUT failed: ${res.statusCode}`);
	}

	return {handle,key: presign.key};
}
