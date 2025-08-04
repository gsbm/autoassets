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
