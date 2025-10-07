export interface Sector {
	coordinates: Coordinates
	count: number
	createdAt: string
	environmentId: number
	id: number
	name: string
	updatedAt: string
}

export interface Coordinates { }

export interface SectorPagination {
	data: Sector[]
	meta: Meta
}

export interface Meta {
	hasNextPage: boolean
	hasPrevPage: boolean
	page: number
	perPage: number
	total: number
	totalPages: number
}

// Sector updated
export interface SectorUpdated {
	data: DataUpdated
	ok: boolean
	serverTimeISO: string
}

export interface DataUpdated {
	sector: Sector
	userId: number
}