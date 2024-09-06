import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const ActivityMetric = ({ title, value, change }) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">{title}</span>
    <span className="text-2xl font-bold">{value}</span>
    <span className="text-xs text-red-500">↓ {change}%</span>
  </div>
);

const ActivityOverview = () => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Overview</CardTitle>
        <Select defaultValue="this-week">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">This week</SelectItem>
            <SelectItem value="last-week">Last week</SelectItem>
            <SelectItem value="this-month">This month</SelectItem>
          </SelectContent>
        </Select>
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
