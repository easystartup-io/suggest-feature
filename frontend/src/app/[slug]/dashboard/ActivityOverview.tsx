import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { timeframeOptions } from './ExpandedDashboard';


const ActivityMetric = ({ title, value, change }) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">{title}</span>
    <span className="text-2xl font-bold">{value}</span>
    <span className="text-xs text-red-500">↓ {change}%</span>
  </div>
);

const ActivityOverview = ({ params, boards }) => {
  const [data, setData] = useState(null)
  const [timeframe, setTimeframe] = useState("THIS_WEEK")
  const [selectedBoard, setSelectedBoard] = useState("ALL")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.slug || !timeframe || !selectedBoard) {
      return;
    }
    setLoading(true)
    fetch('/api/auth/admin/dashboard/get-activity-overview', {
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
        setLoading(false)
      })
  }, [params.slug, selectedBoard, timeframe])

  return (
    <Card className="w-full">
      <CardHeader >
        <CardTitle className="flex items-center justify-between">
          <span>Activity Overview</span>
          <div className="flex justify-between mb-4 space-x-2 items-center">
            {loading && <Icons.spinner className={cn("animate-spin", "w-5 h-5")} />}
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
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <ActivityMetric title="Posts" value="0" change={100} />
          <ActivityMetric title="Votes" value="0" change={100} />
          <ActivityMetric title="Comments" value="1" change={0} />
          <ActivityMetric title="Status changes" value="0" change={0} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityOverview;
