import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { HelpCircle } from 'lucide-react';
import { KEYBOARD_SHORTCUTS, getOS } from '../lib/utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartData {
  date: string
  focus: number // hours
}

type ChartDataKey = keyof Pick<ChartData, 'focus'>;

interface FocusSession {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
}

// Mock data for when there are no sessions
const mockChartData: ChartData[] = [
  { date: "2024-04-24", focus: 2.5 },
  { date: "2024-04-25", focus: 1.8 },
  { date: "2024-04-26", focus: 3.0 },
  { date: "2024-04-27", focus: 0.5 },
  { date: "2024-04-28", focus: 1.2 },
  { date: "2024-04-29", focus: 2.0 },
  { date: "2024-04-30", focus: 1.5 }
]

const chartConfig = {
  views: {
    label: "Study Duration",
  },
  focus: {
    label: "Focus Time",
    color: "#8B6B4F", // Warm brown for focus/meditation
  }
} satisfies ChartConfig

export default function Dashboard() {
  const [activeChart] = React.useState<ChartDataKey>("focus")
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const os = getOS();
  const shortcuts = KEYBOARD_SHORTCUTS[os === 'mac' ? 'MAC' : 'WINDOWS'];

  // Fetch focus sessions data from localStorage
  React.useEffect(() => {
    function fetchFocusSessions() {
      try {
        const sessionsData = localStorage.getItem('focusSessions');
        if (!sessionsData) {
          setChartData(mockChartData);
          setIsLoading(false);
          return;
        }

        const sessions: FocusSession[] = JSON.parse(sessionsData);
        const threeWeeksAgo = new Date();
        threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

        // Filter sessions within the last 3 weeks
        const recentSessions = sessions.filter(session => 
          new Date(session.startTime) >= threeWeeksAgo
        );

        // Process the data to aggregate focus time by date
        const aggregatedData = recentSessions.reduce((acc: { [key: string]: number }, session) => {
          if (!session.endTime || !session.duration) return acc;
          
          const date = new Date(session.startTime).toISOString().split('T')[0];
          const duration = session.duration / 3600; // Convert seconds to hours
          acc[date] = (acc[date] || 0) + duration;
          return acc;
        }, {});

        // Convert to chart data format
        const formattedData: ChartData[] = Object.entries(aggregatedData).map(([date, focus]) => ({
          date,
          focus: Number(focus.toFixed(2))
        }));

        setChartData(formattedData.length > 0 ? formattedData : mockChartData);
      } catch (error) {
        console.error('Error fetching focus sessions:', error);
        setChartData(mockChartData);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFocusSessions();
  }, []);

  const total = React.useMemo(
    () => ({
      focus: chartData.reduce((acc, curr) => acc + curr.focus, 0),
    }),
    [chartData]
  )

  const avgHoursPerDay = React.useMemo(
    () => chartData.length ? Math.round((total.focus / chartData.length) * 10) / 10 : 0,
    [total.focus, chartData.length]
  )

  // Show empty state when there's no real data
  const showEmptyState = !isLoading && chartData === mockChartData;

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        {/* Help tooltip */}
        <div
          className="absolute top-4 right-4 flex flex-col items-end z-50"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="cursor-pointer bg-white/20 hover:bg-white/30 transition-all duration-200 rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/25">
            <HelpCircle className="w-4 h-4 text-[#363332]/70" />
          </div>
          <div className={`absolute top-full right-0 transition-all duration-300 ease-out ${showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
            <div className="w-72 mt-3 p-4 bg-white/95 text-[#363332]/90 rounded-lg shadow-lg text-sm backdrop-blur-sm ring-1 ring-black/5">
              <h3 className="font-medium mb-2 text-[#363332]">Shortcuts</h3>
              <ul className="space-y-2">
                <li className="flex justify-between items-center">
                  <span className="text-[#363332]/80">Previous page</span>
                  <kbd className="px-2 py-1 bg-[#F5F2EA] rounded text-xs text-[#363332]/70">
                    {shortcuts.NAVIGATION.DISPLAY.LEFT}
                  </kbd>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-[#363332]/80">Next page</span>
                  <kbd className="px-2 py-1 bg-[#F5F2EA] rounded text-xs text-[#363332]/70">
                    {shortcuts.NAVIGATION.DISPLAY.RIGHT}
                  </kbd>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl">
          <Card className="bg-[#FAF7F2] border-[#6B4F3D]/10">
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-[#6B4F3D]/10 p-0 sm:flex-row">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                <CardTitle className="text-[#6B4F3D]">Focus Time</CardTitle>
                <CardDescription className="text-[#6B4F3D]/70">
                  {!isLoading && chartData.length === 0 ? (
                    "Start focusing to build your progress chart"
                  ) : (
                    "Time spent on focus sessions"
                  )}
                </CardDescription>
              </div>
              {!showEmptyState && (
                <div className="flex">
                  <div className="relative z-30 flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left sm:px-8 sm:py-6">
                    <span className="text-xs text-[#6B4F3D]/70">
                      Daily Average
                    </span>
                    <span className="text-lg font-bold leading-none sm:text-3xl text-[#6B4F3D]">
                      {avgHoursPerDay}h
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {showEmptyState ? (
                <div className="aspect-[3/1] w-full flex items-center justify-center bg-[#FAF7F2] text-[#6B4F3D]/70">
                  <div className="text-center">
                    <p className="text-lg mb-2">No focus sessions yet</p>
                    <p className="text-sm">Head over to the Focus page to start tracking your progress</p>
                  </div>
                </div>
              ) : (
                <ChartContainer
                  config={chartConfig}
                  className="aspect-[3/1] w-full bg-[#FAF7F2]"
                >
                  <BarChart
                    data={chartData}
                    margin={{
                      left: 24,
                      right: 24,
                      top: 12,
                      bottom: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} stroke="#6B4F3D" strokeOpacity={0.08} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={40}
                      tick={{ fill: "#6B4F3D", fillOpacity: 0.8, fontSize: 12 }}
                      tickFormatter={(value: string) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => (
                        <ChartTooltipContent
                          active={active}
                          payload={payload}
                          label={label}
                          className="w-[180px] bg-[#FAF7F2] border-[#6B4F3D]/10 text-[#6B4F3D] shadow-lg"
                          nameKey="views"
                          labelFormatter={(value: string) => {
                            return new Date(value).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          }}
                        />
                      )}
                    />
                    <Bar 
                      dataKey={activeChart} 
                      fill={chartConfig[activeChart].color} 
                      fillOpacity={0.9}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
} 