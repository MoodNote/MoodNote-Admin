export type MoodTagType = "MOOD" | "LIFE";

export interface MoodTag {
	id: string;
	name: string;
	color: string | null;
	type: MoodTagType;
	createdAt: string;
	updatedAt: string;
}

export interface MoodTagsData {
	tags: MoodTag[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface MoodTagsResponse {
	success: boolean;
	message: string;
	data: MoodTagsData;
}

export interface MoodTagDetailResponse {
	success: boolean;
	message: string;
	data: { tag: MoodTag };
}

export interface CreateMoodTagPayload {
	name: string;
	color?: string;
	type: MoodTagType;
}

export interface UpdateMoodTagPayload {
	name?: string;
	color?: string | null;
	type?: MoodTagType;
}

export interface MoodTagsQueryParams {
	page: number;
	limit: number;
	search?: string;
	type?: MoodTagType;
}
