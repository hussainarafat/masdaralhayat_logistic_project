// src/components/PolylineWithArrows.jsx
import React, { useEffect, useRef } from 'react';
import { Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-polylinedecorator';

function PolylineWithArrows({ positions, pathOptions, tooltipContent }) {
  const map = useMap();
  const polylineRef = useRef(null);
  const decoratorRef = useRef(null);

  useEffect(() => {
    if (!map || !polylineRef.current || !positions || positions.length === 0) {
      return;
    }

    const polylineInstance = polylineRef.current;

    if (decoratorRef.current) {
      map.removeLayer(decoratorRef.current);
      decoratorRef.current = null;
    }

    // --- Arrow Pattern Configuration ---
    const arrowPattern = {
      offset: '15%', // Start arrows partway down the line
      repeat: '100px', // Density of arrows
      symbol: L.Symbol.arrowHead({
        // --- CHANGED: Make arrow smaller ---
        pixelSize: 9,  // Reduced size
        polygon: false,
        pathOptions: {
          stroke: true,
          // --- CHANGED: Adjust weight for smaller size ---
          weight: 1.5, // Set a slightly thicker weight than 1 for visibility
          // --- CHANGED: Set color to black ---
          color: '#000000', // Black color for arrows
          // --- Ensure high opacity ---
          opacity: 0.9, // Keep arrows opaque
          fillOpacity: 0.9 // Relevant if polygon=true
        }
      })
    };

    // Add the decorator to the map
    decoratorRef.current = L.polylineDecorator(polylineInstance, {
      patterns: [arrowPattern]
    }).addTo(map);

    // Cleanup function
    return () => {
      if (decoratorRef.current) {
        // Use try-catch as map might be unmounted in some HMR scenarios
        try {
           map.removeLayer(decoratorRef.current);
        } catch (e) {
           console.warn("Could not remove decorator layer during cleanup:", e);
        }
        decoratorRef.current = null;
      }
    };
  }, [map, positions, pathOptions]);

  // Render the base polyline
  return (
    <Polyline ref={polylineRef} positions={positions} pathOptions={pathOptions}>
      {tooltipContent && <Tooltip sticky>{tooltipContent}</Tooltip>}
    </Polyline>
  );
}

export default PolylineWithArrows;