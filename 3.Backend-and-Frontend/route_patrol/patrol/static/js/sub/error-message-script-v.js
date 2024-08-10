document.addEventListener('DOMContentLoaded', function() {
    var messages = document.querySelectorAll('.message-container .success-message, .message-container .error-message');
    // display successful and error message for 5 seconds
    messages.forEach(function(message) {
        setTimeout(function() {
            message.style.display = 'none';
        }, 5000); 
    });
});
