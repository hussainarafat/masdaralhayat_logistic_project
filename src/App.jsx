import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


const customMarkerIcon = L.divIcon({
    html: `<span />`,
    className: 'custom-div-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8]
});


const LOCATIONS = [
    {id: 1, name: "Abha", lat: 18.407914, lng: 42.699846, type: 'warehouse'},
    {id: 2, name: "Khamish", lat: 18.317878, lng: 42.745247, type: 'branch'},
    {id: 3, name: "Muhayil", lat: 18.537424, lng: 42.049847, type: 'branch'},
    {id: 4, name: "Ahsa", lat: 25.405083, lng: 49.582190, type: 'branch'},
    {id: 5, name: "Majmah", lat: 25.900330, lng: 45.339990, type: 'branch'},
    {id: 6, name: "Qassim", lat: 26.342694, lng: 43.960116, type: 'branch'},
    {id: 7, name: "Hafar", lat: 28.395567, lng: 45.949369, type: 'branch'},
    {id: 8, name: "Hail", lat: 27.5219, lng: 41.6907, type: 'branch'},
    {id: 9, name: "Jeddah", lat: 21.4858, lng: 39.1925, type: 'warehouse'},
    {id: 10, name: "Jizan", lat: 16.959761, lng: 42.670613, type: 'branch'},
    {id: 11, name: "Jubail", lat: 26.994121, lng: 49.645663, type: 'branch'},
    {id: 12, name: "Khafji", lat: 28.415067, lng: 48.481533, type: 'branch'},
    {id: 13, name: "Nariyah", lat: 27.471517, lng: 48.496856, type: 'branch'},
    {id: 14, name: "Riyadh", lat: 24.540079, lng: 46.922444, type: 'production'},
    {id: 15, name: "Sakaka", lat: 29.929746, lng: 40.180752, type: 'branch'},
    {id: 16, name: "Madinah", lat: 24.350972, lng: 39.515639, type: 'branch'},
    {id: 17, name: "Dammam", lat: 26.400646, lng: 50.146750, type: 'warehouse'},
    {id: 18, name: "Dawadmi", lat: 24.496161, lng: 44.374928, type: 'branch'}
];

const findLocationByName = (name) => LOCATIONS.find(loc => loc.name === name);


const ROUTE_STYLES = {
    main:       { color: '#be185d', weight: 6, opacity: 0.7 },
    north_west: { color: '#0369a1', weight: 4, opacity: 0.65 },
    south_west: { color: '#16a34a', weight: 4, opacity: 0.65 },
    central:    { color: '#d97706', weight: 4, opacity: 0.65 },
    eastern:    { color: '#ea580c', weight: 4, opacity: 0.65 },
    highlight:  { color: '#dc2626', weight: 7, opacity: 0.9 }
};


const ROUTE_GROUPS = {
    'all':        { name: 'Show All', category: 'all' },
    'main':       { name: 'Hub & Spokes', category: 'main' },
    'north_west': { name: 'North Western', category: 'north_west' },
    'south_west': { name: 'Southern', category: 'south_west' },
    'central':    { name: 'Central', category: 'central' },
    'eastern':    { name: 'Eastern', category: 'eastern' },
};

const GROUP_FILTER_ORDER = ['all', 'main', 'north_west', 'south_west', 'central', 'eastern'];


const STRUCTURED_ROUTES = [
    { category: 'main', from: 'Riyadh', to: 'Jeddah' }, { category: 'main', from: 'Riyadh', to: 'Abha' }, { category: 'main', from: 'Riyadh', to: 'Dammam' },
    { category: 'north_west', from: 'Jeddah', to: 'Madinah' }, { category: 'north_west', from: 'Madinah', to: 'Hail' }, { category: 'north_west', from: 'Hail', to: 'Sakaka' },
    { category: 'south_west', from: 'Abha', to: 'Khamish' }, { category: 'south_west', from: 'Khamish', to: 'Jizan' }, { category: 'south_west', from: 'Jizan', to: 'Muhayil' }, { category: 'south_west', from: 'Muhayil', to: 'Abha' },
    { category: 'central', from: 'Riyadh', to: 'Dawadmi' }, { category: 'central', from: 'Dawadmi', to: 'Qassim' }, { category: 'central', from: 'Qassim', to: 'Majmah' }, { category: 'central', from: 'Majmah', to: 'Riyadh' },
    { category: 'eastern', from: 'Dammam', to: 'Ahsa' }, { category: 'eastern', from: 'Ahsa', to: 'Nariyah' }, { category: 'eastern', from: 'Nariyah', to: 'Hafar' }, { category: 'eastern', from: 'Hafar', to: 'Khafji' }, { category: 'eastern', from: 'Khafji', to: 'Jubail' }, { category: 'eastern', from: 'Jubail', to: 'Dammam' },
];




