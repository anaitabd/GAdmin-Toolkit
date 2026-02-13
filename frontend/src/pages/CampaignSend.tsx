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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!campaignName.trim()) {
      errors.campaignName = 'Campaign name is required'
    }
    
    if (!selectedOfferId) {
      errors.offer = 'Please select an offer'
    }
    
    if (selectedListIds.length === 0) {
      errors.dataLists = 'Please select at least one data list'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

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
    setError('')
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
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to generate preview')
        setPreviewData(null)
      })
      .finally(() => setLoading(false))
  }

  // Start campaign
  const handleStart = () => {
    // Clear previous errors
    setError('')
    setValidationErrors({})
    
    // Validate form
    if (!validateForm()) {
      setError('Please fix the validation errors before starting the campaign')
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

  // Helper function for number input handling
  const handleNumberInput = (value: string, min: number, max: number, defaultValue: number, setter: (val: number) => void) => {
    if (value === '') {
      setter(0);
    } else {
      const parsed = parseInt(value);
      setter(isNaN(parsed) ? 0 : Math.max(min, Math.min(max, parsed)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Campaign</h1>
          <p className="text-lg text-gray-600">
            Configure and launch a new email campaign with G Suite management
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-200 p-5 shadow-sm">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Campaign Info */}
        <div className="mb-6 rounded-xl border-2 border-gray-200 bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-2xl font-bold text-gray-900 ml-4">Campaign Information</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={e => {
                  setCampaignName(e.target.value)
                  if (validationErrors.campaignName) {
                    setValidationErrors(prev => ({ ...prev, campaignName: '' }))
                  }
                }}
                className={`w-full rounded-lg border-2 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  validationErrors.campaignName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="e.g., February Health Drop 2026"
              />
              {validationErrors.campaignName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.campaignName}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">Choose a descriptive name to identify this campaign</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Provider
              </label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as 'gmail_api' | 'smtp')}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="gmail_api">Gmail API (Recommended)</option>
                <option value="smtp">SMTP</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {provider === 'gmail_api' 
                  ? 'Uses Google API for better deliverability and tracking' 
                  : 'Uses SMTP protocol for email delivery'}
              </p>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                rows={3}
                placeholder="Optional: Add details about this campaign's purpose and audience"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Sponsor Section */}
        <div className="mb-6 rounded-xl border-2 border-gray-200 bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-2xl font-bold text-gray-900 ml-4">Sponsor & Content</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Affiliate Network</label>
              <select
                value={selectedNetworkId || ''}
                onChange={e => setSelectedNetworkId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="">Select Network (Optional)</option>
                {availableNetworks.map((n: any) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">Select an affiliate network if this campaign is network-specific</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Offer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedOfferId || ''}
                onChange={e => {
                  setSelectedOfferId(e.target.value ? parseInt(e.target.value) : null)
                  if (validationErrors.offer) {
                    setValidationErrors(prev => ({ ...prev, offer: '' }))
                  }
                }}
                className={`w-full rounded-lg border-2 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  validationErrors.offer ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select an Offer</option>
                {filteredOffers.map((o: any) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              {validationErrors.offer && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.offer}</p>
              )}
              {loading && selectedOfferId && (
                <p className="mt-2 text-xs text-indigo-600">Loading offer details...</p>
              )}
            </div>

            {selectedOfferId && (
              <>
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border-2 border-indigo-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rotationEnabled}
                      onChange={e => setRotationEnabled(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-800">Enable Content Rotation</span>
                      <p className="text-xs text-gray-600 mt-1">Automatically cycle through all active creatives, from names, and subjects for better engagement</p>
                    </div>
                  </label>
                </div>

                {!rotationEnabled && (
                  <div className="grid grid-cols-3 gap-4 pl-4 border-l-4 border-gray-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Creative</label>
                      <select
                        value={selectedCreativeId || ''}
                        onChange={e => setSelectedCreativeId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Random</option>
                        {creatives.map(c => (
                          <option key={c.id} value={c.id}>{c.subject}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">{creatives.length} available</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">From Name</label>
                      <select
                        value={selectedFromNameId || ''}
                        onChange={e => setSelectedFromNameId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Random</option>
                        {fromNames.map(f => (
                          <option key={f.id} value={f.id}>{f.value}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">{fromNames.length} available</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Line</label>
                      <select
                        value={selectedSubjectId || ''}
                        onChange={e => setSelectedSubjectId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Random</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.value}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">{subjects.length} available</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Step 3: Data Section */}
        <div className="mb-6 rounded-xl border-2 border-gray-200 bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-2xl font-bold text-gray-900 ml-4">Recipient Data</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data Providers <span className="text-red-500">*</span>
              </label>
              <div className="max-h-40 overflow-y-auto border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                {availableProviders.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">No data providers available</p>
                ) : (
                  availableProviders.map((p: any) => (
                    <label key={p.id} className="flex items-center gap-3 py-2 px-2 hover:bg-white rounded transition-colors cursor-pointer">
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
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{p.name}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">Select one or more data providers to source recipients</p>
            </div>

            {dataLists.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data Lists <span className="text-red-500">*</span>
                </label>
                <div className="max-h-56 overflow-y-auto border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                  {dataLists.map(list => (
                    <label key={list.id} className="flex items-center justify-between gap-3 py-2 px-2 hover:bg-white rounded transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedListIds.includes(list.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedListIds([...selectedListIds, list.id])
                            } else {
                              setSelectedListIds(selectedListIds.filter(id => id !== list.id))
                            }
                            if (validationErrors.dataLists) {
                              setValidationErrors(prev => ({ ...prev, dataLists: '' }))
                            }
                          }}
                          className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{list.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">
                        {list.available_count.toLocaleString()}
                      </span>
                    </label>
                  ))}
                </div>
                {validationErrors.dataLists && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.dataLists}</p>
                )}
                <div className="mt-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-900">
                    Total Selected: {dataLists.filter(l => selectedListIds.includes(l.id)).reduce((sum, l) => sum + l.available_count, 0).toLocaleString()} emails
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Geographic Filter</label>
              <input
                type="text"
                value={geoFilter}
                onChange={e => setGeoFilter(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="e.g., US, UK, CA (comma separated)"
              />
              <p className="mt-2 text-xs text-gray-500">Optional: Filter recipients by country codes</p>
            </div>
          </div>
        </div>

        {/* Step 4: Sending Config */}
        <div className="mb-6 rounded-xl border-2 border-gray-200 bg-white p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h2 className="text-2xl font-bold text-gray-900 ml-4">Sending Configuration</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Batch Size</label>
              <input
                type="number"
                value={batchSize}
                onChange={e => handleNumberInput(e.target.value, 1, 1000, 300, setBatchSize)}
                onBlur={() => {
                  if (batchSize === 0) setBatchSize(300);
                }}
                min="1"
                max="1000"
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500">Emails per batch (1-1000)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Delay (ms)</label>
              <input
                type="number"
                value={batchDelay}
                onChange={e => handleNumberInput(e.target.value, 0, 10000, 50, setBatchDelay)}
                onBlur={() => {
                  if (batchDelay === 0) setBatchDelay(50);
                }}
                min="0"
                max="10000"
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500">Delay between batches (0-10000ms)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Limit</label>
              <input
                type="number"
                value={recipientLimit}
                onChange={e => setRecipientLimit(e.target.value)}
                min="0"
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="No limit"
              />
              <p className="mt-2 text-xs text-gray-500">Max recipients (optional)</p>
            </div>
          </div>
        </div>

        {/* Preview */}
        {previewData && (
          <div className="mb-6 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <svg className="h-8 w-8 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-green-900">Campaign Preview</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                <p className="text-sm text-gray-600 mb-1">Estimated Recipients</p>
                <p className="text-3xl font-bold text-green-700">{previewData.estimated_recipients.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                <p className="text-sm text-gray-600 mb-1">Total Excluded</p>
                <p className="text-3xl font-bold text-red-700">{previewData.excluded_count.total.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">Blacklisted</p>
                <p className="text-lg font-bold text-gray-900">{previewData.excluded_count.blacklisted.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">Suppressed</p>
                <p className="text-lg font-bold text-gray-900">{previewData.excluded_count.suppressed.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">Bounced</p>
                <p className="text-lg font-bold text-gray-900">{previewData.excluded_count.bounced.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">Unsubscribed</p>
                <p className="text-lg font-bold text-gray-900">{previewData.excluded_count.unsubbed.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 sticky bottom-4 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-2xl">
          <button
            onClick={handlePreview}
            disabled={loading || selectedListIds.length === 0}
            className="px-8 py-3 rounded-lg border-2 border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {loading ? 'Generating Preview...' : 'Preview Campaign'}
          </button>
          <button
            onClick={handleStart}
            disabled={loading || !campaignName || !selectedOfferId || selectedListIds.length === 0}
            className="px-10 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Starting Campaign...
              </span>
            ) : (
              '🚀 START CAMPAIGN'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
