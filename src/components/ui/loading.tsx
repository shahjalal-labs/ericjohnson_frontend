import React from "react";

export const Loading = () => {
  return (
    <div>
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-8 h-8 rounded-full animate-pulse bg-primary dark:bg-primary"></div>
          <div className="w-8 h-8 rounded-full animate-pulse bg-primary dark:bg-primary"></div>
          <div className="w-8 h-8 rounded-full animate-pulse bg-primary dark:bg-primary"></div>
        </div>
      </div>
    </div>
  );
}
