// src/App.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom'; // Needed for Portal
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-polylinedecorator';
import { Loader } from "@googlemaps/js-api-loader";
import PolylineWithArrows from './components/PolylineWithArrows';
import RouteTooltip from './components/RouteTooltip';

// --- Custom Marker Icon Definition (Using INLINE STYLES) ---
const customMarkerIcon = L.divIcon({ html: `<span style="display: block; width: 12px; height: 12px; background-color: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></span>`, className: '', iconSize: [16, 16], iconAnchor: [8, 8], popupAnchor: [0, -8] });

// --- Constants ---
const LOCATIONS = [ {id: 1, name: "Abha", lat: 18.407914, lng: 42.699846, type: 'warehouse'}, {id: 2, name: "Khamish", lat: 18.317878, lng: 42.745247, type: 'branch'}, {id: 3, name: "Muhayil", lat: 18.537424, lng: 42.049847, type: 'branch'}, {id: 4, name: "Ahsa", lat: 25.405083, lng: 49.582190, type: 'branch'}, {id: 5, name: "Majmah", lat: 25.900330, lng: 45.339990, type: 'branch'}, {id: 6, name: "Qassim", lat: 26.342694, lng: 43.960116, type: 'branch'}, {id: 7, name: "Hafar", lat: 28.395567, lng: 45.949369, type: 'branch'}, {id: 8, name: "Hail", lat: 27.5219, lng: 41.6907, type: 'branch'}, {id: 9, name: "Jeddah", lat: 21.4858, lng: 39.1925, type: 'warehouse'}, {id: 10, name: "Jizan", lat: 16.959761, lng: 42.670613, type: 'branch'}, {id: 11, name: "Jubail", lat: 26.994121, lng: 49.645663, type: 'branch'}, {id: 12, name: "Khafji", lat: 28.415067, lng: 48.481533, type: 'branch'}, {id: 13, name: "Nariyah", lat: 27.471517, lng: 48.496856, type: 'branch'}, {id: 14, name: "Riyadh", lat: 24.540079, lng: 46.922444, type: 'production'}, {id: 15, name: "Sakaka", lat: 29.929746, lng: 40.180752, type: 'branch'}, {id: 16, name: "Madinah", lat: 24.350972, lng: 39.515639, type: 'branch'}, {id: 17, name: "Dammam", lat: 26.400646, lng: 50.146750, type: 'warehouse'}, {id: 18, name: "Dawadmi", lat: 24.496161, lng: 44.374928, type: 'branch'} ];
const findLocationByName = (name) => LOCATIONS.find(loc => loc.name === name);
const ROUTE_STYLES = { main: { color: '#be185d', weight: 6, opacity: 0.7 }, north_west: { color: '#0369a1', weight: 4, opacity: 0.65 }, south_west: { color: '#16a34a', weight: 4, opacity: 0.65 }, central: { color: '#d97706', weight: 4, opacity: 0.65 }, eastern: { color: '#ea580c', weight: 4, opacity: 0.65 }, operational: { weight: 5, opacity: 0.8 }, highlight: { color: '#ef4444', weight: 8, opacity: 0.95 } };
const ROUTE_GROUPS = { 'all': { name: 'Show All', category: 'all' }, 'main': { name: 'Hub & Spokes', category: 'main' }, 'north_west': { name: 'N. Western', category: 'north_west' }, 'south_west': { name: 'Southern', category: 'south_west' }, 'central': { name: 'Central', category: 'central' }, 'eastern': { name: 'Eastern', category: 'eastern' }, };
const GROUP_FILTER_ORDER = ['all', 'main', 'north_west', 'south_west', 'central', 'eastern'];
const STRUCTURED_ROUTES = [ { category: 'main', from: 'Riyadh', to: 'Jeddah' }, { category: 'main', from: 'Riyadh', to: 'Abha' }, { category: 'main', from: 'Riyadh', to: 'Dammam' }, { category: 'north_west', from: 'Jeddah', to: 'Madinah' }, { category: 'south_west', from: 'Abha', to: 'Khamish' }, { category: 'south_west', from: 'Khamish', to: 'Jizan' }, { category: 'south_west', from: 'Jizan', to: 'Muhayil' }, { category: 'south_west', from: 'Muhayil', to: 'Abha' }, { category: 'central', from: 'Riyadh', to: 'Dawadmi' }, { category: 'central', from: 'Dawadmi', to: 'Majmah' }, { category: 'central', from: 'Majmah', to: 'Qassim' }, { category: 'central', from: 'Qassim', to: 'Hail' }, { category: 'central', from: 'Hail', to: 'Sakaka' }, { category: 'eastern', from: 'Dammam', to: 'Ahsa' }, { category: 'eastern', from: 'Ahsa', to: 'Nariyah' }, { category: 'eastern', from: 'Nariyah', to: 'Hafar' }, { category: 'eastern', from: 'Hafar', to: 'Khafji' }, { category: 'eastern', from: 'Khafji', to: 'Jubail' }, { category: 'eastern', from: 'Jubail', to: 'Dammam' }, ];
const nameMapping = { "Hasa": "Ahsa", "Hafar": "Hafar", "Dawadmi": "Dawadmi", "Madinah": "Madinah", "Majmah": "Majmah", "Qassim": "Qassim", "Hail": "Hail", "Sakaka": "Sakaka" };
const CURRENT_ROUTE_COLORS = [ '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9A6324', '#ffd8b1', '#000075' ];
const currentOperationalRoutesSourceData = [ { routeNumber: 1, from: 'Riyadh', to: 'Jeddah', also: null, departureTime: '10:30pm', arrivalTime: '07:30pm', flights: '6 Trips / Week', vehicleType: 'Trailer', owner: 'Other', color: CURRENT_ROUTE_COLORS[0] }, { routeNumber: 2, from: 'Riyadh', to: 'Dammam', also: null, departureTime: '01:00am', arrivalTime: '11:00pm', flights: '6 Trips / Week', vehicleType: 'Trailer', owner: 'Other', color: CURRENT_ROUTE_COLORS[1] }, { routeNumber: 3, from: 'Riyadh', to: 'Hasa', also: null, departureTime: '10:30am', arrivalTime: '05:00pm', flights: '6 Trips / Week', vehicleType: '09 Ton / Masdar', owner: 'MAH', color: CURRENT_ROUTE_COLORS[2] }, { routeNumber: 4, from: 'Riyadh', to: 'Hafar', also: null, departureTime: '05:00am', arrivalTime: '01:00pm', flights: '3 Trips / Week', vehicleType: '05 Ton / Yelo', owner: 'MAH', color: CURRENT_ROUTE_COLORS[3] }, { routeNumber: 5, from: 'Riyadh', to: 'Hafar', also: null, departureTime: '05:00am', arrivalTime: '03:00pm', flights: '3 Trips / Week', vehicleType: '11 Ton / Rent', owner: 'Other', color: CURRENT_ROUTE_COLORS[4] }, { routeNumber: 6, from: 'Riyadh', to: 'Dawadmi', also: null, departureTime: '11:00am', arrivalTime: '06:00pm', flights: '6 Trips / Week', vehicleType: '11 Ton / Rent', owner: 'Other', color: CURRENT_ROUTE_COLORS[5] }, { routeNumber: 7, from: 'Riyadh', to: 'Hail', also: null, departureTime: '04:00am', arrivalTime: '02:30pm', flights: '3 Trips / Week', vehicleType: '11 Ton / Yelo', owner: 'MAH', color: CURRENT_ROUTE_COLORS[6] }, { routeNumber: 8, from: 'Riyadh', to: 'Hail', also: null, departureTime: '04:00am', arrivalTime: '12:00pm', flights: '3 Trips / Week', vehicleType: '05 Ton / Yelo', owner: 'MAH', color: CURRENT_ROUTE_COLORS[7] }, { routeNumber: 9, from: 'Riyadh', to: 'Qassim', also: 'Majmah', departureTime: '05:00am', arrivalTime: '01:00pm', flights: '6 Trips / Week', vehicleType: 'Trailer', owner: 'Other', color: CURRENT_ROUTE_COLORS[8] }, { routeNumber: 10, from: 'Riyadh', to: 'Abha', also: null, departureTime: '07:00PM', arrivalTime: '09:00AM', flights: '3 Trips / Week', vehicleType: 'Trailer', owner: 'Other', color: CURRENT_ROUTE_COLORS[9] }, { routeNumber: 11, from: 'Riyadh', to: 'Jizan', also: null, departureTime: '06:00PM', arrivalTime: '04:00AM', flights: '3 Trips / Week', vehicleType: '11 Ton / Rent ( If load more)', owner: 'Other', color: CURRENT_ROUTE_COLORS[10] }, { routeNumber: 12, from: 'Riyadh', to: 'Madinah', also: null, departureTime: '07:00PM', arrivalTime: '07:00PM', flights: '3 Trips / week', vehicleType: '05 Ton / Yelo', owner: 'MAH', color: CURRENT_ROUTE_COLORS[11] }, { routeNumber: 13, from: 'Hail', to: 'Sakaka', also: null, departureTime: '05:00 PM', arrivalTime: '04:00 AM', flights: '6 Trips / Per Week', vehicleType: '05 Ton / Yelo', owner: 'MAH', color: CURRENT_ROUTE_COLORS[12] }, { routeNumber: 14, from: 'Dammam', to: 'Jubail', also: null, departureTime: '01:30pm', arrivalTime: '03:00pm', flights: '6 Trips / Week', vehicleType: '11 Ton / Yelo', owner: 'MAH', color: CURRENT_ROUTE_COLORS[13] }, { routeNumber: 15, from: 'Abha', to: 'Jizan', also: null, departureTime: '07:00 PM', arrivalTime: '05:00 AM', flights: '6 Trips / Per Week', vehicleType: '11 Ton / Yelo', owner: 'MAH', color: CURRENT_ROUTE_COLORS[14] }, ].map(route => ({ ...route, from: nameMapping[route.from] || route.from, to: nameMapping[route.to] || route.to, also: nameMapping[route.also] || route.also, }));
const getSegmentsForRoute = (route) => { const segments = []; const fromLoc = findLocationByName(route.from); const toLoc = findLocationByName(route.to); if (fromLoc && toLoc) { segments.push({ from: route.from, to: route.to }); } if (route.also) { const alsoLoc = findLocationByName(route.also); let secondFrom = route.to; let secondTo = route.also; if (route.routeNumber === 9) { secondFrom = nameMapping['Majmah'] || 'Majmah'; secondTo = nameMapping['Qassim'] || 'Qassim'; } else if (route.routeNumber === 7 || route.routeNumber === 8) { secondFrom = nameMapping['Hail'] || 'Hail'; secondTo = nameMapping['Sakaka'] || 'Sakaka'; } const secondFromLoc = findLocationByName(secondFrom); const secondToLoc = findLocationByName(secondTo); if (secondFromLoc && secondToLoc) { segments.push({ from: secondFrom, to: secondTo }); } else { console.warn(`Missing loc for multi-stop seg: ${secondFrom} -> ${secondTo} for Route #${route.routeNumber}`); } } return segments; };

