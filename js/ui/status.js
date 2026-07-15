let previousEvent = "";

export function resetFormEvents() {
    const container = document.querySelector(".form-event-container");
    const eventItems = document.querySelectorAll(".form-event-wrapper .event-item");
    container.classList.remove("active");
    setTimeout(() => {
        eventItems.forEach((eventItem) => eventItem.remove());
        previousEvent = "";
    }, 300);
}

export function addFormEvent(event) {
    if (event === previousEvent) {
        return;
    }

    const container = document.querySelector(".form-event-container");
    const wrapper = document.querySelector(".form-event-wrapper");
    container.classList.add("active");

    const eventItem = document.createElement("span");
    eventItem.classList.add("event-item");
    eventItem.textContent = event;
    wrapper.appendChild(eventItem);
    setTimeout(() => eventItem.classList.add("active"), 300);

    previousEvent = event;
}

export function updateColorScheme(type) {
    document.documentElement.classList.toggle("light", type === "light");
}

export function initColorScheme() {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    updateColorScheme(media.matches ? "light" : "dark");
    media.addEventListener("change", (event) => {
        updateColorScheme(event.matches ? "light" : "dark");
    });
}