function decodePolyline(encoded) {
    if (!encoded) { return []; }
    var points = []; var index = 0, len = encoded.length; var lat = 0, lng = 0;
    while (index < len) {
        var b, shift = 0, result = 0;
        do { if (index >= len) break; b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);

        if (b < 0x20 && index >= len && shift > 0 && (encoded.charCodeAt(index-1) - 63) < 0x20) break;
        var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat;
        shift = 0; result = 0;
        do { if (index >= len) break; b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);

        if (b < 0x20 && index >= len && shift > 0 && (encoded.charCodeAt(index-1) - 63) < 0x20) break;
        var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
        points.push([lat / 1E5, lng / 1E5]);
    } return points;
}



function formatDuration(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '--';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60);
    let durationString = '';
    if (hours > 0) { durationString += `${hours} hr `; }
    durationString += `${minutes} min`;
    return durationString.trim();
}


function getDirectionsErrorText(status) {

    if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined' && typeof window.google.maps.DirectionsStatus !== 'undefined') {
        switch (status) {
            case window.google.maps.DirectionsStatus.NOT_FOUND: return "Origin or destination not found.";
            case window.google.maps.DirectionsStatus.ZERO_RESULTS: return "No route could be found.";
            case window.google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED: return "Too many waypoints.";
            case window.google.maps.DirectionsStatus.MAX_ROUTE_LENGTH_EXCEEDED: return "Route is too long.";
            case window.google.maps.DirectionsStatus.INVALID_REQUEST: return "Invalid request.";
            case window.google.maps.DirectionsStatus.OVER_QUERY_LIMIT: return "API limit reached. Wait & retry.";
            case window.google.maps.DirectionsStatus.REQUEST_DENIED: return "Request denied (API key issue?).";
            case window.google.maps.DirectionsStatus.UNKNOWN_ERROR: return "Unknown server error.";
        }
    }

    switch(status) {
        case 'API_NOT_LOADED': return "Google API not loaded.";
        case 'NO_POLYLINE': return "Route found, geometry missing.";
        case 'LOCATION_NOT_FOUND': return "Internal: Location missing.";
        case 'CALCULATION_ERROR': return "Internal calculation error.";
        default: return `Unexpected error (${status || 'Unknown'}).`;
    }
}


async function getSingleRouteDetails(originLoc, destinationLoc) {
    return new Promise((resolve) => {

        if (typeof window.google === 'undefined' || typeof window.google.maps === 'undefined' || typeof window.google.maps.DirectionsService === 'undefined') {
            console.warn("DirectionsService not loaded when getSingleRouteDetails called.");
            resolve({ distance: null, duration: null, latLngs: [], errorStatus: 'API_NOT_LOADED' });
            return;
        }

        const directionsService = new window.google.maps.DirectionsService();

        const request = {
            origin: { lat: originLoc.lat, lng: originLoc.lng },
            destination: { lat: destinationLoc.lat, lng: destinationLoc.lng },
            travelMode: window.google.maps.TravelMode.DRIVING,
        };


        directionsService.route(request, (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
                const route = result.routes?.[0];
                if (route && route.overview_polyline) {

                    const decodedPath = decodePolyline(route.overview_polyline);
                    let totalDistanceMeters = 0, totalDurationSeconds = 0;


                    route.legs.forEach(leg => {
                        totalDistanceMeters += leg.distance?.value || 0;
                        totalDurationSeconds += leg.duration?.value || 0;
                    });


                    const distanceKm = (totalDistanceMeters / 1000).toFixed(1);
                    const durationText = formatDuration(totalDurationSeconds);


                    resolve({
                        distance: `${distanceKm} km`,
                        duration: durationText,
                        latLngs: decodedPath,
                        errorStatus: null
                    });
                } else {

                    console.warn(`Directions OK, but no polyline found (${originLoc.name} -> ${destinationLoc.name})`);
                    resolve({ distance: null, duration: null, latLngs: [], errorStatus: 'NO_POLYLINE' });
                }
            } else {

                console.warn(`Directions request failed (${originLoc.name} -> ${destinationLoc.name}): ${status}`);
                resolve({ distance: null, duration: null, latLngs: [], errorStatus: status });
            }
        });
    });
}



