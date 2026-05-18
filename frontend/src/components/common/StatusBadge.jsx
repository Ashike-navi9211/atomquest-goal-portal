const configs = {
  // sheet statuses
  draft:     { label: 'Draft',     classes: 'bg-gray-100 text-gray-600' },
  submitted: { label: 'Submitted', classes: 'bg-yellow-100 text-yellow-700' },
  approved:  { label: 'Approved',  classes: 'bg-green-100 text-green-700' },
  returned:  { label: 'Returned',  classes: 'bg-red-100 text-red-600' },

  // goal statuses
  not_started: { label: 'Not Started', classes: 'bg-gray-100 text-gray-500' },
  on_track:    { label: 'On Track',    classes: 'bg-blue-100 text-blue-600' },
  completed:   { label: 'Completed',   classes: 'bg-green-100 text-green-700' }
}

const StatusBadge = ({ status }) => {
  const config = configs[status] || { label: status, classes: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${config.classes}`}>
      {config.label}
    </span>
  )
}

export default StatusBadge
