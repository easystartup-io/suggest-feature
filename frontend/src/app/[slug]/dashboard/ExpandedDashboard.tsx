import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { SearchX } from 'lucide-react';


const timeframeOptions = [
  {
    name: "This week",
    value: "THIS_WEEK"
  },
  {
    name: "Last week",
    value: "LAST_WEEK"
  },
  {
    name: "This month",
    value: "THIS_MONTH"
  },
  {
    name: "Last month",
    value: "LAST_MONTH"
  },
  {
    name: "This year",
    value: "THIS_YEAR"
  }
]

const PostsOverview = ({ params }) => {

  const [data, setData] = useState(null)
  const [boards, setBoards] = useState([{ name: "All Boards", value: "ALL" }])
  const [timeframe, setTimeframe] = useState("THIS_WEEK")
  const [selectedBoard, setSelectedBoard] = useState("ALL")

  useEffect(() => {
    if (!params.slug || !timeframe || !selectedBoard) {
      return;
    }
    fetch('/api/auth/admin/dashboard/get-dashboard-data', {
      method: 'POST',
      headers: {
        "x-org-slug": params.slug,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ boardId: selectedBoard, timeFrame: timeframe }),
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
      })
  }, [params.slug, selectedBoard, timeframe])

  useEffect(() => {
    if (!params.slug) {
      return;
    }
    fetch('/api/auth/boards/fetch-boards', {
      headers: {
        "x-org-slug": params.slug,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // set boards as an array of objects with name and value properties
        // e.g. { name: "Board 1", value: 10 }
        const boardList = data.map((board) => ({
          name: board.name,
          value: board.id
        }));
        setBoards([
          { name: 'All Boards', value: 'ALL' }, ...boardList])
      })
  }, [params.slug])

  if (!data) return

  const chartConfig = {

  } satisfies ChartConfig;

  const totalPosts = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Posts Overview</span>
          <div className="flex justify-between mb-4 space-x-2">
            {[boards, timeframeOptions].map((options, index) => (
              <Select key={index} defaultValue={options[0].value} onValueChange={(val) => {
                if (index === 0) setSelectedBoard(val)
                else setTimeframe(val)
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={options[0].name} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        </CardTitle>
        <p className="text-sm text-gray-500">View distribution of all posts across your boards.</p>
      </CardHeader>
      <CardContent>
        {
          (!data || data.length === 0) && (
            <div className="flex flex-col items-center justify-center h-40">
              <SearchX className="text-4xl" />
              <p className="mt-2 text-sm text-gray-500">No posts found.</p>
            </div>
          )
        }
        {
          data && data.length > 0 && (
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={120}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalPosts.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Posts
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        <div className="flex justify-center mt-4 space-x-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.fill }}></div>
              <span className="text-sm" style={{ color: item.color }}>{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ExpandedDashboard = ({ params }) => {
  return (
    <div className="p-4 space-y-8">
      <PostsOverview params={params} />
    </div>
  );
};

export default ExpandedDashboard;
