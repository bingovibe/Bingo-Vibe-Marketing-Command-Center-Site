
import ContentCalendar from '@/components/ContentCalendar'
import CalendarControls from '@/components/CalendarControls'

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
        <p className="text-gray-600 mt-1">Plan and organize your content schedule</p>
      </div>
      
      <CalendarControls />
      <ContentCalendar />
    </div>
  )
}
