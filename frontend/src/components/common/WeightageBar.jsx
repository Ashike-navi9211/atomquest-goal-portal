const WeightageBar = ({ goals }) => {
  const total = goals.reduce((sum, g) => sum + (g.weightage || 0), 0)
  const remaining = 100 - total
  const isValid = total === 100
  const isOver = total > 100

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Total Weightage
        </span>
        <span className={`text-sm font-bold ${
          isOver ? 'text-red-600' : isValid ? 'text-green-600' : 'text-yellow-600'
        }`}>
          {total}% / 100%
        </span>
      </div>

      {/* progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            isOver ? 'bg-red-500' : isValid ? 'bg-green-500' : 'bg-yellow-400'
          }`}
          style={{ width: `${Math.min(total, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>
          {isOver
            ? `Over by ${Math.abs(remaining)}%`
            : isValid
            ? 'Ready to submit'
            : `${remaining}% remaining`}
        </span>
        <span>{goals.length} / 8 goals</span>
      </div>
    </div>
  )
}

export default WeightageBar
