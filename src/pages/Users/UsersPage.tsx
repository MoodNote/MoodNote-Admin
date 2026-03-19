import { useState, useEffect, useRef } from 'react'
import api from '@/services/api'
import type { AdminUser, Pagination } from '@/types/user'
import type { UsersResponse } from '@/types/user'
import { formatDate, formatRelativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import './UsersPage.css'

type ActiveFilter = '' | 'true' | 'false'

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = async (
    currentPage: number,
    currentSearch: string,
    currentFilter: ActiveFilter,
  ) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20,
      }
      if (currentSearch) params.search = currentSearch
      if (currentFilter !== '') params.isActive = currentFilter

      const { data } = await api.get<UsersResponse>('/admin/users', { params })
      setUsers(data.data.users)
      setPagination(data.data.pagination)
    } catch {
      setError('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(page, search, activeFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeFilter])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchUsers(1, value, activeFilter)
    }, 300)
  }

  const handleFilterChange = (value: ActiveFilter) => {
    setActiveFilter(value)
    setPage(1)
  }

  return (
    <div className="users-page">
      <div className="users-page__header">
        <h2 className="users-page__title">Users</h2>
        <p className="users-page__subtitle">
          {pagination ? `${pagination.total} total users` : 'Manage all users'}
        </p>
      </div>

      <div className="users-page__controls">
        <input
          type="search"
          className="users-page__search"
          placeholder="Search by email, username, or name..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <select
          className="users-page__filter"
          value={activeFilter}
          onChange={(e) => handleFilterChange(e.target.value as ActiveFilter)}
        >
          <option value="">All users</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {error && <p className="users-page__error">{error}</p>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Entries</th>
              <th>Last Login</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="users-table__skeleton-row">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}><span className="skeleton" /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="users-table__empty">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <span className="user-cell__name">{user.name}</span>
                      <span className="user-cell__meta">
                        @{user.username} · {user.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge--role">{user.role}</span>
                  </td>
                  <td>
                    <span className={cn('badge', user.isActive ? 'badge--active' : 'badge--inactive')}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={cn('badge', user.isEmailVerified ? 'badge--verified' : 'badge--unverified')}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="users-table__num">{user.entryCount}</td>
                  <td className="users-table__date">
                    {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : '—'}
                  </td>
                  <td className="users-table__date">{formatDate(user.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="users-pagination">
          <button
            className="users-pagination__btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="users-pagination__info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            className="users-pagination__btn"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
