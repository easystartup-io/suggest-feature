import { useState } from "react";

const Roadmap = ({ params, publicRoadmapUrl }) => {

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Public Roadmap</h2>
      <div className="aspect-auto w-full h-[500px]">
        <iframe
          src={`${publicRoadmapUrl}`}
          title="Product Roadmap 2024"
          className="w-full h-full border-0 rounded-md shadow-lg"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default Roadmap;
