import { preset_list } from "../config/presets.js";

export function initForm({ onTypeChange }) {
    const formSettingsContainer = document.querySelector(".form-settings-container");
    const formSettingsLabel = document.querySelector(".form-settings-label");
    const formEventContainer = document.querySelector(".form-event-container");
    const loaderContainer = document.querySelector(".loader-container");
    const viewerContainer = document.querySelector(".viewer-container");

    function toggleForm() {
        const expanded = formSettingsContainer.classList.toggle("active");
        formSettingsLabel.classList.toggle("active");
        formSettingsLabel.setAttribute("aria-expanded", String(expanded));
        loaderContainer.classList.toggle("blur");
        viewerContainer.classList.toggle("blur");
        formEventContainer.classList.toggle("hidden", expanded);
    }

    formSettingsLabel.addEventListener("click", toggleForm);
    formSettingsLabel.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleForm();
        }
    });

    document.getElementById("preset-button").addEventListener("click", () => {
        document.getElementById("prompt-text").value =
            preset_list[Math.floor(Math.random() * preset_list.length)];
    });

    const formTypeItems = document.querySelectorAll(".form-type-container .type-item");

    function updateType(type, item) {
        formTypeItems.forEach((entry) => {
            entry.classList.remove("active");
            entry.setAttribute("aria-selected", "false");
            entry.tabIndex = -1;
        });
        item.classList.add("active");
        item.setAttribute("aria-selected", "true");
        item.tabIndex = 0;

        document.querySelectorAll(".form-input").forEach((element) => {
            element.classList.add("type-disabled");
            if (element.tagName === "INPUT") {
                element.removeAttribute("required");
            }
        });
        document.querySelectorAll(`.form-${type}`).forEach((element) => {
            element.classList.remove("type-disabled");
            if (element.tagName === "INPUT") {
                element.setAttribute("required", "");
            }
        });

        onTypeChange(type);
    }

    formTypeItems.forEach((item, index) => {
        item.tabIndex = index === 0 ? 0 : -1;
        item.setAttribute("role", "tab");
        item.setAttribute("aria-selected", String(index === 0));

        item.addEventListener("click", () => updateType(item.id, item));
        item.addEventListener("keydown", (event) => {
            const tabs = [...formTypeItems];
            const currentIndex = tabs.indexOf(item);

            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                const nextIndex = event.key === "ArrowRight"
                    ? (currentIndex + 1) % tabs.length
                    : (currentIndex - 1 + tabs.length) % tabs.length;
                tabs[nextIndex].focus();
                updateType(tabs[nextIndex].id, tabs[nextIndex]);
            }

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                updateType(item.id, item);
            }
        });
    });

    const promptImageLabel = document.querySelector('label[for="prompt_image"]');
    let promptImageInput = document.getElementById("prompt_image");
    let previewObjectUrl = null;

    function setPreviewFromFile(file) {
        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
        }
        previewObjectUrl = URL.createObjectURL(file);
        promptImageLabel.querySelector(".input-preview-image").style.backgroundImage =
            `url(${previewObjectUrl})`;
    }

    function resetPromptImage() {
        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = null;
        }
        promptImageInput.remove();
        const input = document.createElement("input");
        input.id = "prompt_image";
        input.name = "prompt_image";
        input.type = "file";
        input.accept = "image/png, image/jpeg";
        input.classList.add("form-input", "form-type-image");
        input.setAttribute("required", "");
        promptImageLabel.before(input);
        promptImageInput = input;
        promptImageInput.addEventListener("change", handlePromptImageChange);
    }

    function handlePromptImageChange() {
        const file = promptImageInput.files?.[0];
        if (!file) {
            return;
        }
        promptImageInput.classList.add("active");
        setPreviewFromFile(file);
    }

    promptImageInput.addEventListener("change", handlePromptImageChange);

    promptImageLabel.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            promptImageLabel.click();
        }
    });

    promptImageLabel.addEventListener("click", () => {
        if (promptImageInput.classList.contains("active")) {
            promptImageInput.classList.remove("active");
            promptImageLabel.querySelector(".input-preview-image").style.backgroundImage = "none";
            resetPromptImage();
            return;
        }
        promptImageInput.click();
    });

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        document.addEventListener(eventName, (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });

    ["dragenter", "dragover"].forEach((eventName) => {
        promptImageLabel.addEventListener(eventName, () => {
            if (!promptImageInput.classList.contains("active")) {
                promptImageLabel.classList.add("dragover");
            }
        });
    });

    promptImageLabel.addEventListener("dragleave", () => {
        promptImageLabel.classList.remove("dragover");
    });

    promptImageLabel.addEventListener("drop", (event) => {
        promptImageLabel.classList.remove("dragover");
        const file = event.dataTransfer.files?.[0];
        if (!file || promptImageInput.classList.contains("active")) {
            return;
        }
        const transfer = new DataTransfer();
        transfer.items.add(file);
        promptImageInput.files = transfer.files;
        promptImageInput.classList.add("active");
        setPreviewFromFile(file);
    });

    document.getElementById("use_random_seed").addEventListener("change", (event) => {
        document.getElementById("seed").disabled = event.target.checked;
    });

    document.getElementById("apply_refiner").addEventListener("change", (event) => {
        const enabled = event.target.checked;
        document.getElementById("num_inference_steps_refiner").disabled = !enabled;
        document.getElementById("guidance_scale_refiner").disabled = !enabled;
    });

    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        const label = checkbox.previousElementSibling;
        checkbox.addEventListener("change", () => label.classList.toggle("active", checkbox.checked));
        label.classList.toggle("active", checkbox.checked);
    });

    return {
        getPromptImageInput: () => promptImageInput,
        resetPromptImage,
        toggleForm
    };
}
