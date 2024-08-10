document.addEventListener('DOMContentLoaded', function() {
    // initialize circular progress 
    const progressBars = document.querySelectorAll('.circular-progress');

    progressBars.forEach(bar => {
        const progressCircle = bar.querySelector('.progress');
        const percentage = bar.getAttribute('data-percentage');

        const radius = progressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        progressCircle.style.strokeDasharray = `${circumference}`;
        progressCircle.style.strokeDashoffset = offset;
    });

    // fetch dashboard data and animate counts
    fetchDataAndAnimate();

    function fetchDataAndAnimate() {
        fetch('/api/dashboard-data/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }
                return response.json();
            })
            .then(data => {
                animateCount('total-routes', data.totalRoutes);
                animateCount('predicted-routes', data.predictedRoutes);
            })
            .catch(error => console.error('Error fetching data:', error));
    }

    // animate counting from 0 to endValue
    function animateCount(id, endValue) {
        let startValue = 0;
        const duration = 1000;
        const element = document.getElementById(id);
        const stepTime = Math.abs(Math.floor(duration / endValue));
        const timer = setInterval(() => {
            startValue += 1;
            element.textContent = startValue;
            if (startValue === endValue) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    // update progress percentage dynamically
    function updateProgressPercentage(id, percentage) {
        const progressBar = document.getElementById(id);
        progressBar.setAttribute('data-percentage', percentage);
        const event = new Event('progress-update');
        progressBar.dispatchEvent(event);
    }
});
