export interface BroadcastRequest {
  title: string
  message: string
  type?: string
  metadata?: Record<string, unknown>
}

export interface SendRequest {
  userIds: string[]
  title: string
  message: string
  type?: string
  metadata?: Record<string, unknown>
}

export interface BroadcastResponse {
  success: boolean
  message: string
  data: { sent: number }
}

export interface SendResponse {
  success: boolean
  message: string
  data: { sent: number; requested: number }
}
