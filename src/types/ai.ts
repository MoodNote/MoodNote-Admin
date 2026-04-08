// ── GET /admin/ai/health ─────────────────────────────────────────────────────

export type AiServiceStatus = "ok" | "down";

export interface AiHealthData {
	status: AiServiceStatus;
	latencyMs: number;
}

export interface AiHealthResponse {
	success: boolean;
	message: string;
	data: AiHealthData;
}

// ── POST /admin/ai/analyze ───────────────────────────────────────────────────

export interface AiAnalyzeRequest {
	/** Văn bản cần phân tích, 1–5000 ký tự */
	text: string;
}

export type EmotionLabel =
	| "Enjoyment"
	| "Sadness"
	| "Anger"
	| "Fear"
	| "Disgust"
	| "Surprise"
	| "Other";

export interface AiAnalysisResult {
	overall_emotion: EmotionLabel;
	/** Độ tin cậy của dự đoán (0.0–1.0) */
	overall_confidence: number;
	/** Điểm cảm xúc tổng thể (-1.0 đến +1.0) */
	overall_sentiment: number;
	/** Cường độ cảm xúc (0–100) */
	overall_intensity: number;
	/** Phân bố xác suất cho tất cả nhãn cảm xúc */
	emotion_distribution: Partial<Record<EmotionLabel, number>>;
	keywords: string[];
	sentence_count: number;
}

export interface AiAnalyzeData {
	latencyMs: number;
	result: AiAnalysisResult;
}

export interface AiAnalyzeResponse {
	success: boolean;
	message: string;
	data: AiAnalyzeData;
}

// ── POST /admin/ai/entries/:id/analyze ──────────────────────────────────────

// Response 202: { success: true, message: "Re-analysis started" }
// Không có `data` field — sử dụng ApiBaseResponse thông thường
export interface AiReAnalyzeResponse {
	success: boolean;
	message: string;
}

// ── POST /admin/ai/retry-failed ──────────────────────────────────────────────

export interface AiRetryFailedData {
	/** Số lượng entries đã được queue lại */
	queued: number;
}

export interface AiRetryFailedResponse {
	success: boolean;
	message: string;
	data: AiRetryFailedData;
}

// ── GET /admin/ai/stats ──────────────────────────────────────────────────────

export type AnalysisStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AiStatsData {
	total: number;
	/** Chỉ các trạng thái có ít nhất 1 entry mới xuất hiện */
	byStatus: Partial<Record<AnalysisStatus, number>>;
}

export interface AiStatsResponse {
	success: boolean;
	message: string;
	data: AiStatsData;
}
