import { useState } from "react";

const Roadmap = ({ params, publicRoadmapUrl }) => {

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Public Roadmap</h2>
      <div className="aspect-auto w-full h-full">
        <iframe
          src={`${publicRoadmapUrl}`}
          title="Product Roadmap 2024"
          height={'100%'}
          className="w-full h-full border-0 rounded-md shadow-lg min-h-[600px]"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default Roadmap;
