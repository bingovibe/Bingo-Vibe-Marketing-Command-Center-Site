
interface DateRange {
  startDate: string;
  endDate: string;
}

interface MetricsOverviewProps {
  dateRange: DateRange | null;
  selectedPlatforms: string[];
}

export default function MetricsOverview({ dateRange, selectedPlatforms }: MetricsOverviewProps) {
  const metrics = [
    {
      name: 'Total Impressions',
      value: '2.4M',
      change: '+12.5%',
      changeType: 'increase'
    },
    {
      name: 'Engagement Rate',
      value: '8.7%',
      change: '+2.1%',
      changeType: 'increase'
    },
    {
      name: 'Click-through Rate',
      value: '3.2%',
      change: '-0.3%',
      changeType: 'decrease'
    },
    {
      name: 'Conversion Rate',
      value: '1.8%',
      change: '+0.5%',
      changeType: 'increase'
    },
    {
      name: 'Cost Per Click',
      value: '$0.45',
      change: '-8.2%',
      changeType: 'decrease'
    },
    {
      name: 'Return on Ad Spend',
      value: '340%',
      change: '+15.3%',
      changeType: 'increase'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <div key={metric.name} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{metric.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
            </div>
            <div className={`text-sm font-medium ${
              metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {metric.change}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <div className={`h-2 rounded-full ${
                metric.changeType === 'increase' ? 'bg-green-200' : 'bg-red-200'
              }`} style={{width: '100%'}}>
                <div 
                  className={`h-2 rounded-full ${
                    metric.changeType === 'increase' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{width: `${Math.abs(parseFloat(metric.change)) * 5}%`}}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
