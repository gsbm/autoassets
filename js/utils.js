/****************************************************************************************
Display a toast message
****************************************************************************************/
function displayToast({
    title = "",
    message = "",
    type = "info",
    duration = 3000
}) {
    const main = document.getElementById("toast-container");
    if (main) {
        const toast = document.createElement("div");
    
        // Auto remove toast
        const autoRemoveId = setTimeout(function () {
            main.removeChild(toast);
        }, duration + 1000);
    
        // Remove toast when clicked
        toast.onclick = function (e) {
            if (e.target.closest(".toast-close")) {
            main.removeChild(toast);
            clearTimeout(autoRemoveId);
            }
        };

        const icons = {
            success: "icon icon-circle-check",
            info: "icon icon-info",
            warning: "icon icon-triangle-alert",error: "icon icon-circle-alert"
        };
        const icon = icons[type];
        const delay = (duration / 1000).toFixed(2);
    
        toast.classList.add("toast", `toast--${type}`);
        toast.style.animation = `slideInLeft ease .3s, fadeOut linear 1s ${delay}s forwards`;
    
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast__body">
                <h3 class="toast-title">${title}</h3>
                <p class="toast-message">${message}</p>
            </div>
            <div class="toast-close">
                <i class="icon icon-x"></i>
            </div>
        `;
        main.appendChild(toast);
    }
}

/****************************************************************************************
Display a form event
****************************************************************************************/
function resetFormEvents() {
    const container = document.querySelector('.form-event-container');
    const eventItems = document.querySelectorAll('.form-event-wrapper .event-item');
    container.classList.remove('active');
    setTimeout(() => {
        eventItems.forEach(eventItem => {
            eventItem.remove();
        });
        previousEvent = "";
    }, 300);
}

let previousEvent = "";
function addFormEvent(event) {
    if (event === previousEvent) {
        return;
    }
    const container = document.querySelector('.form-event-container');
    const wrapper = document.querySelector('.form-event-wrapper');
    if (!container.classList.contains('active')) {
        container.classList.add('active');
    }
    const eventItem = document.createElement('span');
    eventItem.classList.add('event-item');
    eventItem.textContent = event;
    wrapper.appendChild(eventItem);
    setTimeout(() => {
        eventItem.classList.add('active');
    }, 300);

    previousEvent  = event;
}

/****************************************************************************************
Update sheme based on user preference
****************************************************************************************/
function updateColorScheme(type) {
    const root = document.querySelector(':root')
    if (type === "light") {
        root.classList.add('light');
    } else {
        root.classList.remove('light');
    }
}

function toggleColorScheme() {
    const root = document.querySelector(':root');
    if (root.classList.contains('light')) {
        updateColorScheme("dark");
    } else {
        updateColorScheme("light");
    }
}

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    updateColorScheme("light");
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    const new_color_scheme = event.matches ? "dark" : "light";
    updateColorScheme(new_color_scheme);
});
