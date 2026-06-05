import api from "./api";
import type {
	MoodTagsResponse,
	MoodTagDetailResponse,
	CreateMoodTagPayload,
	UpdateMoodTagPayload,
	MoodTagsQueryParams,
} from "@/types/moodTag";
import { withErrorHandling } from "@/utils/error";

class MoodTagsService {
	getMoodTags = withErrorHandling(async (params: MoodTagsQueryParams) => {
		const { data } = await api.get<MoodTagsResponse>("/admin/mood-tags", {
			params,
		});
		return data.data;
	});

	getMoodTagDetail = withErrorHandling(async (id: string) => {
		const { data } = await api.get<MoodTagDetailResponse>(
			`/admin/mood-tags/${id}`,
		);
		return data.data.tag;
	});

	createMoodTag = withErrorHandling(async (payload: CreateMoodTagPayload) => {
		const { data } = await api.post<MoodTagDetailResponse>(
			"/admin/mood-tags",
			payload,
		);
		return data.data.tag;
	});

	updateMoodTag = withErrorHandling(
		async (id: string, payload: UpdateMoodTagPayload) => {
			const { data } = await api.patch<MoodTagDetailResponse>(
				`/admin/mood-tags/${id}`,
				payload,
			);
			return data.data.tag;
		},
	);

	deleteMoodTag = withErrorHandling(async (id: string) => {
		await api.delete(`/admin/mood-tags/${id}`);
	});
}

export const moodTagsService = new MoodTagsService();
