import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const RoadmapColumn = ({ title, color, children }) => (
  <Card className="flex-1">
    <CardHeader>
      <CardTitle className="flex items-center">
        <span className={`w-2 h-2 rounded-full mr-2 bg-${color}-500`}></span>
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const RoadmapItem = ({ title, votes, category }) => (
  <div className="mb-4 last:mb-0">
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
        <span className="text-sm">^{votes}</span>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-gray-500 uppercase">{category}</p>
      </div>
    </div>
  </div>
);

const Roadmap = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Roadmap</h2>
        <Button variant="outline">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
          Filters
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RoadmapColumn title="Planned" color="blue">
          <div className="flex flex-col items-center justify-center h-40 bg-gray-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M21 12H3" /><path d="M12 3v18" /></svg>
            <p className="text-sm text-gray-500">Share your progress by changing the status on posts.</p>
          </div>
        </RoadmapColumn>
        <RoadmapColumn title="In Progress" color="purple">
          <RoadmapItem
            title="XXXXXXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXXXXXX XXXX XXXX XXXX XXXX XXXX XXXXXXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXX XXXXXXXX XXXX"
            votes={1}
            category="FEATURE REQUESTS"
          />
        </RoadmapColumn>
        <RoadmapColumn title="Complete" color="green">
          <div className="flex flex-col items-center justify-center h-40 bg-gray-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M21 12H3" /><path d="M12 3v18" /></svg>
            <p className="text-sm text-gray-500">Share your progress by changing the status on posts.</p>
          </div>
        </RoadmapColumn>
      </div>
    </div>
  );
};

export default Roadmap;
