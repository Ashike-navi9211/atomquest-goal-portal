import { useEffect, useState } from 'react'
import { getAchievementReportApi, getManagerSummaryApi } from '../../api/report.api'
import { downloadExcelUrl, downloadCsvUrl } from '../../api/report.api'
import Layout from '../../components/common/Layout'
import Loader from '../../components/common/Loader'
import toast from 'react-hot-toast'

const Reports = () => {
  const [report, setReport] = useState([])
  const [managerSummary, setManagerSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('achievement')
  const cycleYear = new Date().getFullYear()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [repRes, mgrRes] = await Promise.all([
        getAchievementReportApi({ year: cycleYear }),
        getManagerSummaryApi()
      ])
      setReport(repRes.data.data || [])
      setManagerSummary(mgrRes.data.data || [])
    } catch {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = () => {
    window.open(downloadExcelUrl({ year: cycleYear }), '_blank')
  }

  const handleDownloadCsv = () => {
    window.open(downloadCsvUrl({ year: cycleYear }), '_blank')
  }

  if (loading) return <Layout><Loader /></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              FY {cycleYear} — Achievement & Completion Data
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadCsv}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={handleDownloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Export Excel
            </button>
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-2">
          {['achievement', 'manager'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'achievement' ? 'Achievement Report' : 'Manager Summary'}
            </button>
          ))}
        </div>

        {/* achievement report */}
        {activeTab === 'achievement' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {report.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                No approved goal sheets found for this cycle
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-left">Goal Title</th>
                      <th className="px-4 py-3 text-left">UoM</th>
                      <th className="px-4 py-3 text-center">Weight</th>
                      <th className="px-4 py-3 text-center">Target</th>
                      <th className="px-4 py-3 text-center">Actual</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {row.employeeName}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {row.department}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.goalTitle}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                          {row.uomType?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {row.weightage}%
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {row.target}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {row.actualAchievement}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.progressScore !== 'N/A' ? (
                            <span className={`font-bold text-sm ${
                              row.progressScore >= 90 ? 'text-green-600' :
                              row.progressScore >= 60 ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {row.progressScore}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs capitalize text-gray-500">
                          {row.status?.replace(/_/g, ' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* manager summary */}
        {activeTab === 'manager' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {managerSummary.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-400">
                No managers found
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Manager</th>
                    <th className="px-5 py-3 text-left">Department</th>
                    <th className="px-5 py-3 text-center">Team Size</th>
                    <th className="px-5 py-3 text-center">Approved</th>
                    <th className="px-5 py-3 text-center">Pending</th>
                    <th className="px-5 py-3 text-center">Not Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {managerSummary.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {row.manager.name}
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {row.manager.department || '—'}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-700">
                        {row.teamSize}
                      </td>
                      <td className="px-5 py-3 text-center text-green-600 font-semibold">
                        {row.approvedSheets}
                      </td>
                      <td className="px-5 py-3 text-center text-yellow-600 font-semibold">
                        {row.pendingApproval}
                      </td>
                      <td className="px-5 py-3 text-center text-red-500 font-semibold">
                        {row.notSubmitted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Reports
