document.addEventListener("DOMContentLoaded", function() {
    let rows = document.querySelectorAll(".patrol-table-row");
    let rowsPerPage = 10;
    let currentPage = 1;

    // show rows based on the current page
    function showRows() {
        rows.forEach((row, index) => {
            row.style.display = (index < rowsPerPage * currentPage) ? "table-row" : "none";
        });
    }

    // listen to "Click Event" 
    document.getElementById("view-more-btn").addEventListener("click", function() {
        currentPage++;
        showRows();
    });

    showRows();

    // format date for Flatpickr
    function formatDateForFlatpickr(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // handle edit button clicks
    document.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", function() {
            const entryId = button.closest('tr').id;
            const row = document.getElementById(entryId);
            const stName = row.cells[0].innerText;
            const ptrlFreq = row.cells[1].innerText;
            const date = row.cells[2].innerText;
            const comments = row.cells[3].innerText;

            // inject the form content into the modal
            const modal = document.getElementById("edit-modal");
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <form id="edit-form" class="edit-form">
                        <input type="hidden" name="entry-id" id="entry-id" value="${entryId}">
                        <div class="form-group">
                            <label for="street-name">Patrol Route:</label>
                            <input type="text" name="street-name" id="street-name" value="${stName}" required>
                        </div>
                        <div class="form-group">
                            <label for="patrol-frequency">Frequency:</label>
                            <input type="text" name="patrol-frequency" id="patrol-frequency" value="${ptrlFreq}" required>
                        </div>
                        <div class="form-group">
                            <label for="date">Date:</label>
                            <input type="text" name="date" id="date-set" value="${date}" required>
                        </div>
                        <div class="form-group">
                            <label for="comment">Comments:</label>
                            <input type="text" name="comment" id="comment" value="${comments}" required>
                        </div>
                        <button type="submit" class="save-btn">Save</button>
                    </form>
                </div>
            `;

            // initialize Flatpickr 
            flatpickr("#date-set", {
                dateFormat: "Y-m-d", 
                defaultDate: formatDateForFlatpickr(date),
                minDate: formatDateForFlatpickr(date),
                altInput: true,      
                altFormat: "F j, Y", 
            });

            // display the modal
            modal.style.display = "block";

            // close button
            document.querySelector(".close-btn").addEventListener("click", function() {
                modal.style.display = "none";
            });

            // close modal when clicking outside of it
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = "none";
                }
            }

            // handle form submission
            document.getElementById("edit-form").addEventListener("submit", function(event) {
                event.preventDefault();

                const entryId = document.getElementById("entry-id").value;
                const formData = new FormData(this);

                fetch(`/edit-entry/${entryId}/`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        location.reload();
                    } else {
                        alert(data.message);
                    }
                });
            });
        });
    });

    // handle delete button clicks
    document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", function() {
            const entryId = button.closest('tr').id;
            
            // show modal
            const modal = document.getElementById('delete-modal');
            modal.style.display = 'block';

            // get the confirm and cancel buttons
            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');

            // confirm delete action
            confirmBtn.onclick = function() {
                fetch(`/delete-entry/${entryId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        document.getElementById(entryId).remove();
                    } else {
                        alert(data.message);
                    }
                    modal.style.display = 'none';
                });
            };

            // cancel delete action
            cancelBtn.onclick = function() {
                modal.style.display = 'none';
            };

            // close modal when clicking outside
            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            };
        });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
