export interface AdminUser {
  id: string
  email: string
  username: string
  name: string
  role: string
  isActive: boolean
  isEmailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
  entryCount: number
}

export interface AdminUserDetail extends AdminUser {
  streakDays: number
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UsersResponse {
  success: boolean
  message: string
  data: {
    users: AdminUser[]
    pagination: Pagination
  }
}

export interface UserDetailResponse {
  success: boolean
  message: string
  data: {
    user: AdminUserDetail
  }
}

export interface UserStatusResponse {
  success: boolean
  message: string
  data: {
    userId: string
    isActive: boolean
  }
}
