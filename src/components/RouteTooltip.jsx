// src/components/RouteTooltip.jsx
import React from 'react';
// Assuming getDirectionsErrorText is moved to utils or imported from App
import { getDirectionsErrorText } from '../App'; // Adjust path if needed

// NOTE: The helper functions (findLocationByName, nameMapping, getSegmentsForRoute, LOCATIONS)
// previously included temporarily here are NOT needed within this component anymore
// because we are only displaying data passed via props (routeData)
// and calculated segment data for the *main leg only* (segmentDetails[mainSegmentKey])

function RouteTooltip({ routeData, segmentDetails, position }) {
  // Basic validation: ensure needed data and position exist
  if (!routeData || !position || !segmentDetails) return null;

  // Get details only for the main From -> To segment
  const mainSegmentKey = `${routeData.from}-${routeData.to}`;
  const mainDetails = segmentDetails[mainSegmentKey];

  // Tooltip positioning style
  const style = {
    position: 'fixed', top: `${position.y + 15}px`, left: `${position.x + 15}px`,
    pointerEvents: 'none', zIndex: 1500, animation: 'fadeIn 0.1s ease-out'
  };

  return (
    <div
      className="p-2 text-xs bg-white border border-gray-400 rounded-md shadow-lg w-52" // Light tooltip style
      style={style}
    >
      {/* Display the consistent set of fields for all routes */}
      <div className="space-y-0.5 text-[10px] text-gray-700">
        <p><strong>Dep:</strong> {routeData.departureTime || '--'}</p>
        <p><strong>Arr:</strong> {routeData.arrivalTime || '--'}</p>
        {/* Show Distance/Duration for the main From->To segment */}
        <p><strong>Vehicle:</strong> {routeData.vehicleType || '--'}</p>
        <p><strong>Owner:</strong> {routeData.owner || '--'}</p>
      </div>
      {/* --- The entire Leg 2 section has been removed --- */}
    </div>
  );
}

export default RouteTooltip;