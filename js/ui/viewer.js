export function initViewer({ formContainer, topActions, formSettingsContainer, toggleForm }) {
    const viewerContent = document.querySelector(".viewer-content");

    ["mousedown", "touchstart"].forEach((eventName) => {
        viewerContent.addEventListener(eventName, () => {
            formContainer.classList.add("blur");
            topActions.classList.add("blur");
            if (formSettingsContainer.classList.contains("active")) {
                toggleForm();
            }
        });
    });

    ["mouseup", "touchend"].forEach((eventName) => {
        viewerContent.addEventListener(eventName, () => {
            formContainer.classList.remove("blur");
            topActions.classList.remove("blur");
        });
    });

    return viewerContent;
}

export function bindDownloadButton(blob, meshObjectUrl) {
    const weight = (blob.size / 1024 / 1024).toFixed(2);
    const downloadButton = document.getElementById("download-button");
    const nextButton = downloadButton.cloneNode(true);

    nextButton.hidden = false;
    nextButton.querySelector("span").textContent = `Download (${weight} MB)`;
    nextButton.addEventListener("click", () => {
        const timestamp = new Date().toISOString()
            .replace(/[-:.]/g, "")
            .replace("T", "_")
            .slice(0, -5);
        const anchor = document.createElement("a");
        anchor.href = meshObjectUrl;
        anchor.download = `${timestamp}.glb`;
        anchor.click();
        anchor.remove();
    });

    downloadButton.replaceWith(nextButton);
}
