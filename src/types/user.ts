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
