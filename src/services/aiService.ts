import api from "./api";
import type {
	AiHealthResponse,
	AiAnalyzeRequest,
	AiAnalyzeResponse,
	AiReAnalyzeResponse,
	AiRetryFailedResponse,
	AiStatsResponse,
} from "@/types/ai";
import { withErrorHandling } from "@/utils/error";

class AiService {
	/**
	 * GET /admin/ai/health
	 * Ping AI microservice, đo latency. Luôn trả về HTTP 200.
	 * Phân biệt trạng thái qua `data.status` ("ok" | "down").
	 */
	getHealth = withErrorHandling(async () => {
		const { data } = await api.get<AiHealthResponse>("/admin/ai/health");
		return data.data;
	});

	/**
	 * POST /admin/ai/analyze
	 * Test phân tích text trực tiếp. Không lưu gì vào database.
	 */
	analyze = withErrorHandling(async (payload: AiAnalyzeRequest) => {
		const { data } = await api.post<AiAnalyzeResponse>(
			"/admin/ai/analyze",
			payload,
		);
		return data.data;
	});

	/**
	 * POST /admin/ai/entries/:id/analyze
	 * Force re-analyze 1 entry cụ thể. Phân tích chạy bất đồng bộ (202).
	 */
	reAnalyzeEntry = withErrorHandling(async (entryId: string) => {
		const { data } = await api.post<AiReAnalyzeResponse>(
			`/admin/ai/entries/${entryId}/analyze`,
		);
		return data;
	});

	/**
	 * POST /admin/ai/retry-failed
	 * Queue lại toàn bộ entries có analysisStatus = FAILED.
	 * Trả về số lượng đã được queue.
	 */
	retryFailed = withErrorHandling(async () => {
		const { data } =
			await api.post<AiRetryFailedResponse>("/admin/ai/retry-failed");
		return data.data;
	});

	/**
	 * GET /admin/ai/stats
	 * Trả về số lượng entries theo từng trạng thái phân tích.
	 */
	getStats = withErrorHandling(async () => {
		const { data } = await api.get<AiStatsResponse>("/admin/ai/stats");
		return data.data;
	});
}

export const aiService = new AiService();
