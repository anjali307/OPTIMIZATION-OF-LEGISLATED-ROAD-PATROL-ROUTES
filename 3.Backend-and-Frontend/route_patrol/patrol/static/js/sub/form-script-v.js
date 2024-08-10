document.addEventListener('DOMContentLoaded', function() {
    const routeSelect = document.getElementById('route');
    const streetNameSelect = document.getElementById('street-name');
    const streetIntersectionsSelect = document.getElementById('street-intersections');
    const patrolFrequencySelect = document.getElementById('patrol-frequency');

    // fetch and add street names
    routeSelect.addEventListener('change', function() {
        const routeId = routeSelect.value;

        fetchStreetNames(routeId)
            .then(data => populateStreetNamesSelect(data))
            .catch(error => {
                console.error('Error fetching street names:', error);
            });

    });

    // fetch and add street intersections and patrol frequency
    streetNameSelect.addEventListener('change', function() {
        const streetName = streetNameSelect.value;

        fetchIntersections(streetName)
            .then(data => {
                populateIntersectionsSelect(data);
                populatePatrolFrequencySelect(data);
            })
            .catch(error => {
                console.error('Error fetching intersections:', error);
            });
    });

    // fetch street names from API
    async function fetchStreetNames(routeId) {
        try {
            const response = await fetch(`/api/get-street-names/?route_id=${routeId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch street names for route ${routeId}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching street names:', error);
            throw error;
        }
    }

    // fetch intersections from API
    async function fetchIntersections(streetName) {
        try {
            const response = await fetch(`/api/get-intersections/?street_name=${streetName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch intersections for ${streetName}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching intersections:', error);
            throw error;
        }
    }

    // add street names select element
    function populateStreetNamesSelect(data) {
        // clear existing options
        streetNameSelect.innerHTML = '<option value="" disabled selected>Select Street Name</option>';

        // remove duplicates and sort alphabetically
        const seen = new Set();
        const uniqueStreets = data.filter(street => {
            const firstWord = street.split(' ')[0];
            if (seen.has(firstWord)) {
                return false;
            } else {
                seen.add(firstWord);
                return true;
            }
        }).sort();

        // add new options
        uniqueStreets.forEach(street => {
            const option = document.createElement('option');
            option.value = street;
            option.textContent = street;
            streetNameSelect.appendChild(option);
        });
    }

    // add street intersections select element
    function populateIntersectionsSelect(data) {
        // clear existing options
        streetIntersectionsSelect.innerHTML = '<option value="" disabled selected>Select Street Intersections</option>';

        // add new options
        data.forEach(intersection => {
            const option = document.createElement('option');
            option.value = `${intersection.from_intersection__name} to ${intersection.to_intersection__name}`;
            option.textContent = `${intersection.from_intersection__name} to ${intersection.to_intersection__name}`;
            streetIntersectionsSelect.appendChild(option);
        });
    }

    // add patrol frequency select element
    function populatePatrolFrequencySelect(data) {
        // clear existing options
        patrolFrequencySelect.innerHTML = '<option value="" disabled selected>Select Patrol Frequency</option>';

        // store unique patrol frequencies
        const uniqueFrequencies = new Set();
        data.forEach(intersection => {
            if (intersection.patrol_frequency !== "Need AADT") { 
                uniqueFrequencies.add(intersection.patrol_frequency);
            }
        });

        uniqueFrequencies.forEach(freq => {
            const option = document.createElement('option');
            option.value = freq;
            option.textContent = freq;
            patrolFrequencySelect.appendChild(option);
        });
    }

    // get the current date in "F j, Y" format
    function getCurrentDate() {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date().toLocaleDateString('en-US', options);
    }

    // set placeholder to current date
    const dateInput = document.getElementById('date');
    dateInput.placeholder = getCurrentDate();

    // initialize Flatpickr 
    flatpickr("#date", {
        dateFormat: "Y-m-d", 
        minDate: "today",    
        altInput: true,      
        altFormat: "F j, Y", 
    });
});
