export interface TrendPoint {
	date: string;
	count: number;
}

export interface UsersAnalytics {
	total: number;
	active: number;
	verified: number;
	new: {
		today: number;
		thisWeek: number;
		thisMonth: number;
	};
	trend: TrendPoint[];
}

export interface EntriesAnalysisStatus {
	PENDING: number;
	PROCESSING: number;
	COMPLETED: number;
	FAILED: number;
}

export interface EntriesAnalytics {
	total: number;
	new: {
		today: number;
		thisWeek: number;
		thisMonth: number;
	};
	trend: TrendPoint[];
	byAnalysisStatus: EntriesAnalysisStatus;
	avgWordCount: number;
}

export interface AdminStatsData {
	users: UsersAnalytics;
	entries: EntriesAnalytics;
}

export interface AdminStatsResponse {
	success: boolean;
	message: string;
	data: AdminStatsData;
}

export interface TopGenreStat {
	genreId: string;
	name: string;
	trackCount: number;
}

export interface MusicCatalogStats {
	totals: {
		tracks: number;
		artists: number;
		genres: number;
	};
	topGenres: TopGenreStat[];
}

export interface MusicStatsResponse {
	success: boolean;
	message: string;
	data: {
		stats: MusicCatalogStats;
	};
}
