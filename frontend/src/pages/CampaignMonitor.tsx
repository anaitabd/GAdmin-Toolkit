/**
 * Campaign Monitor Page - Phase 7
 * Real-time campaign monitoring with stats and controls
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as campaignsApi from '../api/campaigns'
import * as campaignSendApi from '../api/campaignSend'
import type { Campaign } from '../api/types'

export default function CampaignMonitor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaignId = id ? parseInt(id) : null

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Auto-refresh interval
  useEffect(() => {
    if (!campaignId) return

    const loadData = async () => {
      try {
        const [campaignData, statsData, recipientsData] = await Promise.all([
          campaignsApi.getById(campaignId),
          campaignsApi.getStats(campaignId).catch(() => null),
          campaignsApi.getRecipients(campaignId, { limit: 20 }).catch(() => ({ data: [] }))
        ])

        setCampaign(campaignData.data)
        setStats(statsData?.data || null)
        setLogs(recipientsData.data || [])
        setError('')
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load campaign data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [campaignId])

  const handlePause = async () => {
    if (!campaignId) return
    try {
      await campaignSendApi.pause(campaignId)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to pause campaign')
    }
  }

  const handleResume = async () => {
    if (!campaignId) return
    try {
      await campaignSendApi.resume(campaignId)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resume campaign')
    }
  }

  const handleKill = async () => {
    if (!campaignId) return
    if (!confirm('Are you sure you want to kill this campaign? This cannot be undone.')) return
    try {
      await campaignSendApi.kill(campaignId)
      setError('')
      setTimeout(() => navigate('/campaign'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to kill campaign')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-800">Campaign not found</p>
        </div>
      </div>
    )
  }

  const jobStatus = campaign.job_status || 'unknown'
  const progress = campaign.progress || 0
  const totalSent = stats?.sent || 0
  const totalFailed = stats?.failed || 0
  const totalOpened = stats?.total_opens || 0
  const totalClicked = stats?.total_clicks || 0
  const openRate = stats?.open_rate || 0
  const clickRate = stats?.ctr || 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'failed': case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/campaign')}
          className="mb-4 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          ← Back to Campaigns
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            {campaign.description && (
              <p className="mt-1 text-sm text-gray-600">{campaign.description}</p>
            )}
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${getStatusColor(jobStatus)}`}>
            {jobStatus.toUpperCase()}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-semibold text-gray-900">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-600">
          <span>Started: {campaign.started_at ? new Date(campaign.started_at).toLocaleString() : 'N/A'}</span>
          {campaign.completed_at && <span>Completed: {new Date(campaign.completed_at).toLocaleString()}</span>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Sent</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{totalFailed.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Failed</div>
          {totalSent > 0 && (
            <div className="text-xs text-gray-500">({((totalFailed / (totalSent + totalFailed)) * 100).toFixed(1)}%)</div>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{totalOpened.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Opened</div>
          <div className="text-xs text-gray-500">{openRate}%</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{totalClicked.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Clicked</div>
          <div className="text-xs text-gray-500">{clickRate}%</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Controls</h2>
        <div className="flex gap-4">
          {jobStatus === 'running' && (
            <button
              onClick={handlePause}
              className="px-6 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600"
            >
              ⏸ Pause
            </button>
          )}
          {jobStatus === 'paused' && (
            <button
              onClick={handleResume}
              className="px-6 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600"
            >
              ▶ Resume
            </button>
          )}
          {(jobStatus === 'running' || jobStatus === 'paused') && (
            <button
              onClick={handleKill}
              className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
            >
              ⏹ Kill
            </button>
          )}
          <button
            onClick={() => navigate(`/campaigns/${campaignId}`)}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            📊 Full Stats
          </button>
        </div>
      </div>

      {/* Live Log */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Log</h2>
        <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-400">No activity yet...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`mb-1 ${log.status === 'sent' ? 'text-green-400' : 'text-red-400'}`}>
                <span className="text-gray-500">{new Date(log.sent_at).toLocaleTimeString()}</span>
                {' '}
                <span>{log.status === 'sent' ? '✓' : '✗'}</span>
                {' '}
                <span>{log.status}</span>
                {' → '}
                <span className="text-blue-300">{log.to_email}</span>
                {log.error_message && (
                  <span className="text-red-300"> ({log.error_message})</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
