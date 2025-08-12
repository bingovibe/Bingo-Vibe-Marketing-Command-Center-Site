
'use client'
import { useState, useCallback, useEffect } from 'react'
import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar'
import moment from 'moment'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import useSWR from 'swr'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface CalendarEvent extends Event {
  id: string
  character: string
  platform: string
  status: 'draft' | 'scheduled' | 'published'
  content: string
  optimalTime?: string
}

interface SeasonalTemplate {
  id: string
  name: string
  season: string
  templates: Array<{
    character: string
    platform: string
    content: string
    suggestedTime: string
  }>
}

const seasonalTemplates: SeasonalTemplate[] = [
  {
    id: 'winter-holidays',
    name: 'Winter Holidays Campaign',
    season: 'Winter',
    templates: [
      {
        character: 'Grandma Rose',
        platform: 'Facebook',
        content: 'Cozy family moments this holiday season! ❄️🎄',
        suggestedTime: '18:00'
      },
      {
        character: 'Zara',
        platform: 'TikTok', 
        content: 'Holiday outfit inspo coming your way! ✨',
        suggestedTime: '19:00'
      }
    ]
  },
  {
    id: 'summer-vibes',
    name: 'Summer Vibes Campaign',
    season: 'Summer',
    templates: [
      {
        character: 'Caven',
        platform: 'Instagram',
        content: 'Summer adventures with the family! ☀️🏖️',
        suggestedTime: '17:00'
      },
      {
        character: 'Coach Martinez',
        platform: 'LinkedIn',
        content: 'Professional growth doesn\'t take a summer break! 💪',
        suggestedTime: '08:00'
      }
    ]
  }
]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ContentCalendar() {
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<SeasonalTemplate | null>(null)

  // Fetch calendar data
  const { data: calendarData, mutate } = useSWR('/api/calendar', fetcher, {
    refreshInterval: 30000 // Refresh every 30 seconds
  })

  // Fetch optimal posting times
  const { data: optimalTimes } = useSWR('/api/analytics/optimal-times', fetcher)

  useEffect(() => {
    if (calendarData?.events) {
      const formattedEvents = calendarData.events.map((event: any) => ({
        ...event,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        title: `${event.character} - ${event.platform}`
      }))
      setEvents(formattedEvents)
    }
  }, [calendarData])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // Navigate to edit event
    window.location.href = `/scheduler?edit=${event.id}`
  }, [])

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      const character = prompt('Select character:')
      const platform = prompt('Select platform:')
      const content = prompt('Enter content:')
      
      if (character && platform && content) {
        const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          start,
          end,
          title: `${character} - ${platform}`,
          character,
          platform,
          content,
          status: 'draft',
          optimalTime: optimalTimes?.[platform]?.find((time: any) => 
            moment(start).format('dddd') === time.day
          )?.time
        }
        
        setEvents(prev => [...prev, newEvent])
        
        // Save to API
        fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: start,
            endDate: end,
            character,
            platform,
            content,
            status: 'draft'
          })
        }).then(() => mutate())
      }
    },
    [optimalTimes, mutate]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = events.findIndex(e => e.id === active.id)
      const newIndex = events.findIndex(e => e.id === over.id)
      
      setEvents(arrayMove(events, oldIndex, newIndex))
      
      // Update API
      fetch(`/api/calendar/${active.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newIndex })
      }).then(() => mutate())
    }
  }

  const applySeasonalTemplate = (template: SeasonalTemplate) => {
    const templateEvents = template.templates.map((item, index) => {
      const eventDate = moment(date).add(index + 1, 'days').toDate()
      const [hours, minutes] = item.suggestedTime.split(':')
      eventDate.setHours(parseInt(hours), parseInt(minutes))
      
      return {
        id: `template-${Date.now()}-${index}`,
        start: eventDate,
        end: moment(eventDate).add(1, 'hour').toDate(),
        title: `${item.character} - ${item.platform}`,
        character: item.character,
        platform: item.platform,
        content: item.content,
        status: 'draft' as const,
        optimalTime: item.suggestedTime
      }
    })
    
    setEvents(prev => [...prev, ...templateEvents])
    setSelectedTemplate(null)
    setShowTemplates(false)
    
    // Save to API
    fetch('/api/calendar/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: templateEvents })
    }).then(() => mutate())
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const colors = {
      draft: { backgroundColor: '#FEF3C7', color: '#92400E' },
      scheduled: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
      published: { backgroundColor: '#D1FAE5', color: '#065F46' }
    }
    
    return {
      style: {
        ...colors[event.status],
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px'
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Content Calendar</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Seasonal Templates
            </button>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm ${view === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 text-sm ${view === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1 text-sm ${view === 'day' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
              >
                Day
              </button>
            </div>
          </div>
        </div>
        
        {/* Seasonal Templates Modal */}
        {showTemplates && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-medium mb-3">Seasonal Campaign Templates</h4>
            <div className="grid grid-cols-2 gap-4">
              {seasonalTemplates.map(template => (
                <div key={template.id} className="p-3 bg-white rounded border">
                  <h5 className="font-medium">{template.name}</h5>
                  <p className="text-sm text-gray-600 mb-2">{template.season} Season</p>
                  <p className="text-sm text-gray-500 mb-3">{template.templates.length} posts included</p>
                  <button
                    onClick={() => applySeasonalTemplate(template)}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Apply Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div style={{ height: 600 }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              formats={{
                eventTimeRangeFormat: () => '',
                timeGutterFormat: 'HH:mm'
              }}
              components={{
                event: ({ event }) => (
                  <div className="text-xs">
                    <div className="font-medium truncate">{event.title}</div>
                    {event.optimalTime && (
                      <div className="text-green-600">⏰ {event.optimalTime}</div>
                    )}
                  </div>
                )
              }}
            />
          </div>
        </DndContext>
        
        {/* Legend */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>Draft</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>Published</span>
          </div>
        </div>
      </div>
    </div>
  )
}
