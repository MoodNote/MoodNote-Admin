// ── Shared ────────────────────────────────────────────────────────────────────

export interface EmotionDistributionItem {
	emotion: string;
	count: number;
}

export interface TopKeyword {
	keyword: string;
	count: number;
}

// ── GET /admin/stats/overview ─────────────────────────────────────────────────

/** Thống kê tổng quan về users (chỉ role = USER, không tính admin) */
export interface UsersOverview {
	total: number;
	active: number;
	inactive: number;
	newToday: number;
	newThisWeek: number;
	newThisMonth: number;
}

/** Thống kê tổng quan về entries (thisWeek = 7 ngày, thisMonth = 30 ngày) */
export interface EntriesOverview {
	total: number;
	today: number;
	thisWeek: number;
	thisMonth: number;
	/** Số entries đã được AI phân tích */
	analyzed: number;
}

export interface AdminStatsData {
	users: UsersOverview;
	entries: EntriesOverview;
	/** Top cảm xúc trong toàn hệ thống */
	emotionDistribution: EmotionDistributionItem[];
	/** Top keywords từ 30 ngày gần nhất, top 10 */
	topKeywords: TopKeyword[];
}

export interface AdminStatsResponse {
	success: boolean;
	message: string;
	data: AdminStatsData;
}

// ── GET /admin/stats/music ────────────────────────────────────────────────────

export interface TrackArtistRef {
	artist: { name: string };
}

export interface TrackRef {
	id: string;
	trackName: string;
	albumName: string;
	artists: TrackArtistRef[];
}

export interface TopRecommendedItem {
	track: TrackRef;
	recommendationCount: number;
}

export interface TopPlayedItem {
	track: TrackRef;
	playCount: number;
}

export interface GenreDistributionItem {
	genre: string;
	count: number;
}

export interface RecommendationModeItem {
	mode: "MIRROR" | "SHIFT";
	count: number;
}

export interface MusicAnalyticsData {
	/** Top tracks xuất hiện nhiều nhất trong recommendation playlists */
	topRecommended: TopRecommendedItem[];
	/** Top tracks có số TrackPlay records nhiều nhất */
	topPlayed: TopPlayedItem[];
	/** Phân bố thể loại nhạc từ bảng TrackGenre */
	genreDistribution: GenreDistributionItem[];
	/** Breakdown MIRROR vs SHIFT recommendations */
	recommendationModes: RecommendationModeItem[];
}

export interface MusicAnalyticsResponse {
	success: boolean;
	message: string;
	data: MusicAnalyticsData;
}

// ── GET /admin/music/stats ────────────────────────────────────────────────────
// (music catalog stats — định nghĩa theo api-spec-music.md)

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
