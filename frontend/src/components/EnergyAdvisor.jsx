import React, { useState } from 'react'
import { Brain, Loader, AlertCircle, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, IndianRupee, ChevronRight } from 'lucide-react'
import { runAdvisorAnalysis } from '../api'

const URGENCY_STYLES = {
  LOW: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-red-100 text-red-700'
}

export default function EnergyAdvisor() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAnalyse = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await runAdvisorAnalysis()
      setResult(res.data)
    } catch (err) {
      setError(err?.response?.data?.error || 'Analysis failed. Check that the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">AI Energy Advisor</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Analyses your full consumption profile, anomalies, and cost patterns to generate personalised recommendations.
          </p>
        </div>
        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ml-4"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Analysing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Analyse Now
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400 border border-dashed border-slate-200 rounded-lg">
          <Brain className="w-8 h-8 mb-2 text-slate-300" />
          <span className="text-sm">Click Analyse Now to generate your energy advisory report</span>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
          <Loader className="w-6 h-6 animate-spin mb-3 text-slate-400" />
          <span className="text-sm">Analysing your energy data...</span>
          <span className="text-xs text-slate-300 mt-1">This may take a few seconds</span>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <CheckCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">Overall Assessment</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCY_STYLES[result.advice.urgency_level] || URGENCY_STYLES.LOW}`}>
                  {result.advice.urgency_level}
                </span>
              </div>
              <p className="text-sm text-slate-700">{result.advice.overall_assessment}</p>
            </div>
          </div>

          {result.advice.key_issues?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-slate-800">Key Issues Found</span>
              </div>
              <div className="space-y-2">
                {result.advice.key_issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <ChevronRight className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.advice.recommendations?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-800">Recommendations</span>
              </div>
              <div className="space-y-2">
                {result.advice.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.advice.estimated_savings?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-slate-800">Estimated Savings</span>
              </div>
              <div className="space-y-2">
                {result.advice.estimated_savings.map((saving, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
                    <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-green-500" />
                    <span>{saving}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.advice.summary && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-600 leading-relaxed">{result.advice.summary}</p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
            <span>Analysed: {result.context_snapshot.date}</span>
            <span>Total: {result.context_snapshot.total_kwh} kWh</span>
            <span>Projected bill: ₹{result.context_snapshot.projected_bill}</span>
            <span>Budget stage: {result.context_snapshot.budget_stage}/3</span>
          </div>
        </div>
      )}
    </div>
  )
}
