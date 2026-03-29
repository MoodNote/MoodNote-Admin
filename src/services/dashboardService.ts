import api from "./api";
import type { AdminHealthResponse, AdminHealthData } from "@/types/health";
import type {
	AdminStatsData,
	AdminStatsResponse,
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
	getAdminStats = withErrorHandling(async (period: number) => {
		const { data } = await api.get<AdminStatsResponse>("/admin/stats", {
			params: { period },
		});
		return data.data;
	});

	getMusicStats = withErrorHandling(async () => {
		const { data } =
			await api.get<MusicStatsResponse>("/admin/music/stats");
		return data.data.stats;
	});

	getHealth = withErrorHandling(async () => {
		const { data } = await api.get<AdminHealthResponse>("/admin/health");
		return data.data;
	});

	getSnapshot = async (period: number): Promise<DashboardSnapshot> => {
		const [statsResult, musicResult, healthResult] =
			await Promise.allSettled([
				this.getAdminStats(period),
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
