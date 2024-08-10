document.addEventListener('DOMContentLoaded', function() {
    const mapErrorDiv = document.getElementById('map-error');
    const streetNameSelect = document.getElementById('street-name');
    const loadingSpinner = document.getElementById('map-spinner');
    let map;

    // geographical bounds of Orillia
    const orilliaBounds = {
        north: 44.6464,
        south: 44.5446,
        west: -79.4504,
        east: -79.3641
    };

    // show loading spinner
    function showLoadingSpinner() {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'inline';
        }
    };

    // hide loading spinner
    function hideLoadingSpinner() {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    };

    // show loading spinner
    showLoadingSpinner();

    // get coordinates using the name of a place
    async function getCoordinates(placeName) {
        return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${placeName}, Orillia`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch coordinates for ${placeName}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.length > 0) {
                    return {
                        lat: parseFloat(data[0].lat),
                        lon: parseFloat(data[0].lon)
                    };
                } else {
                    return null; 
                }
            })
            .catch(error => {
                console.error('Error fetching coordinates:', error);
                throw error; 
            });
    };

    // initialize the map
    function initializeMap(coords) {
        map = L.map('map').setView([coords.lat, coords.lon], 13);

        // load and display tile layers on the map
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    };

    // handle fetching intersections
    async function fetchIntersections(streetName) {
        return fetch(`/api/get-intersections/?street_name=${streetName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch intersections for ${streetName}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error fetching intersections:', error);
                throw error; 
            });
    };

    // check if coordinates are within Orillia bounds
    function isWithinOrilliaBounds(coords) {
        return coords.lat <= orilliaBounds.north &&
               coords.lat >= orilliaBounds.south &&
               coords.lon >= orilliaBounds.west &&
               coords.lon <= orilliaBounds.east;
    };

    // get the route between two points using OpenRouteService
    async function getRoute(fromCoords, toCoords) {
        const apiKey = '5b3ce3597851110001cf6248ab96b3d7c2a14acd9bc510f29f4d6321'; 
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${fromCoords.lon},${fromCoords.lat}&end=${toCoords.lon},${toCoords.lat}`;

        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data && data.features && data.features.length > 0) {
                    return data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                } else {
                    throw new Error('No route found');
                }
            })
            .catch(error => {
                console.error('Error fetching route:', error);
                throw error;
            });
    }

    // display intersections on the map
    function processIntersections(intersections, streetName) {
        // clear markers and routes
        map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });

        let bounds = [];

        // store street name and intersections
        let streetIntersections = [];

        // add streetName and intersections
        intersections.forEach((intersection, index) => {
            const intersectionData = `${streetName}, ${intersection.from_intersection__name} to ${intersection.to_intersection__name}`;
            const fromIntersectionData = `${streetName}, ${intersection.from_intersection__name}`;
            const toIntersectionData = `${streetName}, ${intersection.to_intersection__name}`;
            streetIntersections.push(intersectionData);

            const parts = intersectionData.split(', ');
            const fromPlace = parts[1].split(' to ')[0];
            const toPlace = parts[1].split(' to ')[1];

            Promise.all([getCoordinates(fromPlace), getCoordinates(toPlace)])
                .then(coords => {
                    const fromCoords = coords[0];
                    const toCoords = coords[1];

                    // check if coordinates skip if not found
                    if (!fromCoords || !toCoords || !isWithinOrilliaBounds(fromCoords) || !isWithinOrilliaBounds(toCoords)) {
                        return;
                    }

                    bounds.push([fromCoords.lat, fromCoords.lon]);
                    bounds.push([toCoords.lat, toCoords.lon]);

                    // add markers to the map
                    const fromMarker = L.marker([fromCoords.lat, fromCoords.lon]).addTo(map);
                    const toMarker = L.marker([toCoords.lat, toCoords.lon]).addTo(map);

                    // create Tooltip for each marker with intersection details
                    fromMarker.bindTooltip(fromIntersectionData, {
                        direction: 'top',
                        offset: L.point(0, -20), 
                        sticky: true,
                        className: 'custom-tooltip'
                    });

                    toMarker.bindTooltip(toIntersectionData, {
                        direction: 'top',
                        offset: L.point(0, -20), 
                        sticky: true,
                        className: 'custom-tooltip'
                    });

                    // get route and draw polyline
                    getRoute(fromCoords, toCoords).then(routeCoords => {
                        L.polyline(routeCoords, {
                            color: 'red',
                            weight: 10,
                            opacity: 0.5
                        }).addTo(map);
                    });

                    // center map on the first intersection
                    if (index === 0) {
                        map.setView([fromCoords.lat, fromCoords.lon], 13);
                    }
                })
                .catch(error => {
                    console.error('Error fetching intersection coordinates:', error);
                })
                .finally(() => {
                    // hide loading spinner 
                    hideLoadingSpinner();
                });
        });

        // adjust map to fit all markers
        if (bounds.length > 0) {
            map.fitBounds(bounds);
        }
    };

    // listen to selection change
    streetNameSelect.addEventListener('change', function() {
        const streetName = streetNameSelect.value;

        // show loading spinner 
        showLoadingSpinner();

        fetchIntersections(streetName)
            .then(data => {
                // clear the previous intersections
                streetIntersections = [];

                // ensure map is initialized first
                if (!map) {
                    console.error('Map is not initialized');
                    hideLoadingSpinner();
                    return;
                }

                // process and display intersections on the map
                processIntersections(data, streetName);
            })
            .catch(error => {
                console.error('Error fetching intersections:', error);
                hideLoadingSpinner();
            });
    });

    // Initialize the map and center it on Orillia
    getCoordinates('Orillia')
        .then(coords => {
            // show loading spinner 
            showLoadingSpinner();
            
            initializeMap(coords);

            // hide loading spinner 
            hideLoadingSpinner();
        })
        .catch(error => {
            console.error('Error fetching coordinates:', error);
            mapErrorDiv.style.display = 'block'; 
            hideLoadingSpinner();
        });
});
