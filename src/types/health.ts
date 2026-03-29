export interface HealthDatabaseOk {
	status: "ok";
	latencyMs: number;
}

export interface HealthDatabaseError {
	status: "error";
	message: string;
}

export type HealthDatabase = HealthDatabaseOk | HealthDatabaseError;

export interface HealthMemory {
	heapUsedMB: number;
	heapTotalMB: number;
	rssMB: number;
}

export interface AdminHealthData {
	status: "ok" | "degraded";
	timestamp: string;
	uptime: number;
	version: string;
	database: HealthDatabase;
	memory: HealthMemory;
}

export interface AdminHealthResponse {
	success: boolean;
	message: string;
	data: AdminHealthData;
}
