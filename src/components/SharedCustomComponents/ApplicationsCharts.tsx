"use client"

import * as React from 'react'
import * as Recharts from 'recharts'
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from '@/components/ui/chart'

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

// Mock data
const monthly = [
  { month: 'Jan', revenue: 4000, installs: 2400 },
  { month: 'Feb', revenue: 3000, installs: 2210 },
  { month: 'Mar', revenue: 5000, installs: 2290 },
  { month: 'Apr', revenue: 4780, installs: 2000 },
  { month: 'May', revenue: 5890, installs: 2181 },
  { month: 'Jun', revenue: 4390, installs: 2500 },
  { month: 'Jul', revenue: 4490, installs: 2100 },
  { month: 'Aug', revenue: 5300, installs: 2400 },
  { month: 'Sep', revenue: 6100, installs: 2600 },
  { month: 'Oct', revenue: 6700, installs: 2800 },
]

const sources = [
  { source: 'Organic', value: 400 },
  { source: 'Referral', value: 300 },
  { source: 'Paid', value: 300 },
  { source: 'Social', value: 200 },
]

const sessions = [
  { day: 'Mon', sessions: 400 },
  { day: 'Tue', sessions: 300 },
  { day: 'Wed', sessions: 500 },
  { day: 'Thu', sessions: 200 },
  { day: 'Fri', sessions: 278 },
  { day: 'Sat', sessions: 189 },
  { day: 'Sun', sessions: 239 },
]

const retention = [
  { name: '0-7d', value: 80 },
  { name: '8-30d', value: 65 },
  { name: '31-90d', value: 40 },
]

export default function ApplicationsCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Last 10 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            id="monthly-revenue"
            config={{ revenue: { color: 'hsl(252 82% 55%)' }, installs: { color: 'hsl(210 70% 50%)' } }}
            className="h-64"
          >
            <Recharts.LineChart data={monthly} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
              <Recharts.XAxis dataKey="month" />
              <Recharts.YAxis />
              <Recharts.Tooltip content={<ChartTooltipContent />} />
              <Recharts.Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 3 }} />
              <Recharts.Line type="monotone" dataKey="installs" stroke="var(--color-installs)" strokeWidth={2} dot={false} strokeOpacity={0.6} />
            </Recharts.LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions by Day</CardTitle>
          <CardDescription>Sessions across the week</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer id="sessions-bar" config={{ sessions: { color: 'hsl(220 90% 56%)' } }} className="h-64">
            <Recharts.BarChart data={sessions} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <Recharts.XAxis dataKey="day" />
              <Recharts.YAxis />
              <Recharts.Tooltip content={<ChartTooltipContent />} />
              <Recharts.Bar dataKey="sessions" fill="var(--color-sessions)" />
            </Recharts.BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Sources</CardTitle>
          <CardDescription>Where installs are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer id="sources-pie" config={{ Organic: { color: '#60a5fa' }, Referral: { color: '#f59e0b' }, Paid: { color: '#ef4444' }, Social: { color: '#10b981' } }} className="h-64">
            <Recharts.PieChart>
              <Recharts.Pie data={sources} dataKey="value" nameKey="source" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                {sources.map((entry, index) => (
                  <Recharts.Cell key={`cell-${index}`} fill={['#60a5fa', '#f59e0b', '#ef4444', '#10b981'][index % 4]} />
                ))}
              </Recharts.Pie>
              <Recharts.Tooltip content={<ChartTooltipContent />} />
              <Recharts.Legend verticalAlign="bottom" content={<ChartLegendContent />} />
            </Recharts.PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retention</CardTitle>
          <CardDescription>30/90 day cohorts</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer id="retention-radial" config={{ retention: { color: '#7c3aed' } }} className="h-64">
            <Recharts.RadialBarChart innerRadius="10%" outerRadius="90%" data={retention} startAngle={90} endAngle={-270}>
              <Recharts.RadialBar dataKey="value" />
              <Recharts.Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" />
              <Recharts.Tooltip content={<ChartTooltipContent />} />
            </Recharts.RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
