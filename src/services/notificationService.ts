import api from "./api";
import type {
	BroadcastRequest,
	BroadcastResponse,
	SendRequest,
	SendResponse,
} from "@/types/notification";
import { withErrorHandling } from "@/utils/error";

class NotificationService {
	broadcast = withErrorHandling(async (payload: BroadcastRequest) => {
		const { data } = await api.post<BroadcastResponse>(
			"/admin/notifications/broadcast",
			payload,
		);
		return data.data;
	});

	sendToUsers = withErrorHandling(async (payload: SendRequest) => {
		const { data } = await api.post<SendResponse>(
			"/admin/notifications/send",
			payload,
		);
		return data.data;
	});
}

export const notificationService = new NotificationService();
