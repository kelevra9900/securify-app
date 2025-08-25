// Servicios de presign
import type {DocumentsListResponse,GetMyDocumentsParams} from '@/types/documents';
import {instance} from '../instance';

export type PresignPutDto = {
	checksumSHA256?: string;
	contentLength: number;
	contentType: string;
	filename?: string;
	useKms?: boolean;
};

export type PresignedPutResp = {
	expiresIn: number;
	headers?: Record<string,string>;
	key: string;                  // <- este será tu filePath en DB
	method: 'PUT';
	url: string;
};

export type CreateMyDocumentBody = {
	documentTypeId: number;
	filePath: string;        // <- presign.key
	issuedAt?: string;       // 'YYYY-MM-DD'
	jobPositionId?: number;
	validUntil?: string;     // 'YYYY-MM-DD'
};

export async function createMyDocument(body: CreateMyDocumentBody) {
	const {data} = await instance.post('mobile/user/documents',body);
	return data; // tu envelope { ok, data, serverTimeISO }
}

export async function getUploadUrl(body: PresignPutDto): Promise<PresignedPutResp> {
	const {data} = await instance.post<PresignedPutResp>('mobile/files/upload-url',body);
	return data;
}

export async function getMyDocuments(params: GetMyDocumentsParams = {}): Promise<DocumentsListResponse> {
	const {data} = await instance.get<DocumentsListResponse>('mobile/user/documents',{
		params: {
			includeSignedUrl: false,
			page: 1,
			perPage: 20,
			sortBy: 'createdAt',
			sortOrder: 'desc',
			...params,
		},
	});
	return data;
}


export async function getDocumentSignedUrl(
	documentId: number,
	opts?: {contentType?: string; downloadName?: string; expiresIn?: number;}
): Promise<{expiresIn: number; url: string;}> {
	const {data} = await instance.get<{expiresIn: number; url: string;}>(
		`mobile/user/documents/${documentId}/signed-url`,
		{
			params: {
				contentType: opts?.contentType,
				downloadName: opts?.downloadName,
				expiresIn: opts?.expiresIn ?? 600,   // 10 min por defecto
			},
		}
	);
	return data;
}