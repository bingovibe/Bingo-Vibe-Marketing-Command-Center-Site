
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'

export interface ExportData {
  filename: string
  data: any[]
  columns: string[]
  title?: string
  summary?: Record<string, any>
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  includeHeaders: boolean
  customFields?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: Record<string, any>
}

// CSV Export
export const exportToCSV = (exportData: ExportData, options: ExportOptions = { format: 'csv', includeHeaders: true }) => {
  try {
    const { data, columns, filename } = exportData
    
    // Filter data based on custom fields if provided
    const filteredData = options.customFields 
      ? data.map(row => {
          const filteredRow: any = {}
          options.customFields!.forEach(field => {
            if (row[field] !== undefined) {
              filteredRow[field] = row[field]
            }
          })
          return filteredRow
        })
      : data

    // Apply date range filter if provided
    let finalData = filteredData
    if (options.dateRange) {
      finalData = filteredData.filter(row => {
        const rowDate = new Date(row.createdAt || row.date || row.timestamp)
        return rowDate >= options.dateRange!.start && rowDate <= options.dateRange!.end
      })
    }

    const csv = Papa.unparse(finalData, {
      header: options.includeHeaders,
      columns: options.customFields || columns
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${filename}.csv`)
    
    return { success: true, message: 'CSV exported successfully' }
  } catch (error) {
    console.error('CSV Export Error:', error)
    return { success: false, message: 'Failed to export CSV' }
  }
}

// JSON Export
export const exportToJSON = (exportData: ExportData, options: ExportOptions = { format: 'json', includeHeaders: true }) => {
  try {
    const { data, filename, title, summary } = exportData
    
    // Filter data based on custom fields if provided
    const filteredData = options.customFields 
      ? data.map(row => {
          const filteredRow: any = {}
          options.customFields!.forEach(field => {
            if (row[field] !== undefined) {
              filteredRow[field] = row[field]
            }
          })
          return filteredRow
        })
      : data

    // Apply date range filter if provided
    let finalData = filteredData
    if (options.dateRange) {
      finalData = filteredData.filter(row => {
        const rowDate = new Date(row.createdAt || row.date || row.timestamp)
        return rowDate >= options.dateRange!.start && rowDate <= options.dateRange!.end
      })
    }

    const exportObject = {
      title: title || 'Export Data',
      exportDate: new Date().toISOString(),
      summary,
      filters: options.filters,
      totalRecords: finalData.length,
      data: finalData
    }

    const jsonString = JSON.stringify(exportObject, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
    saveAs(blob, `${filename}.json`)
    
    return { success: true, message: 'JSON exported successfully' }
  } catch (error) {
    console.error('JSON Export Error:', error)
    return { success: false, message: 'Failed to export JSON' }
  }
}

// PDF Export
export const exportToPDF = (exportData: ExportData, options: ExportOptions = { format: 'pdf', includeHeaders: true }) => {
  try {
    const { data, columns, filename, title, summary } = exportData
    
    // Filter data based on custom fields if provided
    const filteredData = options.customFields 
      ? data.map(row => {
          const filteredRow: any = {}
          options.customFields!.forEach(field => {
            if (row[field] !== undefined) {
              filteredRow[field] = row[field]
            }
          })
          return filteredRow
        })
      : data

    // Apply date range filter if provided
    let finalData = filteredData
    if (options.dateRange) {
      finalData = filteredData.filter(row => {
        const rowDate = new Date(row.createdAt || row.date || row.timestamp)
        return rowDate >= options.dateRange!.start && rowDate <= options.dateRange!.end
      })
    }

    const doc = new jsPDF()
    
    // Add title
    if (title) {
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(title, 14, 22)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
    }

    let yPosition = title ? 35 : 20

    // Add summary if provided
    if (summary) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary', 14, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      Object.entries(summary).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 14, yPosition)
        yPosition += 6
      })
      
      yPosition += 10
    }

    // Add export info
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, yPosition)
    doc.text(`Total Records: ${finalData.length}`, 14, yPosition + 4)
    yPosition += 15

    // Prepare table data
    const tableColumns = options.customFields || columns
    const tableHeaders = tableColumns.map(col => 
      col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')
    )
    
    const tableData = finalData.map(row => 
      tableColumns.map(col => {
        const value = row[col]
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value)
      })
    )

    // Add table
    autoTable(doc, {
      head: options.includeHeaders ? [tableHeaders] : undefined,
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [139, 69, 19], // Purple theme
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 'auto' }
      },
      margin: { top: yPosition }
    })

    doc.save(`${filename}.pdf`)
    
    return { success: true, message: 'PDF exported successfully' }
  } catch (error) {
    console.error('PDF Export Error:', error)
    return { success: false, message: 'Failed to export PDF' }
  }
}

// Social Media Content Export
export const exportSocialMediaContent = async (
  campaigns: string[] = [],
  platforms: string[] = [],
  dateRange?: { start: Date; end: Date }
) => {
  try {
    const params = new URLSearchParams()
    if (campaigns.length) params.append('campaigns', campaigns.join(','))
    if (platforms.length) params.append('platforms', platforms.join(','))
    if (dateRange) {
      params.append('startDate', dateRange.start.toISOString())
      params.append('endDate', dateRange.end.toISOString())
    }

    const response = await fetch(`/api/posts?${params}`)
    const data = await response.json()

    const exportData: ExportData = {
      filename: `social-media-content-${new Date().toISOString().split('T')[0]}`,
      data: data.posts || [],
      columns: ['id', 'character', 'platform', 'content', 'status', 'scheduledDate', 'publishedDate', 'engagement'],
      title: 'Social Media Content Export',
      summary: {
        'Total Posts': data.posts?.length || 0,
        'Platforms': platforms.length ? platforms.join(', ') : 'All',
        'Campaigns': campaigns.length ? campaigns.join(', ') : 'All'
      }
    }

    return exportData
  } catch (error) {
    console.error('Error fetching social media content:', error)
    throw new Error('Failed to fetch social media content')
  }
}

// Analytics Reports Export
export const exportAnalyticsReport = async (
  metrics: string[] = [],
  platforms: string[] = [],
  dateRange?: { start: Date; end: Date }
) => {
  try {
    const params = new URLSearchParams()
    if (metrics.length) params.append('metrics', metrics.join(','))
    if (platforms.length) params.append('platforms', platforms.join(','))
    if (dateRange) {
      params.append('startDate', dateRange.start.toISOString())
      params.append('endDate', dateRange.end.toISOString())
    }

    const response = await fetch(`/api/analytics?${params}`)
    const data = await response.json()

    const exportData: ExportData = {
      filename: `analytics-report-${new Date().toISOString().split('T')[0]}`,
      data: data.analytics || [],
      columns: ['date', 'platform', 'reach', 'impressions', 'engagement', 'clicks', 'conversions'],
      title: 'Analytics Report',
      summary: {
        'Total Reach': data.summary?.totalReach || 0,
        'Total Impressions': data.summary?.totalImpressions || 0,
        'Average Engagement': `${data.summary?.avgEngagement || 0}%`,
        'Total Clicks': data.summary?.totalClicks || 0,
        'Total Conversions': data.summary?.totalConversions || 0
      }
    }

    return exportData
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    throw new Error('Failed to fetch analytics data')
  }
}

// Campaign Data Export
export const exportCampaignData = async (
  campaignIds: string[] = [],
  includeMetrics: boolean = true
) => {
  try {
    const params = new URLSearchParams()
    if (campaignIds.length) params.append('ids', campaignIds.join(','))
    if (includeMetrics) params.append('includeMetrics', 'true')

    const response = await fetch(`/api/campaigns?${params}`)
    const data = await response.json()

    const exportData: ExportData = {
      filename: `campaign-data-${new Date().toISOString().split('T')[0]}`,
      data: data.campaigns || [],
      columns: ['id', 'name', 'status', 'budget', 'spent', 'roi', 'startDate', 'endDate', 'platform', 'character'],
      title: 'Campaign Data Export',
      summary: {
        'Total Campaigns': data.campaigns?.length || 0,
        'Total Budget': `$${data.summary?.totalBudget || 0}`,
        'Total Spent': `$${data.summary?.totalSpent || 0}`,
        'Average ROI': `${data.summary?.avgROI || 0}%`
      }
    }

    return exportData
  } catch (error) {
    console.error('Error fetching campaign data:', error)
    throw new Error('Failed to fetch campaign data')
  }
}

// Influencer Lists Export
export const exportInfluencerList = async (
  status: string[] = [],
  platforms: string[] = []
) => {
  try {
    const params = new URLSearchParams()
    if (status.length) params.append('status', status.join(','))
    if (platforms.length) params.append('platforms', platforms.join(','))

    const response = await fetch(`/api/influencers?${params}`)
    const data = await response.json()

    const exportData: ExportData = {
      filename: `influencer-list-${new Date().toISOString().split('T')[0]}`,
      data: data.influencers || [],
      columns: ['id', 'name', 'email', 'platform', 'followers', 'engagementRate', 'status', 'lastContact'],
      title: 'Influencer List Export',
      summary: {
        'Total Influencers': data.influencers?.length || 0,
        'Active': data.summary?.active || 0,
        'Pending': data.summary?.pending || 0,
        'Average Engagement': `${data.summary?.avgEngagement || 0}%`
      }
    }

    return exportData
  } catch (error) {
    console.error('Error fetching influencer data:', error)
    throw new Error('Failed to fetch influencer data')
  }
}

// Scheduled Export (for email delivery)
export const scheduleExport = async (
  exportType: 'content' | 'analytics' | 'campaigns' | 'influencers',
  schedule: 'daily' | 'weekly' | 'monthly',
  email: string,
  options: any = {}
) => {
  try {
    const response = await fetch('/api/exports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exportType,
        schedule,
        email,
        options,
        createdAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error('Failed to schedule export')
    }

    return { success: true, message: 'Export scheduled successfully' }
  } catch (error) {
    console.error('Error scheduling export:', error)
    return { success: false, message: 'Failed to schedule export' }
  }
}

// Universal Export Function
export const universalExport = async (
  exportType: 'content' | 'analytics' | 'campaigns' | 'influencers',
  format: 'csv' | 'json' | 'pdf',
  options: any = {}
) => {
  try {
    let exportData: ExportData

    switch (exportType) {
      case 'content':
        exportData = await exportSocialMediaContent(
          options.campaigns,
          options.platforms,
          options.dateRange
        )
        break
      case 'analytics':
        exportData = await exportAnalyticsReport(
          options.metrics,
          options.platforms,
          options.dateRange
        )
        break
      case 'campaigns':
        exportData = await exportCampaignData(
          options.campaignIds,
          options.includeMetrics
        )
        break
      case 'influencers':
        exportData = await exportInfluencerList(
          options.status,
          options.platforms
        )
        break
      default:
        throw new Error('Invalid export type')
    }

    const exportOptions: ExportOptions = {
      format,
      includeHeaders: options.includeHeaders !== false,
      customFields: options.customFields,
      dateRange: options.dateRange,
      filters: options.filters
    }

    switch (format) {
      case 'csv':
        return exportToCSV(exportData, exportOptions)
      case 'json':
        return exportToJSON(exportData, exportOptions)
      case 'pdf':
        return exportToPDF(exportData, exportOptions)
      default:
        throw new Error('Invalid export format')
    }
  } catch (error) {
    console.error('Universal Export Error:', error)
    return { success: false, message: `Failed to export ${exportType} as ${format}` }
  }
}