function MapBoundsFitter({ boundsToFit }) {
    const map = useMap();

    useEffect(() => {

        if (boundsToFit && typeof boundsToFit.isValid === 'function' && boundsToFit.isValid()) {

            map.fitBounds(boundsToFit.pad(0.15));
        }

    }, [boundsToFit, map]);

    return null;
}



function App() {

    const mapCenter = [24.7136, 46.6753];
    const initialZoom = 6;


    const [viewMode, setViewMode] = useState('custom');
    const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
    const [apiError, setApiError] = useState(null);


    const [selectedLocations, setSelectedLocations] = useState([]);
    const [routeLatLngs, setRouteLatLngs] = useState([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [routeError, setRouteError] = useState(null);
    const [routeDetails, setRouteDetails] = useState(null);
    const [routeCenter, setRouteCenter] = useState(null);


    const [allRoutesData, setAllRoutesData] = useState(null);
    const [isLoadingAllRoutes, setIsLoadingAllRoutes] = useState(false);
    const [allRoutesError, setAllRoutesError] = useState(null);
    const [selectedGroupCategory, setSelectedGroupCategory] = useState('all');
    const [highlightedRouteKey, setHighlightedRouteKey] = useState(null);


    const apiKey = import.meta.env.VITE_Maps_API_KEY;


    const routeDetailsIcon = useCallback((details) => {
        if (!details || !details.distance || !details.duration) return L.divIcon({ html: '' });

        const iconHtml = `<div class="route-details-marker"><strong>${details.distance}</strong><br/>${details.duration}</div>`;
        return L.divIcon({
            html: iconHtml,
            className: '',
            iconSize: 'auto',
            iconAnchor: [-5, -5]
        });
    }, []);


    useEffect(() => {

        if (window.google?.maps || window.googleMapsApiLoading) {
            if(window.google?.maps) setGoogleApiLoaded(true);
            return;
        }

        if (!apiKey) {
            console.error("FATAL: VITE_Maps_API_KEY is not defined in .env file.");
            setApiError("API Key Missing");
            return;
        }
        const scriptId = 'google-maps-script';

        if (document.getElementById(scriptId)) {
            if(window.google?.maps) setGoogleApiLoaded(true);
            return;
        }


        window.googleMapsApiLoading = true;

        window.initGoogleMapsApi = () => {
            console.log("Google Maps API loaded successfully via callback.");
            setGoogleApiLoaded(true);
            setApiError(null);
            delete window.initGoogleMapsApi;
            delete window.googleMapsApiLoading;
        };

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=routes&callback=initGoogleMapsApi`;
        script.async = true; script.defer = true;

        script.onerror = () => {
            console.error("Failed to load the Google Maps script. Check API key and network.");
            setApiError("Failed to load Google Maps script");
            setGoogleApiLoaded(false);

            if(window.initGoogleMapsApi) delete window.initGoogleMapsApi;
            if(window.googleMapsApiLoading) delete window.googleMapsApiLoading;
        };
        document.body.appendChild(script);

    }, [apiKey]);


    const handleLocationSelect = useCallback((location) => {
        setSelectedLocations(prevSelected => {
            const currentSelection = Array.isArray(prevSelected) ? prevSelected : [];
            const isSelected = currentSelection.some(sl => sl.id === location.id);

            return isSelected
                ? currentSelection.filter(loc => loc.id !== location.id)
                : [...currentSelection, location];
        });

        setRouteLatLngs([]); setRouteError(null); setRouteDetails(null); setRouteCenter(null);
    }, []);


    const handleClearSelection = useCallback(() => {
        setSelectedLocations([]);

        setRouteLatLngs([]); setRouteError(null); setRouteDetails(null); setRouteCenter(null);
    }, []);


    const handleCalculateRoute = useCallback(async () => {

        if (!googleApiLoaded) { setRouteError("Google API not ready yet."); return; }
        if (isLoadingRoute) return;
        if (!Array.isArray(selectedLocations) || selectedLocations.length !== 2) {
            setRouteError("Please select exactly two locations."); return;
        }


        setIsLoadingRoute(true); setRouteError(null); setRouteLatLngs([]); setRouteDetails(null); setRouteCenter(null);
        const [originLoc, destinationLoc] = selectedLocations;

        try {

            const result = await getSingleRouteDetails(originLoc, destinationLoc);


            if (result.errorStatus === null && result.latLngs?.length > 0) {
                setRouteLatLngs(result.latLngs);
                setRouteDetails({ distance: result.distance, duration: result.duration });

                const middleIndex = Math.floor(result.latLngs.length / 2);
                setRouteCenter(result.latLngs[middleIndex]);
                console.log(`Custom Route Calculated: ${originLoc.name} -> ${destinationLoc.name}, ${result.distance}, ${result.duration}`);
            } else {

                setRouteError(getDirectionsErrorText(result.errorStatus));
                setRouteLatLngs([]); setRouteDetails(null); setRouteCenter(null);
            }
        } catch (error) {

            console.error("Unexpected error calculating custom route:", error);
            setRouteError("An unexpected calculation error occurred.");
            setRouteLatLngs([]); setRouteDetails(null); setRouteCenter(null);
        } finally {
            setIsLoadingRoute(false);
        }
    }, [googleApiLoaded, selectedLocations, isLoadingRoute]);


    const calculateAllRoutes = useCallback(async () => {

        if (!googleApiLoaded) { console.warn("Attempted to calculate all routes before Google API loaded."); setAllRoutesError("Google API not ready."); return; }
        if (isLoadingAllRoutes) return;


        setIsLoadingAllRoutes(true); setAllRoutesError(null); setAllRoutesData(null);
        const results = [];
        console.log("Starting calculation of all structured routes...");


        for (const routeInfo of STRUCTURED_ROUTES) {
            const { category, from: fromName, to: toName } = routeInfo;
            const fromLoc = findLocationByName(fromName);
            const toLoc = findLocationByName(toName);


            if (!fromLoc || !toLoc) {
                console.warn(`Location definition missing for route: ${fromName} -> ${toName}`);
                results.push({ from: fromName, to: toName, category, distance: null, duration: null, latLngs: [], errorStatus: 'LOCATION_NOT_FOUND' });
                continue;
            }

            try {

                const routeDetailsResult = await getSingleRouteDetails(fromLoc, toLoc);

                results.push({ from: fromName, to: toName, category, ...routeDetailsResult });

                await new Promise(resolve => setTimeout(resolve, 150));
            } catch (error) {

                console.error(`Error processing structured route ${fromName}->${toName}:`, error);
                results.push({ from: fromName, to: toName, category, distance: null, duration: null, latLngs: [], errorStatus: 'CALCULATION_ERROR' });
            }
        }

        console.log("Finished calculating all structured routes.");
        setAllRoutesData(results);
        setIsLoadingAllRoutes(false);

    }, [googleApiLoaded, isLoadingAllRoutes]);


    useEffect(() => {

        if (viewMode === 'all' && !allRoutesData && !isLoadingAllRoutes && googleApiLoaded && !allRoutesError) {
            calculateAllRoutes();
        }


        if (viewMode !== 'custom') {
            setRouteLatLngs([]); setRouteDetails(null); setRouteCenter(null); setRouteError(null);
        }


        if (viewMode !== 'all') {
            setSelectedGroupCategory('all');
            setHighlightedRouteKey(null);


        }
    }, [viewMode, allRoutesData, isLoadingAllRoutes, googleApiLoaded, calculateAllRoutes, allRoutesError]);


    const filteredRoutes = useMemo(() => {

        if (viewMode !== 'all' || !allRoutesData) return [];

        if (selectedGroupCategory === 'all') return allRoutesData;

        return allRoutesData.filter(route => route.category === selectedGroupCategory);
    }, [viewMode, allRoutesData, selectedGroupCategory]);


    const boundsToFit = useMemo(() => {
        let points = [];
        try {
            if (viewMode === 'custom' && routeLatLngs?.length > 0) {

                points = routeLatLngs;
            } else if (viewMode === 'all' && filteredRoutes.length > 0) {

                points = filteredRoutes.flatMap(route => route.latLngs || []);
            }


            if (points.length > 0) {
                const bounds = L.latLngBounds(points);

                if (bounds.isValid()) return bounds;
                else console.warn("Calculated map bounds are invalid.");
            }
        } catch (error) {
            console.error("Error calculating map bounds:", error);
        }

        return null;
    }, [viewMode, routeLatLngs, filteredRoutes]);



    return (
        <div className="w-screen h-screen relative font-sans">

            <div className="absolute top-3 left-3 z-[1000] p-3 bg-white/85 backdrop-blur-sm rounded-lg shadow-lg max-w-xs md:max-w-sm flex flex-col">

                <div className="flex border-b pb-2 mb-2">
                    <button onClick={() => setViewMode('custom')} className={`flex-1 px-3 py-1 text-xs rounded-l-md border border-gray-300 transition-colors duration-150 ${ viewMode === 'custom' ? 'bg-indigo-600 text-white font-semibold z-10 ring-1 ring-indigo-400' : 'bg-white text-gray-700 hover:bg-gray-50' }`}>
                        Custom Route
                    </button>
                    <button onClick={() => setViewMode('all')} className={`flex-1 px-3 py-1 text-xs rounded-r-md border border-l-0 border-gray-300 transition-colors duration-150 ${ viewMode === 'all' ? 'bg-indigo-600 text-white font-semibold z-10 ring-1 ring-indigo-400' : 'bg-white text-gray-700 hover:bg-gray-50' }`}>
                        All Routes
                    </button>
                </div>


                {viewMode === 'custom' && (
                    <>
                        <h2 className="text-sm font-semibold mb-2 text-gray-800 flex-shrink-0">Select Two Locations:</h2>

                        <div className="flex flex-wrap gap-1 mb-2 max-h-28 overflow-y-auto flex-shrink-0">
                            {LOCATIONS.map(loc => {
                                const currentSelection = Array.isArray(selectedLocations) ? selectedLocations : [];
                                const isSelected = currentSelection.some(sl => sl.id === loc.id);
                                return (
                                    <button key={loc.id} onClick={() => handleLocationSelect(loc)} className={`px-2 py-0.5 text-xs rounded border transition-colors duration-150 ${ isSelected ? 'bg-indigo-600 text-white border-indigo-700 font-medium ring-2 ring-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400' }`}>
                                        {loc.name}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap gap-2 items-center mb-1 flex-shrink-0">
                            <button onClick={handleCalculateRoute} disabled={!googleApiLoaded || !Array.isArray(selectedLocations) || selectedLocations.length !== 2 || isLoadingRoute} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-opacity duration-150">
                                {isLoadingRoute ? 'Calculating...' : 'Calculate Route'}
                                {isLoadingRoute && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>}
                            </button>
                            <button onClick={handleClearSelection} disabled={!Array.isArray(selectedLocations) || selectedLocations.length === 0} className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-150">
                                Clear
                            </button>
                        </div>

                        <div className="text-xs min-h-[1.2em] mt-1 flex-shrink-0">
                            {apiError && <span className="text-red-700 font-semibold block">API Error: {apiError}</span>}
                            {!googleApiLoaded && !apiError && <span className="text-yellow-600 italic">Loading Google API...</span>}
                            {routeError && <span className="text-red-600 font-semibold">Error: {routeError}</span>}

                            {googleApiLoaded && Array.isArray(selectedLocations) && selectedLocations.length !== 2 && !routeError && !isLoadingRoute && (
                                <span className="text-blue-600 italic">Select exactly 2 locations.</span>
                            )}
                        </div>
                    </>
                )}


                {viewMode === 'all' && (
                    <div className="text-xs text-gray-700 flex-shrink-0 mt-2 w-full">
                        <h3 className="text-sm font-semibold mb-1 text-gray-800">Filter Key Routes (hover to preview route)</h3>

                        <div className="flex flex-wrap gap-1 mb-3">
                            {GROUP_FILTER_ORDER.map(key => (
                                <button
                                    key={key}
                                    onClick={() => { setSelectedGroupCategory(key); setHighlightedRouteKey(null); } }
                                    className={`px-2 py-0.5 text-[10px] rounded border transition-colors duration-150 ${
                                        selectedGroupCategory === key
                                            ? 'bg-indigo-600 text-white border-indigo-700 font-medium ring-1 ring-indigo-300'
                                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                    }`}
                                >
                                    {ROUTE_GROUPS[key].name}
                                </button>
                            ))}
                        </div>


                        {apiError && <p className="text-red-700 font-semibold">API Error: {apiError}</p>}
                        {isLoadingAllRoutes && (
                            <div className="flex items-center justify-center p-4">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span>Calculating all routes...</span>
                            </div>
                        )}
                        {allRoutesError && ( <p className="text-red-600 font-semibold">Error calculating routes: {allRoutesError}</p> )}


                        {filteredRoutes.length > 0 && !isLoadingAllRoutes && !apiError && (
                            <div className="max-h-48 overflow-y-auto border rounded">
                                <table className="w-full text-left border-collapse">

                                    <thead className="sticky top-0 bg-gray-100 z-10">
                                        <tr>
                                            <th className="p-1 border-b font-semibold">From</th>
                                            <th className="p-1 border-b font-semibold">To</th>
                                            <th className="p-1 border-b font-semibold">Distance</th>
                                            <th className="p-1 border-b font-semibold">Duration</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredRoutes.map((route, index) => {

                                            const routeInstanceKey = `${route.from}-${route.to}-${index}`;
                                            const errorText = route.errorStatus ? getDirectionsErrorText(route.errorStatus) : null;
                                            return (
                                                <tr
                                                    key={routeInstanceKey}
                                                    className="hover:bg-indigo-100 cursor-pointer"

                                                    onMouseEnter={() => setHighlightedRouteKey(routeInstanceKey)}

                                                    onMouseLeave={() => setHighlightedRouteKey(null)}
                                                >
                                                    <td className="p-1 border-b border-gray-200">{route.from}</td>
                                                    <td className="p-1 border-b border-gray-200">{route.to}</td>

                                                    <td className={`p-1 border-b border-gray-200 ${errorText ? 'text-red-500 italic' : ''}`}>
                                                        {route.distance ?? (errorText || '--')}
                                                    </td>

                                                    <td className={`p-1 border-b border-gray-200 ${errorText ? 'text-red-500 italic' : ''}`}>
                                                        {route.duration ?? '--'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {filteredRoutes.length === 0 && !isLoadingAllRoutes && allRoutesData && !apiError && (
                             <p className="text-gray-500 italic mt-2">No routes found for the selected filter.</p>
                        )}

                         {!allRoutesData && !isLoadingAllRoutes && !apiError && viewMode === 'all' && googleApiLoaded && (
                              <p className="text-gray-500 italic mt-2">Route data loading or calculation pending...</p>
                         )}
                    </div>
                )}
            </div>


            <div className="absolute top-0 left-0 w-full h-full z-0">
                <MapContainer center={mapCenter} zoom={initialZoom} scrollWheelZoom={true} className="h-full w-full">

                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />


                    {LOCATIONS.map(location => (
                        <Marker key={location.id} position={[location.lat, location.lng]} icon={customMarkerIcon} >
                            <Popup>{location.name} ({location.type})</Popup>
                        </Marker>
                    ))}




                    {viewMode === 'custom' && routeLatLngs.length > 0 && (
                        <Polyline positions={routeLatLngs} pathOptions={ROUTE_STYLES.highlight} />
                    )}

                    {viewMode === 'custom' && routeDetails && routeCenter && (
                        <Marker position={routeCenter} icon={routeDetailsIcon(routeDetails)} interactive={false} />
                    )}


                    {viewMode === 'all' && filteredRoutes.map((route, index) => {

                        if (!route.latLngs || route.latLngs.length === 0) return null;


                        const routeInstanceKey = `${route.from}-${route.to}-${index}`;


                        const isHighlighted = highlightedRouteKey === routeInstanceKey;


                        const styleOptions = isHighlighted
                            ? ROUTE_STYLES.highlight
                            : (ROUTE_STYLES[route.category] || ROUTE_STYLES.central);

                        return (
                            <Polyline
                                key={routeInstanceKey}
                                positions={route.latLngs}
                                pathOptions={styleOptions}
                            >

                                <Tooltip sticky>{route.from} to {route.to} ({route.category})</Tooltip>
                            </Polyline>
                        );
                    })}



                    <MapBoundsFitter boundsToFit={boundsToFit} />

                </MapContainer>
            </div>
        </div>
    );
}


export default App;