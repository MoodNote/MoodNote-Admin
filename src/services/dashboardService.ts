import api from "./api";
import type { AdminHealthResponse, AdminHealthData } from "@/types/health";
import type {
	AdminStatsData,
	AdminStatsResponse,
	MusicAnalyticsResponse,
	MusicCatalogStats,
	MusicStatsResponse,
} from "@/types/stats";
import { withErrorHandling } from "@/utils/error";

export interface DashboardSnapshot {
	stats: AdminStatsData | null;
	musicStats: MusicCatalogStats | null;
	health: AdminHealthData | null;
	successCount: number;
}

class DashboardService {
	/**
	 * GET /admin/stats/overview
	 * Thống kê tổng quan: users, entries, emotionDistribution, topKeywords.
	 */
	getAdminStats = withErrorHandling(async () => {
		const { data } = await api.get<AdminStatsResponse>(
			"/admin/stats/overview",
		);
		return data.data;
	});

	/**
	 * GET /admin/stats/music
	 * Music analytics: topRecommended, topPlayed, genreDistribution, recommendationModes.
	 */
	getMusicAnalytics = withErrorHandling(
		async (limit?: number) => {
			const { data } = await api.get<MusicAnalyticsResponse>(
				"/admin/stats/music",
				{ params: limit !== undefined ? { limit } : undefined },
			);
			return data.data;
		},
	);

	/**
	 * GET /admin/music/stats
	 * Music catalog stats: totals (tracks, artists, genres) và topGenres.
	 */
	getMusicStats = withErrorHandling(async () => {
		const { data } =
			await api.get<MusicStatsResponse>("/admin/music/stats");
		return data.data.stats;
	});

	/**
	 * GET /admin/health
	 * Kiểm tra trạng thái server, database và memory.
	 */
	getHealth = withErrorHandling(async () => {
		const { data } = await api.get<AdminHealthResponse>("/admin/health");
		return data.data;
	});

	getSnapshot = async (): Promise<DashboardSnapshot> => {
		const [statsResult, musicResult, healthResult] =
			await Promise.allSettled([
				this.getAdminStats(),
				this.getMusicStats(),
				this.getHealth(),
			]);

		let successCount = 0;

		const stats =
			statsResult.status === "fulfilled" ? statsResult.value : null;
		if (stats) successCount += 1;

		const musicStats =
			musicResult.status === "fulfilled" ? musicResult.value : null;
		if (musicStats) successCount += 1;

		const health =
			healthResult.status === "fulfilled" ? healthResult.value : null;
		if (health) successCount += 1;

		return {
			stats,
			musicStats,
			health,
			successCount,
		};
	};
}

export const dashboardService = new DashboardService();
