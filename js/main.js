import { initSpaceAvailability } from "./services/hub.js";
import { generateImage, generateMesh } from "./services/gradio.js";
import {
    GenerationSession,
    buildGenerationParams,
    collectFormData
} from "./services/generation.js";
import { initForm } from "./ui/form.js";
import { initViewer, bindDownloadButton } from "./ui/viewer.js";
import { resetFormEvents, initColorScheme } from "./ui/status.js";

initColorScheme();

const formObject = document.getElementById("form-data");
const formContainer = document.querySelector(".form-container");
const formSettingsContainer = document.querySelector(".form-settings-container");
const formTypeContainer = document.querySelector(".form-type-container");
const topActions = document.querySelector(".top-actions");
const propertiesContainer = document.querySelector(".properties-container");
const loaderContainer = document.querySelector(".loader-container");
const loaderLabel = document.querySelector(".loader-label");
const viewerPreview = document.querySelector(".viewer-preview");
const generateButton = document.getElementById("generate-button");
const cancelButton = document.getElementById("cancel-button");

let promptType = "type-text";
let isGenerating = false;
let servicesAvailable = false;
let activeSession = null;
let meshObjectUrl = null;

const formApi = initForm({
    onTypeChange: (type) => {
        promptType = type;
    }
});

const viewerContent = initViewer({
    formContainer,
    topActions,
    formSettingsContainer,
    toggleForm: () => formApi.toggleForm()
});

function setGeneratingState(active) {
    const icon = generateButton.querySelector(".icon");
    const label = generateButton.querySelector("span");

    isGenerating = active;
    generateButton.disabled = active || !servicesAvailable;
    generateButton.classList.toggle("active", active);
    cancelButton.hidden = !active;
    formTypeContainer.classList.toggle("disabled", active);

    if (active) {
        icon.classList.replace("icon-sparkles", "icon-loader-circle");
        label.textContent = "Generating";
        return;
    }

    icon.classList.replace("icon-loader-circle", "icon-sparkles");
    label.textContent = "Generate 3D Model";
}

function clearPreview() {
    viewerPreview.classList.remove("loading");
    viewerPreview.style.backgroundImage = "none";
}

function clearMesh() {
    if (meshObjectUrl) {
        URL.revokeObjectURL(meshObjectUrl);
        meshObjectUrl = null;
    }
    viewerContent.removeAttribute("src");
    viewerContent.removeAttribute("alt");
    viewerContent.classList.remove("active");
}

function resetLoader() {
    loaderLabel.classList.remove("pulse");
    loaderLabel.textContent = "Write down a prompt to begin";
}

cancelButton.addEventListener("click", () => {
    activeSession?.cancel();
});

formObject.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isGenerating) {
        return;
    }

    const session = new GenerationSession();
    activeSession = session;

    resetFormEvents();
    setGeneratingState(true);
    clearMesh();
    propertiesContainer.classList.remove("active");

    loaderContainer.classList.add("active");
    loaderContainer.classList.remove("static");
    loaderLabel.classList.add("pulse");

    if (formSettingsContainer.classList.contains("active")) {
        formApi.toggleForm();
    }

    try {
        const params = buildGenerationParams(collectFormData(formObject));
        let imageSource;

        if (promptType === "type-text") {
            loaderLabel.textContent = "Sampling image…";
            imageSource = await generateImage({
                model: params.imageSampler,
                apiKey: params.apiKey,
                prompt: params.prompt,
                negativePrompt: params.negativePrompt,
                useNegativePrompt: params.useNegativePrompt,
                seed: params.seed,
                width: params.width,
                height: params.height,
                guidanceScaleBase: params.guidanceScaleBase,
                guidanceScaleRefiner: params.guidanceScaleRefiner,
                numInferenceStepsBase: params.numInferenceStepsBase,
                numInferenceStepsRefiner: params.numInferenceStepsRefiner,
                applyRefiner: params.applyRefiner
            }, session);
        } else {
            const file = formApi.getPromptImageInput().files?.[0];
            if (!file) {
                formApi.resetPromptImage();
                throw new Error("Please select a valid image file");
            }
            imageSource = session.trackObjectUrl(URL.createObjectURL(file));
        }

        viewerPreview.classList.add("loading");
        viewerPreview.style.backgroundImage = `url(${imageSource})`;

        loaderLabel.textContent = "Building mesh…";
        const { blob: meshBlob } = await generateMesh({
            model: params.meshBuilder,
            apiKey: params.apiKey,
            imageSource,
            sampleSteps: params.sampleSteps,
            seed: params.seed,
            guidanceScaleBase: params.guidanceScaleBase,
            numInferenceStepsBase: params.numInferenceStepsBase,
            size: Math.max(params.width, params.height)
        }, session);

        meshObjectUrl = URL.createObjectURL(meshBlob);
        viewerContent.setAttribute("src", meshObjectUrl);
        viewerContent.setAttribute("alt", params.prompt);
        viewerContent.classList.add("active");

        bindDownloadButton(meshBlob, meshObjectUrl);

        loaderContainer.classList.remove("active");
        propertiesContainer.classList.add("active");
    } catch (error) {
        loaderContainer.classList.add("active", "static");
        if (error.name === "AbortError") {
            alert("Generation cancelled.\nThe current job was stopped.");
        } else {
            console.error(error);
            alert(`An error occurred:\n${error.message.replace(/['"]+/g, "")}`);
        }
    } finally {
        session.cleanup();
        activeSession = null;
        setGeneratingState(false);
        resetLoader();
        clearPreview();
        resetFormEvents();
    }
});

initSpaceAvailability().then((canGenerate) => {
    servicesAvailable = canGenerate;
    if (!isGenerating) {
        generateButton.disabled = !canGenerate;
    }
});
