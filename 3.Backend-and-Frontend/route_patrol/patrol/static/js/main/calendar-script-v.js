document.addEventListener('DOMContentLoaded', function() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const todayButton = document.querySelector('.calendar-day');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    const mediumTitle = document.querySelector('.calendar-month-year h3');
    const calendarCard = document.querySelector('.calendar-card .calendar-body');
    let currentDate = new Date();

    function renderCalendar() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        mediumTitle.textContent = `${monthNames[month]} ${year}`;

        // highlight 'Today' button 
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
        todayButton.style.backgroundColor = isCurrentMonth ? 'var(--primary-color)' : 'var(--button-secondary-hover-color)';

        // render calendar grid and entries
        renderCalendarEntries(month, year);
    }

    function renderCalendarEntries(month, year) {
        calendarCard.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // create grid cells for days of the previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayCell = createCalendarDayCell(daysInPrevMonth - i, 'outside-month');
            calendarCard.appendChild(dayCell);
        }

        // create grid cells for days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = createCalendarDayCell(day, 'current-month');
            appendEventsToDayCell(dayCell, month, year);
            calendarCard.appendChild(dayCell);
        }

        // create grid cells for days of the next month 
        const totalCells = firstDay + daysInMonth;
        const remainingCells = 7 - (totalCells % 7);
        for (let i = 1; i <= remainingCells && remainingCells < 7; i++) {
            const dayCell = createCalendarDayCell(i, 'outside-month');
            calendarCard.appendChild(dayCell);
        }
    }

    function createCalendarDayCell(day, monthClass) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day-cell', monthClass);
        dayCell.dataset.day = day;
        return dayCell;
    }

    function getWeekOfMonth(date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return Math.floor((date.getDate() + firstDay - 1) / 7) + 1;
    }

    function appendEventsToDayCell(dayCell, month, year) {
        const day = parseInt(dayCell.dataset.day);
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); 
        const weekOfMonth = getWeekOfMonth(date); 

        // add events for Route_A on every Monday and Thursday
        if (dayOfWeek === 1 || dayOfWeek === 4) { 
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event', 'route-a');
            eventDiv.textContent = `Route_A`;
            eventDiv.style.backgroundColor = 'var(--primary-color)'; 

            // add hover event for popup
            eventDiv.addEventListener('mouseenter', function() {
                const popup = createPopup(calendarEntries.Route_A); 
                eventDiv.appendChild(popup);
            });

            eventDiv.addEventListener('mouseleave', function() {
                const popup = eventDiv.querySelector('.popup');
                if (popup) {
                    eventDiv.removeChild(popup);
                }
            });

            dayCell.style.backgroundColor = 'var(--route-a-color)';

            dayCell.appendChild(eventDiv);
        }

        // add events for Route_B on every Friday
        if (dayOfWeek === 5) {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event', 'route-b');
            eventDiv.textContent = `Route_B`;
            eventDiv.style.backgroundColor = 'var(--primary-color)'; 

            // add hover event for popup
            eventDiv.addEventListener('mouseenter', function() {
                const popup = createPopup(calendarEntries.Route_B); 
                eventDiv.appendChild(popup);
            });

            eventDiv.addEventListener('mouseleave', function() {
                const popup = eventDiv.querySelector('.popup');
                if (popup) {
                    eventDiv.removeChild(popup);
                }
            });

            dayCell.style.backgroundColor = 'var(--route-b-color)';

            dayCell.appendChild(eventDiv);
        }

        // add events for Route_C on the 2nd and 4th Tuesday
        if (dayOfWeek === 2 && (weekOfMonth === 2 || weekOfMonth === 4)) { 
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event', 'route-c');
            eventDiv.textContent = `Route_C`;
            eventDiv.style.backgroundColor = 'var(--primary-color)'; 

            // add hover event for popup
            eventDiv.addEventListener('mouseenter', function() {
                const popup = createPopup(calendarEntries.Route_C); 
                eventDiv.appendChild(popup);
            });

            eventDiv.addEventListener('mouseleave', function() {
                const popup = eventDiv.querySelector('.popup');
                if (popup) {
                    eventDiv.removeChild(popup);
                }
            });

            dayCell.style.backgroundColor = 'var(--route-c-color)';

            dayCell.appendChild(eventDiv);
        }

        // add events for Route_D on the 1st Wednesday
        if (dayOfWeek === 3 && weekOfMonth === 1) {
            const eventDiv = document.createElement('div');
            eventDiv.classList.add('event', 'route-d');
            eventDiv.textContent = `Route_D`;
            eventDiv.style.backgroundColor = 'var(--primary-color)'; 

            // add hover event for popup
            eventDiv.addEventListener('mouseenter', function() {
                const popup = createPopup(calendarEntries.Route_D); 
                eventDiv.appendChild(popup);
            });

            eventDiv.addEventListener('mouseleave', function() {
                const popup = eventDiv.querySelector('.popup');
                if (popup) {
                    eventDiv.removeChild(popup);
                }
            });

            dayCell.style.backgroundColor = 'var(--route-d-color)';

            dayCell.appendChild(eventDiv);
        }
    }

    // create popup for routes    
    function createPopup(entries) {
        const popup = document.createElement('div');
        popup.classList.add('popup');
        popup.style.position = 'absolute';
        popup.style.zIndex = '10';
        popup.style.backgroundColor = 'var(--bg-secondary-color)';
        popup.style.border = 'var(--primary-border-color)';
        popup.style.borderRadius = '15px';
        popup.style.padding = '10px';
        popup.style.boxShadow = 'var(--box-shadow-main-color)';
        popup.style.maxHeight = '50vh'; 
        popup.style.maxWidth = '80vw'; 
        popup.style.overflow = 'auto'

        //update size of the popup 
        function updatePopupSize() {
            const windowWidth = window.innerWidth;
            if (windowWidth > 750) {
                popup.style.width = '400px';
                popup.style.height = '300px';
            } else {
                popup.style.width = '200px';
                popup.style.height = '150px';
            }
        }

        // initial size update
        updatePopupSize();
    
        // add data in the table
        popup.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #ccc; padding: 5px;">Street Name</th>
                        <th style="border: 1px solid #ccc; padding: 5px;">Intersections</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.map(entry => `
                        <tr>
                            <td style="border: 1px solid #ccc; padding: 5px;">${entry.street_name}</td>
                            <td style="border: 1px solid #ccc; padding: 5px;">${entry.from_intersection} to ${entry.to_intersection}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    
        // update position of the popup
        function updatePopupPosition(event) {
            const windowWidth = window.innerWidth;
            const windowHight = window.innerHeight;
            const mouseX = event.clientX;
            const mouseY = event.clientY;

            
            if (mouseX > windowWidth / 1.8 && mouseY < windowHight / 1.5 ) {
                // mouse is on the right side up
                windowWidth > 750 ? popup.style.left = `${-200}px`: popup.style.left = `${-100}px`;
                popup.style.top = `${50}px`;
            } else if(mouseX < windowWidth / 2.3 && mouseY < windowHight / 1.5 ) {
                // mouse is on the left side up
                windowWidth > 750 ? popup.style.left = `${280}px`: popup.style.left = `${150}px`;
                popup.style.top = `${50}px`;
            }else if (mouseX > windowWidth / 1.8 && mouseY > windowHight / 1.5){
                // Mouse is on the right side down
                windowWidth > 750 ? popup.style.left = `${-200}px`: popup.style.left = `${-100}px`;
                windowWidth > 750 ? popup.style.top = `${-180}px`: popup.style.top = `${-70}px`;
            } else if (mouseX < windowWidth / 2.3 && mouseY > windowHight / 1.5){
                // Mouse is on the left side down
                windowWidth > 750 ? popup.style.left = `${280}px`: popup.style.left = `${150}px`;
                windowWidth > 750 ? popup.style.top = `${-180}px`: popup.style.top = `${-70}px`;
            } else if (mouseX < windowWidth / 1.5 && mouseY < windowHight / 1.5) {
                // Mouse is on the Middle uP
                windowWidth > 750 ? popup.style.top = `${110}px`: popup.style.top = `${90}px`;
                popup.style.left = `${50}px`; 
            
            } else if (mouseX < windowWidth / 1.5 && mouseY > windowHight / 1.5) {
                // Mouse is on the Middle down
                windowWidth > 750 ? popup.style.top = `${-245}px`: popup.style.top = `${-100}px`;
                popup.style.left = `${50}px`; 
            }
        }
    
        // event listener to update position
        document.addEventListener('mousemove', updatePopupPosition);

        // remove popup
        function removePopup() {
            document.removeEventListener('mousemove', updatePopupPosition);
            popup.remove();
        }

        popup.addEventListener('mouseleave', (e) => {
            const relatedTarget = e.relatedTarget;
            if (relatedTarget !== popup && relatedTarget !== eventDiv) {
                removePopup();
            }
        });

        popup.addEventListener('mouseenter', () => {
            document.removeEventListener('mousemove', updatePopupPosition);
        });

        popup.addEventListener('mouseleave', () => {
            document.addEventListener('mousemove', updatePopupPosition);
        });
    
        return popup;
    }
    

    todayButton.addEventListener('click', function() {
        currentDate = new Date();
        renderCalendar();
    });

    prevButton.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextButton.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // initial render
    renderCalendar();
});
