import { useEffect, useState } from 'react'
import { IndianRupee, Zap, Loader, AlertCircle, Check } from 'lucide-react'
import { getBudgetSettings, getSettings, updateBudget, updateSettings } from '../api'

export default function BudgetSettings() {
  const [budget, setBudget] = useState('')
  const [rate, setRate]     = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [bRes, sRes] = await Promise.all([getBudgetSettings(), getSettings()])
        setBudget(bRes.data?.daily_budget ?? '')
        setRate(sRes.data?.rate_per_unit ?? '')
      } catch (err) {
        setError(err.message || 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await Promise.all([updateBudget(parseFloat(budget)), updateSettings(parseFloat(rate))])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
        <div className="skeleton h-4 w-28" />
        <div className="flex flex-col gap-4">
          {[0, 1].map(i => (
            <div key={i} className="flex flex-col gap-2">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-10 w-full rounded-lg" />
            </div>
          ))}
          <div className="skeleton h-10 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  const inputWrap = `flex items-center border border-slate-200 rounded-lg overflow-hidden
                     focus-within:ring-2 focus-within:ring-slate-300 focus-within:border-slate-300
                     transition-all duration-150`
  const inputIcon = `px-3 py-2 bg-slate-50 border-r border-slate-200 text-slate-500`
  const inputEl   = `flex-1 px-3 py-2 text-sm text-slate-800 outline-none bg-white transition-colors duration-150`

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5 card-hover animate-fade-in-up"
      style={{ animationDelay: '60ms' }}>

      <h2 className="font-semibold text-slate-800 text-base">Budget Settings</h2>

      <form onSubmit={handleSave} className="flex flex-col gap-4">

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-slate-400">Daily Budget (₹)</label>
          <div className={inputWrap}>
            <span className={inputIcon}><IndianRupee size={14} /></span>
            <input
              type="number" step="0.01" min="0" value={budget} required
              onChange={e => setBudget(e.target.value)}
              className={inputEl} placeholder="200.00"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-slate-400">Rate per Unit (₹/kWh)</label>
          <div className={inputWrap}>
            <span className={inputIcon}><Zap size={14} /></span>
            <input
              type="number" step="0.01" min="0" value={rate} required
              onChange={e => setRate(e.target.value)}
              className={inputEl} placeholder="8.00"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 animate-fade-in">
            <AlertCircle size={14} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <button
          type="submit" disabled={saving}
          className="bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium
                     hover:bg-slate-700 disabled:opacity-60
                     transition-all duration-200 active:scale-[0.98]
                     flex items-center justify-center gap-2"
        >
          {saving && <Loader size={14} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 animate-scale-in">
            <Check size={14} />
            <span className="text-sm">Settings saved</span>
          </div>
        )}
      </form>
    </div>
  )
}
