/**
 * Campaign Send Page - Phase 7
 * Cascading UI for creating campaigns with full offer integration
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as campaignSendApi from '../api/campaignSend'
import { useOffers } from '../hooks/useOffers'
import { useQuery } from '@tanstack/react-query'
import * as affiliateNetworksApi from '../api/affiliateNetworks'
import * as dataProvidersApi from '../api/dataProviders'

export default function CampaignSend() {
  const navigate = useNavigate()
  const { data: offers } = useOffers()
  const { data: networks } = useQuery({
    queryKey: ['affiliateNetworks'],
    queryFn: () => affiliateNetworksApi.getAll()
  })
  const { data: providers } = useQuery({
    queryKey: ['dataProviders'],
    queryFn: () => dataProvidersApi.getAll()
  })

  // Form state
  const [campaignName, setCampaignName] = useState('')
  const [description, setDescription] = useState('')
  const [provider, setProvider] = useState<'gmail_api' | 'smtp'>('gmail_api')
  
  // Offer selection
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null)
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null)
  
  // Offer details (loaded after offer selection)
  const [fromNames, setFromNames] = useState<Array<{ id: number; value: string }>>([])
  const [subjects, setSubjects] = useState<Array<{ id: number; value: string }>>([])
  const [creatives, setCreatives] = useState<Array<{ id: number; subject: string; from_name: string; html_content: string }>>([])
  
  const [selectedCreativeId, setSelectedCreativeId] = useState<number | null>(null)
  const [selectedFromNameId, setSelectedFromNameId] = useState<number | null>(null)
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [rotationEnabled, setRotationEnabled] = useState(false)
  
  // Data selection
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([])
  const [dataLists, setDataLists] = useState<campaignSendApi.DataList[]>([])
  const [selectedListIds, setSelectedListIds] = useState<number[]>([])
  const [geoFilter, setGeoFilter] = useState('')
  
  // Sending config
  const [batchSize, setBatchSize] = useState(300)
  const [batchDelay, setBatchDelay] = useState(50)
  const [recipientLimit, setRecipientLimit] = useState('')
  
  // Preview data
  const [previewData, setPreviewData] = useState<campaignSendApi.PreviewResponse | null>(null)
  
  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load offer details when offer is selected
  useEffect(() => {
    if (selectedOfferId) {
      setLoading(true)
      campaignSendApi.resolveOffer(selectedOfferId)
        .then(response => {
          setFromNames(response.data.from_names)
          setSubjects(response.data.subjects)
          setCreatives(response.data.creatives)
          setError('')
        })
        .catch(err => setError(err.response?.data?.error || 'Failed to load offer details'))
        .finally(() => setLoading(false))
    }
  }, [selectedOfferId])

  // Load data lists when providers are selected
  useEffect(() => {
    if (selectedProviderIds.length > 0) {
      setLoading(true)
      campaignSendApi.resolveLists({
        data_provider_ids: selectedProviderIds,
        offer_id: selectedOfferId || undefined,
        geo: geoFilter || undefined
      })
        .then(response => {
          setDataLists(response.data.data_lists)
          setError('')
        })
        .catch(err => setError(err.response?.data?.error || 'Failed to load data lists'))
        .finally(() => setLoading(false))
    }
  }, [selectedProviderIds, selectedOfferId, geoFilter])

  // Preview campaign
  const handlePreview = () => {
    if (selectedListIds.length === 0) {
      setError('Please select at least one data list')
      return
    }

    setLoading(true)
    campaignSendApi.preview({
      offer_id: selectedOfferId || undefined,
      creative_id: selectedCreativeId || undefined,
      from_name_id: selectedFromNameId || undefined,
      subject_id: selectedSubjectId || undefined,
      data_list_ids: selectedListIds,
      geo: geoFilter || undefined
    })
      .then(response => {
        setPreviewData(response.data)
        setError('')
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to generate preview'))
      .finally(() => setLoading(false))
  }

  // Start campaign
  const handleStart = () => {
    if (!campaignName || !selectedOfferId || selectedListIds.length === 0) {
      setError('Please fill in all required fields: Campaign Name, Offer, and Data Lists')
      return
    }

    setLoading(true)
    campaignSendApi.start({
      name: campaignName,
      description: description || undefined,
      offer_id: selectedOfferId,
      affiliate_network_id: selectedNetworkId || undefined,
      creative_id: selectedCreativeId || undefined,
      from_name_id: selectedFromNameId || undefined,
      subject_id: selectedSubjectId || undefined,
      data_list_ids: selectedListIds,
      provider,
      batch_size: batchSize,
      batch_delay_ms: batchDelay,
      recipient_limit: recipientLimit ? parseInt(recipientLimit) : undefined,
      rotation_enabled: rotationEnabled,
      geo: geoFilter || undefined
    })
      .then(response => {
        navigate(`/campaign-monitor/${response.data.campaign_id}`)
      })
      .catch((err: any) => setError(err.response?.data?.error || 'Failed to start campaign'))
      .finally(() => setLoading(false))
  }

  const filteredOffers = offers?.data || []
  const availableNetworks = networks?.data || []
  const availableProviders = providers?.data || []

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
        <p className="mt-2 text-sm text-gray-600">Configure and launch a new email campaign</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Info */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
            <input
              type="text"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., February Health Drop"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as 'gmail_api' | 'smtp')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="gmail_api">Gmail API</option>
              <option value="smtp">SMTP</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              rows={2}
              placeholder="Optional campaign description"
            />
          </div>
        </div>
      </div>

      {/* Sponsor Section */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sponsor Section</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Network</label>
            <select
              value={selectedNetworkId || ''}
              onChange={e => setSelectedNetworkId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Network (Optional)</option>
              {availableNetworks.map((n: any) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer *</label>
            <select
              value={selectedOfferId || ''}
              onChange={e => setSelectedOfferId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select Offer</option>
              {filteredOffers.map((o: any) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {selectedOfferId && (
            <>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rotationEnabled}
                    onChange={e => setRotationEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Rotation (cycle through all active options)</span>
                </label>
              </div>

              {!rotationEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Creative</label>
                    <select
                      value={selectedCreativeId || ''}
                      onChange={e => setSelectedCreativeId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Random</option>
                      {creatives.map(c => (
                        <option key={c.id} value={c.id}>{c.subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                    <select
                      value={selectedFromNameId || ''}
                      onChange={e => setSelectedFromNameId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Random</option>
                      {fromNames.map(f => (
                        <option key={f.id} value={f.id}>{f.value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={selectedSubjectId || ''}
                      onChange={e => setSelectedSubjectId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Random</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.value}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Data Section */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Section</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Providers *</label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {availableProviders.map((p: any) => (
                <label key={p.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedProviderIds.includes(p.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedProviderIds([...selectedProviderIds, p.id])
                      } else {
                        setSelectedProviderIds(selectedProviderIds.filter(id => id !== p.id))
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          {dataLists.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Lists *</label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {dataLists.map(list => (
                  <label key={list.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedListIds.includes(list.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedListIds([...selectedListIds, list.id])
                        } else {
                          setSelectedListIds(selectedListIds.filter(id => id !== list.id))
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{list.name} ({list.available_count.toLocaleString()})</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Total Selected: {dataLists.filter(l => selectedListIds.includes(l.id)).reduce((sum, l) => sum + l.available_count, 0).toLocaleString()} emails
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Geo Filter</label>
            <input
              type="text"
              value={geoFilter}
              onChange={e => setGeoFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., US, UK"
            />
          </div>
        </div>
      </div>

      {/* Sending Config */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sending Config</h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
            <input
              type="number"
              value={batchSize}
              onChange={e => setBatchSize(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delay (ms)</label>
            <input
              type="number"
              value={batchDelay}
              onChange={e => setBatchDelay(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limit (optional)</label>
            <input
              type="number"
              value={recipientLimit}
              onChange={e => setRecipientLimit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="No limit"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      {previewData && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Estimated Recipients:</strong> {previewData.estimated_recipients.toLocaleString()}</p>
            <p><strong>Excluded:</strong> {previewData.excluded_count.total.toLocaleString()} 
              (blacklisted: {previewData.excluded_count.blacklisted}, 
               suppressed: {previewData.excluded_count.suppressed}, 
               bounced: {previewData.excluded_count.bounced}, 
               unsubbed: {previewData.excluded_count.unsubbed})
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handlePreview}
          disabled={loading || selectedListIds.length === 0}
          className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Preview
        </button>
        <button
          onClick={handleStart}
          disabled={loading || !campaignName || !selectedOfferId || selectedListIds.length === 0}
          className="px-8 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'START CAMPAIGN'}
        </button>
      </div>
    </div>
  )
}
