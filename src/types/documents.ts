export type ApiError = {code: string; message: string; status: number};

export type DocumentTypeDTO = {
	id: number;
	name: string;
	slug: string;
	// agrega campos si tu API los devuelve (createdAt, updatedAt, etc.)
};

export type UserDocumentDTO = {
	documentType: DocumentTypeDTO;
	filePath: string;
	id: number;
	issuedAt: null | string;     // ISO
	jobPositionId: null | number;
	signedUrl?: string;
	valid: boolean | null;
	validUntil: null | string;   // ISO
};

export type DocumentsMeta = {
	filters: {q?: null | string; status?: null | string; typeId?: null | number;};
	hasNextPage: boolean;
	hasPrevPage: boolean;
	page: number;
	perPage: number;
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	total: number;
	totalPages: number;
};

export type DocumentsListResponse = {
	data: UserDocumentDTO[];
	meta: DocumentsMeta;
};

export type GetMyDocumentsParams = {
	includeSignedUrl?: boolean;
	page?: number;
	perPage?: number;
	q?: string;
	sortBy?: 'createdAt' | 'issuedAt' | 'updatedAt' | 'validUntil';
	sortOrder?: 'asc' | 'desc';
	status?: string;
	typeId?: number;
};
