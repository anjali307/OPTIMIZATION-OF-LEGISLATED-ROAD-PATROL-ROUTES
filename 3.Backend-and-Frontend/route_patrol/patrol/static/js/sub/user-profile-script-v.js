// show user profile
function toggleDropdown() {
    var dropdown = document.getElementById('user-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// listen to a click on user-profile button
document.addEventListener('click', function(event) {
    var isClickInside = document.querySelector('.header-right').contains(event.target);
    if (!isClickInside) {
        var dropdown = document.getElementById('user-dropdown');
        dropdown.style.display = 'none';
    }
});