// --- Fuel Calculation Constants ---
const DIESEL_PRICE_SAR_PER_LITER = 1.66;
const MILEAGE_KM_PER_LITER_MIN = 4;
const MILEAGE_KM_PER_LITER_MAX = 6;
// const AVERAGE_MILEAGE_KM_PER_LITER = (MILEAGE_KM_PER_LITER_MIN + MILEAGE_KM_PER_LITER_MAX) / 2; // Not used directly in ranged cost
// --- NEW: Weeks in a month constant ---
const WEEKS_IN_MONTH = 4.3333; // More precise for monthly calculation


// --- Helper Functions ---
export function getDirectionsErrorText(status) { if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined' && typeof window.google.maps.DirectionsStatus !== 'undefined') { switch (status) { case window.google.maps.DirectionsStatus.NOT_FOUND: return "Origin/dest not found."; case window.google.maps.DirectionsStatus.ZERO_RESULTS: return "No route found."; case window.google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED: return "Too many waypoints."; case window.google.maps.DirectionsStatus.MAX_ROUTE_LENGTH_EXCEEDED: return "Route too long."; case window.google.maps.DirectionsStatus.INVALID_REQUEST: return "Invalid request."; case window.google.maps.DirectionsStatus.OVER_QUERY_LIMIT: return "API limit reached."; case window.google.maps.DirectionsStatus.REQUEST_DENIED: return "Request denied."; case window.google.maps.DirectionsStatus.UNKNOWN_ERROR: return "Unknown server error."; } } switch(status) { case 'API_NOT_LOADED': return "Google API not loaded."; case 'NO_POLYLINE': return "Route geometry missing."; case 'LOCATION_NOT_FOUND': return "Internal: Location missing."; case 'CALCULATION_ERROR': return "Internal calculation error."; default: return `Unexpected error (${status || 'Unknown'}).`; } }
function decodePolyline(encoded) { if (!encoded) { return []; } var points = []; var index = 0, len = encoded.length; var lat = 0, lng = 0; while (index < len) { var b, shift = 0, result = 0; do { if (index >= len) break; b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20); if (b < 0x20 && index >= len && shift > 0 && (encoded.charCodeAt(index-1) - 63) < 0x20) break; var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat; shift = 0; result = 0; do { if (index >= len) break; b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20); if (b < 0x20 && index >= len && shift > 0 && (encoded.charCodeAt(index-1) - 63) < 0x20) break; var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng; points.push([lat / 1E5, lng / 1E5]); } return points; }
function formatDuration(totalSeconds) { if (isNaN(totalSeconds) || totalSeconds < 0) return '--'; const hours = Math.floor(totalSeconds / 3600); const minutes = Math.round((totalSeconds % 3600) / 60); let durationString = ''; if (hours > 0) { durationString += `${hours} hr `; } durationString += `${minutes} min`; return durationString.trim(); }
async function getSingleRouteDetails(originLoc, destinationLoc) { return new Promise((resolve) => { if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined' || typeof window.google.maps.DirectionsService === 'undefined') { console.warn("DirectionsService not available."); resolve({ distance: null, duration: null, latLngs: [], errorStatus: 'API_NOT_LOADED' }); return; } const directionsService = new window.google.maps.DirectionsService(); const request = { origin: { lat: originLoc.lat, lng: originLoc.lng }, destination: { lat: destinationLoc.lat, lng: destinationLoc.lng }, travelMode: window.google.maps.TravelMode.DRIVING, }; directionsService.route(request, (result, status) => { if (status === window.google.maps.DirectionsStatus.OK) { const route = result.routes?.[0]; if (route && route.overview_polyline) { const decodedPath = decodePolyline(route.overview_polyline); let totalDistanceMeters = 0, totalDurationSeconds = 0; route.legs.forEach(leg => { totalDistanceMeters += leg.distance?.value || 0; totalDurationSeconds += leg.duration?.value || 0; }); const distanceKm = (totalDistanceMeters / 1000).toFixed(1); const durationText = formatDuration(totalDurationSeconds); resolve({ distance: `${distanceKm} km`, duration: durationText, latLngs: decodedPath, errorStatus: null }); } else { console.warn(`No polyline: ${originLoc.name} -> ${destinationLoc.name}`); resolve({ distance: null, duration: null, latLngs: [], errorStatus: 'NO_POLYLINE' }); } } else { console.warn(`Directions fail: ${originLoc.name} -> ${destinationLoc.name}: ${status}`); resolve({ distance: null, duration: null, latLngs: [], errorStatus: status }); } }); }); }
function parseTripsPerWeek(flightsString) { if (!flightsString) return 0; const match = flightsString.match(/(\d+)\s*Trips\s*\/\s*(?:Per\s*)?Week/i); return match && match[1] ? parseInt(match[1], 10) : 0; }


// --- Map Bounds Fitter Component ---
function MapBoundsFitter({ boundsToFit }) { const map = useMap(); useEffect(() => { if (boundsToFit?.isValid()) { map.fitBounds(boundsToFit.pad(0.15)); } }, [boundsToFit, map]); return null; }

// --- Main App Component ---
function App() {
    const mapCenter = [24.7136, 46.6753];
    const initialZoom = 6;

    // State variables
    const [viewMode, setViewMode] = useState('custom');
    const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [routeLatLngs, setRouteLatLngs] = useState([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [routeError, setRouteError] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);
    const [routeCenter, setRouteCenter] = useState(null);
    const [structuredRoutesData, setStructuredRoutesData] = useState(null);
    const [isLoadingStructuredRoutes, setIsLoadingStructuredRoutes] = useState(false);
    const [structuredRoutesError, setStructuredRoutesError] = useState(null);
    const [selectedGroupCategory, setSelectedGroupCategory] = useState('all');
    const [highlightedRouteKey, setHighlightedRouteKey] = useState(null);
    const [currentOperationalSegmentsData, setCurrentOperationalSegmentsData] = useState(null);
    const [isLoadingCurrentOperationalSegments, setIsLoadingCurrentOperationalSegments] = useState(false);
    const [currentOperationalSegmentsError, setCurrentOperationalSegmentsError] = useState(null);
    const [hoveredRouteNumber, setHoveredRouteNumber] = useState(null);
    const [currentRouteOwnerFilter, setCurrentRouteOwnerFilter] = useState('All');
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [weeklyRouteDetails, setWeeklyRouteDetails] = useState(null);
    // --- NEW: State for overall summary ---
    const [overallSummaryData, setOverallSummaryData] = useState(null);


    const apiKey = import.meta.env.VITE_Maps_API_KEY;

    // --- Callbacks ---
    const routeDetailsIcon = useCallback((details) => { if (!details?.distance || !details?.duration) return L.divIcon({ html: '' }); const iconHtml = `<div class="route-details-marker"><strong>${details.distance}</strong><br/>${details.duration}</div>`; return L.divIcon({ html: iconHtml, className: '', iconSize: 'auto', iconAnchor: [-5, -5] }); }, []);
    const handleLocationSelect = useCallback((location) => { setSelectedLocations(prev => { const curr = Array.isArray(prev) ? prev : []; const isSel = curr.some(sl => sl.id === location.id); if (isSel) { return curr.filter(loc => loc.id !== location.id); } else { return curr.length < 2 ? [...curr, location] : curr; } }); setRouteLatLngs([]); setRouteError(null); setRouteDetails(null); setRouteCenter(null); }, []);
    const handleClearSelection = useCallback(() => { setSelectedLocations([]); setRouteLatLngs([]); setRouteError(null); setRouteDetails(null); setRouteCenter(null); }, []);
    const handleCalculateRoute = useCallback(async () => { if (!googleApiLoaded) { setRouteError("Google API not ready."); return; } if (isLoadingRoute) return; if (!Array.isArray(selectedLocations) || selectedLocations.length !== 2) { setRouteError("Select exactly 2 locations."); return; } setIsLoadingRoute(true); setRouteError(null); setRouteLatLngs([]); setRouteDetails(null); setRouteCenter(null); const [originLoc, destinationLoc] = selectedLocations; try { const result = await getSingleRouteDetails(originLoc, destinationLoc); if (result.errorStatus === null && result.latLngs?.length > 0) { setRouteLatLngs(result.latLngs); setRouteDetails({ distance: result.distance, duration: result.duration }); const middleIndex = Math.floor(result.latLngs.length / 2); setRouteCenter(result.latLngs[middleIndex]); } else { setRouteError(getDirectionsErrorText(result.errorStatus)); setRouteLatLngs([]); setRouteDetails(null); setRouteCenter(null); } } catch (error) { console.error("Calc custom route err:", error); setRouteError("Calculation error."); setRouteLatLngs([]); setRouteDetails(null); setRouteCenter(null); } finally { setIsLoadingRoute(false); } }, [googleApiLoaded, selectedLocations, isLoadingRoute]);
    const calculateStructuredRoutes = useCallback(async () => { if (!googleApiLoaded || isLoadingStructuredRoutes) return; setIsLoadingStructuredRoutes(true); setStructuredRoutesError(null); const results = []; const promises = STRUCTURED_ROUTES.map(async (routeDef) => { const { from: fromName, to: toName, category } = routeDef; const fromLoc = findLocationByName(fromName); const toLoc = findLocationByName(toName); if (!fromLoc || !toLoc) return { from: fromName, to: toName, category, distance: null, duration: null, latLngs: [], errorStatus: 'LOCATION_NOT_FOUND' }; try { const details = await getSingleRouteDetails(fromLoc, toLoc); return { from: fromName, to: toName, category, ...details }; } catch (error) { return { from: fromName, to: toName, category, distance: null, duration: null, latLngs: [], errorStatus: 'CALCULATION_ERROR' }; } }); const settledResults = await Promise.allSettled(promises); settledResults.forEach(result => { if (result.status === 'fulfilled') { results.push(result.value); } else { console.error("Failed structured route calc:", result.reason); setStructuredRoutesError("Partial calculation failure"); } }); setStructuredRoutesData(results); setIsLoadingStructuredRoutes(false); }, [googleApiLoaded, isLoadingStructuredRoutes]);
    
    // --- NEW: Callback to calculate overall summary for all current routes ---
    const calculateOverallSummary = useCallback((routesSourceData, segmentsData) => {
        if (!routesSourceData || routesSourceData.length === 0 || !segmentsData) {
            setOverallSummaryData(null);
            return;
        }

        let totalWeeklyKmAllRoutes = 0;
        let totalWeeklyCostMinSarAllRoutes = 0;
        let totalWeeklyCostMaxSarAllRoutes = 0;
        let routableTripsCount = 0; // Count how many routes contribute to the summary

        routesSourceData.forEach(route => {
            const primarySegmentKey = `${route.from}-${route.to}`;
            const primaryLegDetails = segmentsData[primarySegmentKey];

            if (primaryLegDetails && primaryLegDetails.distance) {
                const distanceKm = parseFloat(primaryLegDetails.distance);
                if (!isNaN(distanceKm) && distanceKm > 0) {
                    const tripsPerWeek = parseTripsPerWeek(route.flights);
                    if (tripsPerWeek > 0) {
                        const routeWeeklyKm = distanceKm * tripsPerWeek;
                        totalWeeklyKmAllRoutes += routeWeeklyKm;

                        const fuelNeededMinLiters = routeWeeklyKm / MILEAGE_KM_PER_LITER_MAX;
                        const fuelNeededMaxLiters = routeWeeklyKm / MILEAGE_KM_PER_LITER_MIN;
                        
                        totalWeeklyCostMinSarAllRoutes += fuelNeededMinLiters * DIESEL_PRICE_SAR_PER_LITER;
                        totalWeeklyCostMaxSarAllRoutes += fuelNeededMaxLiters * DIESEL_PRICE_SAR_PER_LITER;
                        routableTripsCount++;
                    }
                }
            }
        });
        
        if (routableTripsCount === 0) { // If no routes had valid data to sum
             setOverallSummaryData({
                totalWeeklyKm: '0',
                totalWeeklyCostMinSAR: '0.00',
                totalWeeklyCostMaxSAR: '0.00',
                totalMonthlyKm: '0',
                totalMonthlyCostMinSAR: '0.00',
                totalMonthlyCostMaxSAR: '0.00',
                calculatedRoutesCount: 0
            });
            return;
        }

        const totalMonthlyKmAllRoutes = totalWeeklyKmAllRoutes * WEEKS_IN_MONTH;
        const totalMonthlyCostMinSarAllRoutes = totalWeeklyCostMinSarAllRoutes * WEEKS_IN_MONTH;
        const totalMonthlyCostMaxSarAllRoutes = totalWeeklyCostMaxSarAllRoutes * WEEKS_IN_MONTH;

        setOverallSummaryData({
            totalWeeklyKm: totalWeeklyKmAllRoutes.toFixed(0),
            totalWeeklyCostMinSAR: totalWeeklyCostMinSarAllRoutes.toFixed(2),
            totalWeeklyCostMaxSAR: totalWeeklyCostMaxSarAllRoutes.toFixed(2),
            totalMonthlyKm: totalMonthlyKmAllRoutes.toFixed(0),
            totalMonthlyCostMinSAR: totalMonthlyCostMinSarAllRoutes.toFixed(2),
            totalMonthlyCostMaxSAR: totalMonthlyCostMaxSarAllRoutes.toFixed(2),
            calculatedRoutesCount: routableTripsCount
        });
    }, []); // Dependencies: MILEAGE_KM_PER_LITER constants are stable, DIESEL_PRICE_SAR_PER_LITER is stable. parseTripsPerWeek is stable. WEEKS_IN_MONTH is stable.

    const calculateCurrentOperationalSegments = useCallback(async () => {
        if (!googleApiLoaded || isLoadingCurrentOperationalSegments) return;
        const uniqueSegments = new Map();
        currentOperationalRoutesSourceData.forEach(route => {
            const segments = getSegmentsForRoute(route);
            segments.forEach(seg => {
                const key = `${seg.from}-${seg.to}`;
                if (!uniqueSegments.has(key)) {
                    uniqueSegments.set(key, { from: seg.from, to: seg.to });
                }
            });
        });
        if (uniqueSegments.size === 0) {
            setCurrentOperationalSegmentsData({});
            // --- MODIFIED: Also trigger overall summary calculation which will result in null/zero data ---
            calculateOverallSummary(currentOperationalRoutesSourceData, {});
            return;
        }
        setIsLoadingCurrentOperationalSegments(true);
        setCurrentOperationalSegmentsError(null);
        setOverallSummaryData(null); // Clear previous summary while calculating

        const segmentResults = new Map();
        const promises = Array.from(uniqueSegments.values()).map(async (segmentDef) => {
            const { from: fromName, to: toName } = segmentDef;
            const key = `${fromName}-${toName}`;
            const fromLoc = findLocationByName(fromName);
            const toLoc = findLocationByName(toName);
            if (!fromLoc || !toLoc) return { key, error: 'LOCATION_NOT_FOUND' };
            try {
                const details = await getSingleRouteDetails(fromLoc, toLoc);
                return { key, data: details };
            } catch (error) {
                return { key, error: 'CALCULATION_ERROR' };
            }
        });
        const settledResults = await Promise.allSettled(promises);
        let hasErrorInSegments = false;
        settledResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                const { key, data, error } = result.value;
                if (key && data && !error) {
                    segmentResults.set(key, data);
                } else if (key && error) {
                    segmentResults.set(key, { distance: null, duration: null, latLngs: [], errorStatus: error });
                    hasErrorInSegments = true; // Mark if any segment failed
                }
            } else {
                console.error("Failed segment calc promise:", result.reason);
                setCurrentOperationalSegmentsError("Partial failure calculating segments");
                hasErrorInSegments = true; // Mark if any promise rejected
            }
        });
        
        const finalSegmentsData = Object.fromEntries(segmentResults);
        setCurrentOperationalSegmentsData(finalSegmentsData);
        setIsLoadingCurrentOperationalSegments(false);

        // --- MODIFIED: Trigger overall summary calculation after segments are processed ---
        if (!currentOperationalSegmentsError && !hasErrorInSegments) { // Only calculate if no major errors
             calculateOverallSummary(currentOperationalRoutesSourceData, finalSegmentsData);
        } else if (hasErrorInSegments && !currentOperationalSegmentsError) {
            // If there were individual segment errors but not a global error, still try to calculate
            // The calculateOverallSummary function will skip routes with missing segment data.
            calculateOverallSummary(currentOperationalRoutesSourceData, finalSegmentsData);
            // Optionally set a more specific error or warning for the overall summary if many segments failed
        } else {
            setOverallSummaryData(null); // Clear if there was a global error
        }

    }, [googleApiLoaded, isLoadingCurrentOperationalSegments, calculateOverallSummary, currentOperationalSegmentsError]); // Added calculateOverallSummary and currentOperationalSegmentsError

    const handleMouseMove = useCallback((event) => { setMousePosition({ x: event.clientX, y: event.clientY }); }, []);
    const calculateWeeklyFuelCost = useCallback((routeData, segmentDetailsCollection) => { if (!routeData || !segmentDetailsCollection) { setWeeklyRouteDetails(null); return; } const primarySegmentKey = `${routeData.from}-${routeData.to}`; const primaryLegDetails = segmentDetailsCollection[primarySegmentKey]; if (!primaryLegDetails || !primaryLegDetails.distance) { console.warn(`Primary leg details or distance missing for ${primarySegmentKey} in weekly calculation.`); setWeeklyRouteDetails(null); return; } const distanceKmString = primaryLegDetails.distance; const distanceKm = parseFloat(distanceKmString); if (isNaN(distanceKm) || distanceKm <= 0) { console.warn(`Invalid distance for weekly calculation: ${distanceKmString}`); setWeeklyRouteDetails(null); return; } const tripsPerWeek = parseTripsPerWeek(routeData.flights); if (tripsPerWeek === 0) { setWeeklyRouteDetails(null); return; } const totalWeeklyKm = distanceKm * tripsPerWeek; const fuelNeededMinLiters = totalWeeklyKm / MILEAGE_KM_PER_LITER_MAX; const fuelNeededMaxLiters = totalWeeklyKm / MILEAGE_KM_PER_LITER_MIN; const costMinSAR = fuelNeededMinLiters * DIESEL_PRICE_SAR_PER_LITER; const costMaxSAR = fuelNeededMaxLiters * DIESEL_PRICE_SAR_PER_LITER; setWeeklyRouteDetails({ destination: routeData.to, totalWeeklyKm: totalWeeklyKm.toFixed(0), costMinSAR: costMinSAR.toFixed(2), costMaxSAR: costMaxSAR.toFixed(2), trips: tripsPerWeek, singleTripKm: distanceKm.toFixed(1) }); }, []);

    // --- Effects ---
    useEffect(() => { if (googleApiLoaded || isApiLoading || !apiKey) { if(!apiKey && !apiError) setApiError("API Key Missing"); return; } const loadGoogleMaps = async () => { setIsApiLoading(true); setApiError(null); const loader = new Loader({ apiKey: apiKey, version: "weekly", libraries: ["routes"] }); try { await loader.load(); setGoogleApiLoaded(true); } catch (e) { console.error("Failed Google Maps API load:", e); setApiError(`Failed: ${e.message}`); setGoogleApiLoaded(false); } finally { setIsApiLoading(false); } }; loadGoogleMaps(); }, [apiKey, googleApiLoaded, isApiLoading, apiError]);
    
    // --- MODIFIED: Effect for view mode changes ---
    useEffect(() => {
        if (!googleApiLoaded || isApiLoading) return;
        if (viewMode === 'all' && !structuredRoutesData && !isLoadingStructuredRoutes) {
            calculateStructuredRoutes();
        } else if (viewMode === 'current' && (!currentOperationalSegmentsData || Object.keys(currentOperationalSegmentsData).length === 0) && !isLoadingCurrentOperationalSegments) {
            // Added Object.keys check to re-trigger if data is empty
            calculateCurrentOperationalSegments();
        }

        if (viewMode !== 'custom') {
            setRouteLatLngs([]); setRouteDetails(null); setRouteCenter(null); setRouteError(null);
        }
        if (viewMode !== 'all') {
            setSelectedGroupCategory('all'); setHighlightedRouteKey(null);
        }
        if (viewMode !== 'current') {
            setHoveredRouteNumber(null);
            setWeeklyRouteDetails(null);
            setOverallSummaryData(null); // --- NEW: Clear overall summary if not in current view ---
        } else {
            // If switching TO current view and data exists, recalculate overall summary
            if (currentOperationalSegmentsData && Object.keys(currentOperationalSegmentsData).length > 0) {
                 calculateOverallSummary(currentOperationalRoutesSourceData, currentOperationalSegmentsData);
            }
        }
    }, [ viewMode, googleApiLoaded, isApiLoading, structuredRoutesData, isLoadingStructuredRoutes, calculateStructuredRoutes, currentOperationalSegmentsData, isLoadingCurrentOperationalSegments, calculateCurrentOperationalSegments, calculateOverallSummary ]);


    const filteredStructuredRoutes = useMemo(() => { if (viewMode !== 'all' || !structuredRoutesData) return []; if (selectedGroupCategory === 'all') { return structuredRoutesData.filter(route => route.latLngs?.length > 0); } return structuredRoutesData.filter(route => route.category === selectedGroupCategory && route.latLngs?.length > 0); }, [viewMode, structuredRoutesData, selectedGroupCategory]);
    const filteredCurrentOperationalRoutes = useMemo(() => { if(viewMode !== 'current') return []; return currentOperationalRoutesSourceData.filter(route => currentRouteOwnerFilter === 'All' || route.owner === currentRouteOwnerFilter); }, [viewMode, currentRouteOwnerFilter]);
    const boundsToFit = useMemo(() => { let points = []; try { if (viewMode === 'custom' && routeLatLngs?.length > 0) { points = routeLatLngs; } else if (viewMode === 'all' && filteredStructuredRoutes.length > 0) { points = filteredStructuredRoutes.flatMap(route => route.latLngs || []); } else if (viewMode === 'current' && currentOperationalSegmentsData && filteredCurrentOperationalRoutes.length > 0) { points = filteredCurrentOperationalRoutes.flatMap(route => { const segments = getSegmentsForRoute(route); return segments.flatMap(seg => currentOperationalSegmentsData[`${seg.from}-${seg.to}`]?.latLngs || []); }); } if (points.length > 0) { const bounds = L.latLngBounds(points); if (bounds.isValid()) return bounds; } } catch (error) { console.error("Error calculating bounds:", error); } return null; }, [viewMode, routeLatLngs, filteredStructuredRoutes, filteredCurrentOperationalRoutes, currentOperationalSegmentsData]);
    const hoveredRouteData = useMemo(() => { if (viewMode !== 'current' || hoveredRouteNumber === null) return null; return currentOperationalRoutesSourceData.find(r => r.routeNumber === hoveredRouteNumber) || null; }, [hoveredRouteNumber, viewMode]);
    useEffect(() => { if (viewMode === 'current' && hoveredRouteData && currentOperationalSegmentsData) { calculateWeeklyFuelCost(hoveredRouteData, currentOperationalSegmentsData); } else { setWeeklyRouteDetails(null); } }, [viewMode, hoveredRouteData, currentOperationalSegmentsData, calculateWeeklyFuelCost]);


    // --- JSX Rendering ---
    return (
        <div className="w-screen h-screen relative font-sans flex flex-col" onMouseMove={handleMouseMove}>

            {/* Control Panel Overlay (Left) */}
            <div className="absolute top-3 left-3 z-[1000] p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-xs md:max-w-sm flex flex-col max-h-[calc(100vh-24px)] border border-gray-200">
                <div className="flex border-b border-gray-300 pb-2 mb-2 flex-shrink-0"> <button onClick={() => setViewMode('custom')} className={`flex-1 px-2 py-1 text-xs rounded-l-md border border-gray-300 transition-colors duration-150 ${ viewMode === 'custom' ? 'bg-indigo-600 text-white font-semibold z-10 ring-1 ring-indigo-400' : 'bg-white text-gray-700 hover:bg-gray-100' }`}> Custom </button> <button onClick={() => setViewMode('current')} className={`flex-1 px-2 py-1 text-xs border-t border-b border-l-0 border-gray-300 transition-colors duration-150 ${ viewMode === 'current' ? 'bg-indigo-600 text-white font-semibold z-10 ring-1 ring-indigo-400' : 'bg-white text-gray-700 hover:bg-gray-100' }`} > Current </button> <button onClick={() => setViewMode('all')} className={`flex-1 px-2 py-1 text-xs rounded-r-md border border-l-0 border-gray-300 transition-colors duration-150 ${ viewMode === 'all' ? 'bg-indigo-600 text-white font-semibold z-10 ring-1 ring-indigo-400' : 'bg-white text-gray-700 hover:bg-gray-100' }`} > Preferred </button> </div>
                {viewMode === 'custom' && ( <> <h2 className="text-sm font-semibold mb-2 text-gray-800 flex-shrink-0">Select Two Locations:</h2> <div className="flex flex-wrap gap-1 mb-2 max-h-28 overflow-y-auto flex-shrink-0 border rounded p-1 bg-gray-50/50"> {LOCATIONS.map(loc => { const currentSelection = Array.isArray(selectedLocations) ? selectedLocations : []; const isSelected = currentSelection.some(sl => sl.id === loc.id); return ( <button key={loc.id} onClick={() => handleLocationSelect(loc)} className={`px-2 py-0.5 text-xs rounded border transition-colors duration-150 ${ isSelected ? 'bg-indigo-600 text-white border-indigo-700 font-medium ring-2 ring-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400' }`}>{loc.name}</button> ); })} </div> <div className="flex flex-wrap gap-2 items-center mb-1 flex-shrink-0"> <button onClick={handleCalculateRoute} disabled={!googleApiLoaded || isApiLoading || !Array.isArray(selectedLocations) || selectedLocations.length !== 2 || isLoadingRoute} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-opacity duration-150"> {isLoadingRoute ? 'Calculating...' : 'Calculate Route'} {isLoadingRoute && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>} </button> <button onClick={handleClearSelection} disabled={!Array.isArray(selectedLocations) || selectedLocations.length === 0} className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-150">Clear</button> </div> <div className="text-xs min-h-[1.2em] mt-1 flex-shrink-0"> {apiError && <span className="text-red-700 font-semibold block">API Error: {apiError}</span>} {isApiLoading && <span className="text-yellow-600 italic">Loading Google API...</span>} {routeError && <span className="text-red-600 font-semibold">Route Error: {routeError}</span>} {googleApiLoaded && !isApiLoading && Array.isArray(selectedLocations) && selectedLocations.length !== 2 && !routeError && !isLoadingRoute && (<span className="text-blue-600 italic">Select exactly 2 locations.</span> )} </div> </> )}
                 {viewMode === 'current' && (
                    <div className="flex flex-col flex-grow min-h-0">
                         <h3 className="text-sm font-semibold mb-1 text-gray-800 flex-shrink-0">Current Operational (Retail) Routes</h3>
                         <div className="mb-2 flex-shrink-0 border-b pb-2"> <label className="text-xs text-gray-600 mr-2 font-medium">Filter Owner:</label> <select value={currentRouteOwnerFilter} onChange={(e) => { setCurrentRouteOwnerFilter(e.target.value); setHoveredRouteNumber(null); }} className="text-xs border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" > <option value="All">All</option> <option value="MAH">MAH</option> <option value="Other">Other</option> </select> </div>
                         {apiError && <p className="text-red-700 font-semibold flex-shrink-0 text-xs p-1">API Error: {apiError}</p>}
                         {isApiLoading && <div className="flex items-center justify-center p-2 flex-shrink-0 text-xs"><div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-1"></div><span>Loading API...</span></div> }
                         {isLoadingCurrentOperationalSegments && !isApiLoading && ( <div className="flex items-center justify-center p-2 flex-shrink-0 text-xs"><div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-1"></div><span>Calculating Segments...</span></div> )}
                         {currentOperationalSegmentsError && ( <p className="text-red-600 font-semibold flex-shrink-0 text-xs p-1">Segment Calc Error: {currentOperationalSegmentsError || 'Failed'}</p> )}
                         {!isLoadingCurrentOperationalSegments && !isApiLoading && !apiError && currentOperationalSegmentsData && (
                             <div className="overflow-y-auto border border-gray-200 rounded flex-grow text-xs text-gray-700 bg-white">
                                {filteredCurrentOperationalRoutes.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {filteredCurrentOperationalRoutes.map((route) => (
                                            <li key={route.routeNumber} className="py-1.5 px-1 hover:bg-indigo-50 transition-colors duration-100 cursor-default relative" style={{ borderLeft: `4px solid ${route.color || '#ccc'}`}}  onMouseEnter={() => setHoveredRouteNumber(route.routeNumber)} onMouseLeave={() => { setHoveredRouteNumber(null); }} >
                                                <div className="ml-1"> <span className="font-medium">{route.routeNumber}. {route.from} → {route.to} {route.also ? `(via ${route.also})` : ''}</span> <span className="block text-gray-500 text-[10px]">{route.flights || 'N/A'} - {route.owner}</span> </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : ( <p className="text-gray-500 italic text-center p-3">No routes match filter.</p> )}
                             </div>
                         )}
                         {!currentOperationalSegmentsData && !isLoadingCurrentOperationalSegments && !apiError && !isApiLoading && googleApiLoaded && ( <p className="text-gray-500 italic text-xs mt-2 flex-shrink-0">Route segments calculating...</p> )}
                    </div>
                 )}
                {viewMode === 'all' && ( <div className="flex flex-col flex-grow min-h-0"> <h3 className="text-sm font-semibold mb-1 text-gray-800 flex-shrink-0">Filter Key Routes (hover to preview)</h3> <div className="flex flex-wrap gap-1 mb-3 flex-shrink-0"> {GROUP_FILTER_ORDER.map(key => ( <button key={key} onClick={() => { setSelectedGroupCategory(key); setHighlightedRouteKey(null); } } className={`px-2 py-0.5 text-[10px] rounded border transition-colors duration-150 ${ selectedGroupCategory === key ? 'bg-indigo-600 text-white border-indigo-700 font-medium ring-1 ring-indigo-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400' }`}>{ROUTE_GROUPS[key]?.name || key}</button> ))} </div> {apiError && <p className="text-red-700 font-semibold flex-shrink-0 text-xs">API Error: {apiError}</p>} {isApiLoading && <div className="flex items-center justify-center p-2 flex-shrink-0 text-xs"><div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-1"></div><span>Loading API...</span></div> } {isLoadingStructuredRoutes && !isApiLoading && ( <div className="flex items-center justify-center p-2 flex-shrink-0 text-xs"><div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-1"></div><span>Calculating Routes...</span></div> )} {structuredRoutesError && ( <p className="text-red-600 font-semibold flex-shrink-0 text-xs">Route Calc Error: {structuredRoutesError}</p> )} {!isLoadingStructuredRoutes && !isApiLoading && !apiError && structuredRoutesData && ( <div className="overflow-y-auto border rounded flex-grow"> {filteredStructuredRoutes.length > 0 ? (<table className="w-full text-left border-collapse text-xs"><thead><tr><th className="p-1 border-b font-semibold">From</th><th className="p-1 border-b font-semibold">To</th><th className="p-1 border-b font-semibold">Distance</th><th className="p-1 border-b font-semibold">Duration</th></tr></thead><tbody>{filteredStructuredRoutes.map((route, index) => { const k = `${route.from}-${route.to}-${index}`; const err = route.errorStatus ? getDirectionsErrorText(route.errorStatus) : null; return (<tr key={k} className="hover:bg-indigo-100 cursor-pointer" onMouseEnter={() => setHighlightedRouteKey(k)} onMouseLeave={() => setHighlightedRouteKey(null)}><td className="p-1 border-b">{route.from}</td><td className="p-1 border-b">{route.to}</td><td className={`p-1 border-b ${err ? 'text-red-500 italic' : ''}`}>{route.distance ?? (err || '--')}</td><td className={`p-1 border-b ${err ? 'text-red-500 italic' : ''}`}>{route.duration ?? '--'}</td></tr>);})}</tbody></table>) : ( <p className="text-gray-500 italic p-3 text-center">No routes found for filter.</p> )} </div> )} {!structuredRoutesData && !isLoadingStructuredRoutes && !apiError && !isApiLoading && viewMode === 'all' && googleApiLoaded && ( <p className="text-gray-500 italic text-xs mt-2 flex-shrink-0">Calculating routes...</p> )} </div> )}
            </div>

            {/* Weekly Fuel Cost Summary Panel (Top Right) */}
            {viewMode === 'current' && weeklyRouteDetails && (
                <div className="absolute top-3 right-5 z-[999] p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl max-w-xs md:max-w-sm border border-gray-200 text-xs">
                    <h3 className="text-sm font-semibold mb-2 text-gray-800 border-b pb-1">Weekly Fuel Cost Estimate</h3>
                    <div className="space-y-1 text-gray-700">
                        <p><strong>Destination:</strong> {weeklyRouteDetails.destination}</p>
                        <p><strong>Trips/Week:</strong> {weeklyRouteDetails.trips}</p>
                        <p><strong>Single Trip KM:</strong> {weeklyRouteDetails.singleTripKm} km</p>
                        <p><strong>Total Weekly KM:</strong> {weeklyRouteDetails.totalWeeklyKm} km</p>
                        <hr className="my-1"/>
                        <p className="text-[11px]"><em>Based on:</em></p>
                        <ul className="list-disc list-inside text-[11px] pl-1">
                            <li>Diesel Price: {DIESEL_PRICE_SAR_PER_LITER.toFixed(2)} SAR/liter (Riyadh)</li>
                            <li>Mileage: {MILEAGE_KM_PER_LITER_MIN}-{MILEAGE_KM_PER_LITER_MAX} km/liter (5-11t trailer)</li>
                        </ul>
                         <hr className="my-1"/>
                        <p className="font-semibold text-gray-800">Est. Weekly Cost: 
                            <span className="text-indigo-600 font-bold ml-1">
                                {weeklyRouteDetails.costMinSAR} - {weeklyRouteDetails.costMaxSAR} SAR
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* --- NEW: Overall Summary Panel (Top Center) --- */}
            {viewMode === 'current' && overallSummaryData && overallSummaryData.calculatedRoutesCount > 0 && (
                
                
                <div className="absolute top-3 left-[30%] transform -translate-x-1/2 z-[998] p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md max-w-sm border border-gray-200 text-[11px]">
    <h3 className="text-xs font-semibold mb-1 text-gray-800 border-b pb-0.5 text-center">Fleet Summary</h3>
    <div className="space-y-1 text-gray-700">
        <div>
            <p className="font-medium">Weekly Km:</p>
            <p className="text-indigo-600 font-bold">{overallSummaryData.totalWeeklyKm} km</p>
        </div>
        <div>
            <p className="font-medium">Weekly Fuel Cost:</p>
            <p className="text-indigo-600 font-bold">{overallSummaryData.totalWeeklyCostMinSAR} - {overallSummaryData.totalWeeklyCostMaxSAR} SAR</p>
        </div>
        <hr className="my-1"/>
        <div>
            <p className="font-medium">Monthly Km (est.):</p>
            <p className="text-purple-600 font-bold">{overallSummaryData.totalMonthlyKm} km</p>
        </div>
        <div>
            <p className="font-medium">Monthly Fuel Cost:</p>
            <p className="text-purple-600 font-bold">{overallSummaryData.totalMonthlyCostMinSAR} - {overallSummaryData.totalMonthlyCostMaxSAR} SAR</p>
        </div>
        <hr className="my-1"/>
        <p className="text-[10px] text-gray-500 italic text-center leading-tight">
            Based on {overallSummaryData.calculatedRoutesCount} route(s), diesel at {DIESEL_PRICE_SAR_PER_LITER.toFixed(2)} SAR/L, mileage {MILEAGE_KM_PER_LITER_MIN}-{MILEAGE_KM_PER_LITER_MAX} km/L.
        </p>
    </div>
</div>
            )}
            {viewMode === 'current' && overallSummaryData && overallSummaryData.calculatedRoutesCount === 0 && !isLoadingCurrentOperationalSegments &&(
                 <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[998] p-3 bg-yellow-50/90 backdrop-blur-sm rounded-lg shadow-xl max-w-md border border-yellow-200 text-xs">
                     <p className="text-yellow-700 italic text-center">No operational routes with defined weekly trips and distances found to calculate overall summary.</p>
                 </div>
            )}


             {/* Tooltip Portal Rendering */}
             {viewMode === 'current' && hoveredRouteData && currentOperationalSegmentsData && document.getElementById('tooltip-root') &&
                 ReactDOM.createPortal(
                     <RouteTooltip
                         routeData={hoveredRouteData}
                         segmentDetails={currentOperationalSegmentsData}
                         position={mousePosition}
                     />,
                     document.getElementById('tooltip-root')
                 )
             }


            {/* Map Container */}
            <div className="flex-grow z-0">
                 <MapContainer center={mapCenter} zoom={initialZoom} scrollWheelZoom={true} className="h-full w-full">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
                    {LOCATIONS.map(location => ( <Marker key={location.id} position={[location.lat, location.lng]} icon={customMarkerIcon} ><Popup>{location.name} ({location.type})</Popup></Marker> ))}
                    {viewMode === 'custom' && routeLatLngs.length > 0 && ( <PolylineWithArrows positions={routeLatLngs} pathOptions={ROUTE_STYLES.highlight} /> )}
                    {viewMode === 'custom' && routeDetails && routeCenter && ( <Marker position={routeCenter} icon={routeDetailsIcon(routeDetails)} interactive={false} /> )}
                    {viewMode === 'current' && currentOperationalSegmentsData && filteredCurrentOperationalRoutes.map((route) => { const segmentsToDraw = getSegmentsForRoute(route); const isRouteHovered = hoveredRouteNumber === route.routeNumber; const routeColor = route.color || '#808080'; return segmentsToDraw.map((segment, segmentIndex) => { const segmentKey = `${segment.from}-${segment.to}`; const segmentData = currentOperationalSegmentsData[segmentKey]; if (!segmentData || !segmentData.latLngs || segmentData.latLngs.length === 0 || segmentData.errorStatus) return null; const styleOptions = isRouteHovered ? ROUTE_STYLES.highlight : { color: routeColor, weight: ROUTE_STYLES.operational.weight, opacity: ROUTE_STYLES.operational.opacity }; const tooltipText = `Route ${route.routeNumber}: ${segment.from} → ${segment.to}`; return ( <PolylineWithArrows key={`${route.routeNumber}-${segmentKey}-${segmentIndex}`} positions={segmentData.latLngs} pathOptions={styleOptions} tooltipContent={tooltipText} /> ); }); })}
                    {viewMode === 'all' && filteredStructuredRoutes.map((route, index) => { if (!route.latLngs || route.latLngs.length === 0 || route.errorStatus) return null; const routeInstanceKey = `${route.from}-${route.to}-${index}`; const isHighlighted = highlightedRouteKey === routeInstanceKey; const categoryStyle = ROUTE_STYLES[route.category] || ROUTE_STYLES.operational; const styleOptions = isHighlighted ? ROUTE_STYLES.highlight : categoryStyle; const tooltipText = `${route.from} → ${route.to} (${route.category || 'Unknown'})`; return ( <PolylineWithArrows key={routeInstanceKey} positions={route.latLngs} pathOptions={styleOptions} tooltipContent={tooltipText} /> ); })}
                    <MapBoundsFitter boundsToFit={boundsToFit} />
                </MapContainer>
            </div>
            <style>{` @keyframes fadeIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fadeIn 0.1s ease-out; } `}</style>
        </div>
    );
}

export default App;
