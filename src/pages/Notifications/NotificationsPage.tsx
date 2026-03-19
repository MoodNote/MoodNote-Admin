import { useState } from 'react'
import type { FormEvent } from 'react'
import api from '@/services/api'
import type { BroadcastResponse, SendResponse } from '@/types/notification'
import './NotificationsPage.css'

type Tab = 'broadcast' | 'send'

interface FormState {
  title: string
  message: string
}

const EMPTY_FORM: FormState = { title: '', message: '' }

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('broadcast')

  // Broadcast state
  const [broadcast, setBroadcast] = useState<FormState>(EMPTY_FORM)
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null)
  const [broadcastError, setBroadcastError] = useState('')

  // Send state
  const [send, setSend] = useState<FormState>(EMPTY_FORM)
  const [userIdsRaw, setUserIdsRaw] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [sendError, setSendError] = useState('')

  const handleBroadcast = async (e: FormEvent) => {
    e.preventDefault()
    setBroadcastError('')
    setBroadcastResult(null)

    if (!broadcast.title.trim() || !broadcast.message.trim()) {
      setBroadcastError('Title and message are required.')
      return
    }
    if (broadcast.title.length > 100) {
      setBroadcastError('Title must be 100 characters or fewer.')
      return
    }
    if (broadcast.message.length > 1000) {
      setBroadcastError('Message must be 1000 characters or fewer.')
      return
    }

    setBroadcastLoading(true)
    try {
      const { data } = await api.post<BroadcastResponse>(
        '/admin/notifications/broadcast',
        { title: broadcast.title, message: broadcast.message, type: 'SYSTEM' },
      )
      setBroadcastResult(`Sent to ${data.data.sent} users.`)
      setBroadcast(EMPTY_FORM)
    } catch {
      setBroadcastError('Failed to send broadcast. Please try again.')
    } finally {
      setBroadcastLoading(false)
    }
  }

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    setSendError('')
    setSendResult(null)

    const userIds = userIdsRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    if (userIds.length === 0) {
      setSendError('Please enter at least one user ID.')
      return
    }
    if (userIds.length > 500) {
      setSendError('You can send to at most 500 users at once.')
      return
    }
    if (!send.title.trim() || !send.message.trim()) {
      setSendError('Title and message are required.')
      return
    }
    if (send.title.length > 100) {
      setSendError('Title must be 100 characters or fewer.')
      return
    }
    if (send.message.length > 1000) {
      setSendError('Message must be 1000 characters or fewer.')
      return
    }

    setSendLoading(true)
    try {
      const { data } = await api.post<SendResponse>(
        '/admin/notifications/send',
        { userIds, title: send.title, message: send.message, type: 'SYSTEM' },
      )
      setSendResult(`Sent ${data.data.sent} / ${data.data.requested} requested.`)
      setSend(EMPTY_FORM)
      setUserIdsRaw('')
    } catch {
      setSendError('Failed to send notification. Please try again.')
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <div className="notifications-page">
      <div className="notifications-page__header">
        <h2 className="notifications-page__title">Notifications</h2>
        <p className="notifications-page__subtitle">Send notifications to users</p>
      </div>

      <div className="notifications-tabs">
        <button
          className={`notifications-tab ${tab === 'broadcast' ? 'notifications-tab--active' : ''}`}
          onClick={() => setTab('broadcast')}
        >
          Broadcast
        </button>
        <button
          className={`notifications-tab ${tab === 'send' ? 'notifications-tab--active' : ''}`}
          onClick={() => setTab('send')}
        >
          Send to specific users
        </button>
      </div>

      <div className="notifications-card">
        {tab === 'broadcast' && (
          <form className="notification-form" onSubmit={handleBroadcast} noValidate>
            <p className="notification-form__desc">
              Send a notification to <strong>all active, verified users</strong>.
            </p>

            {broadcastError && (
              <p className="notification-form__error">{broadcastError}</p>
            )}
            {broadcastResult && (
              <p className="notification-form__success">{broadcastResult}</p>
            )}

            <div className="notification-form__group">
              <label className="notification-form__label" htmlFor="broadcast-title">
                Title <span className="notification-form__hint">(max 100)</span>
              </label>
              <input
                id="broadcast-title"
                type="text"
                className="notification-form__input"
                maxLength={100}
                value={broadcast.title}
                onChange={(e) => setBroadcast((s) => ({ ...s, title: e.target.value }))}
                placeholder="Notification title"
              />
              <span className="notification-form__counter">
                {broadcast.title.length}/100
              </span>
            </div>

            <div className="notification-form__group">
              <label className="notification-form__label" htmlFor="broadcast-message">
                Message <span className="notification-form__hint">(max 1000)</span>
              </label>
              <textarea
                id="broadcast-message"
                className="notification-form__textarea"
                maxLength={1000}
                rows={5}
                value={broadcast.message}
                onChange={(e) => setBroadcast((s) => ({ ...s, message: e.target.value }))}
                placeholder="Notification message..."
              />
              <span className="notification-form__counter">
                {broadcast.message.length}/1000
              </span>
            </div>

            <button
              type="submit"
              className="notification-form__submit"
              disabled={broadcastLoading}
            >
              {broadcastLoading ? 'Sending...' : 'Send broadcast'}
            </button>
          </form>
        )}

        {tab === 'send' && (
          <form className="notification-form" onSubmit={handleSend} noValidate>
            <p className="notification-form__desc">
              Send a notification to <strong>specific users</strong> by their IDs.
              Users who are inactive or unverified will be skipped.
            </p>

            {sendError && (
              <p className="notification-form__error">{sendError}</p>
            )}
            {sendResult && (
              <p className="notification-form__success">{sendResult}</p>
            )}

            <div className="notification-form__group">
              <label className="notification-form__label" htmlFor="user-ids">
                User IDs <span className="notification-form__hint">(one per line, max 500)</span>
              </label>
              <textarea
                id="user-ids"
                className="notification-form__textarea"
                rows={4}
                value={userIdsRaw}
                onChange={(e) => setUserIdsRaw(e.target.value)}
                placeholder={'uuid-1\nuuid-2\nuuid-3'}
              />
            </div>

            <div className="notification-form__group">
              <label className="notification-form__label" htmlFor="send-title">
                Title <span className="notification-form__hint">(max 100)</span>
              </label>
              <input
                id="send-title"
                type="text"
                className="notification-form__input"
                maxLength={100}
                value={send.title}
                onChange={(e) => setSend((s) => ({ ...s, title: e.target.value }))}
                placeholder="Notification title"
              />
              <span className="notification-form__counter">
                {send.title.length}/100
              </span>
            </div>

            <div className="notification-form__group">
              <label className="notification-form__label" htmlFor="send-message">
                Message <span className="notification-form__hint">(max 1000)</span>
              </label>
              <textarea
                id="send-message"
                className="notification-form__textarea"
                maxLength={1000}
                rows={5}
                value={send.message}
                onChange={(e) => setSend((s) => ({ ...s, message: e.target.value }))}
                placeholder="Notification message..."
              />
              <span className="notification-form__counter">
                {send.message.length}/1000
              </span>
            </div>

            <button
              type="submit"
              className="notification-form__submit"
              disabled={sendLoading}
            >
              {sendLoading ? 'Sending...' : 'Send notification'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
