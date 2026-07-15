import { listSpaces } from "@huggingface/hub";
import { spaces, RUNTIME_LABELS, getSpaceList } from "../config/spaces.js";

const CACHE_KEY = "autoassets:space-runtime";
const CACHE_TTL_MS = 3 * 60 * 1000;

function readCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
            sessionStorage.removeItem(CACHE_KEY);
            return null;
        }
        return parsed.runtimes;
    } catch {
        return null;
    }
}

function writeCache(runtimes) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            runtimes
        }));
    } catch {
        // Ignore storage quota errors.
    }
}

async function fetchRuntimesByOwner() {
    const owners = [...new Set(Object.values(spaces).map((space) => space.api.split("/")[0]))];
    const runtimes = {};

    await Promise.all(owners.map(async (owner) => {
        for await (const space of listSpaces({
            additionalFields: ["runtime"],
            search: { owner }
        })) {
            runtimes[space.name] = space.runtime?.stage ?? "ERROR";
        }
    }));

    return runtimes;
}

function buildAvailability(runtimes) {
    return Object.entries(spaces).map(([key, space]) => ({
        key,
        label: space.label,
        api: space.api,
        url: space.url,
        type: space.type,
        runtime: runtimes[space.api] ?? "ERROR"
    }));
}

function createOption(space, { withStatus = false } = {}) {
    const option = document.createElement("option");
    option.value = space.key;
    option.title = withStatus ? `${space.api} (${space.runtime})` : space.api;

    if (withStatus) {
        const statusLabel = RUNTIME_LABELS[space.runtime] ?? RUNTIME_LABELS.ERROR;
        option.textContent = `${statusLabel} — ${space.label}`;
        option.disabled = space.runtime !== "RUNNING";
    } else {
        option.textContent = space.label;
    }

    return option;
}

function fillSelect(select, options) {
    select.replaceChildren();
    options.forEach((option) => select.appendChild(option));
    if (select.options.length > 0) {
        select.selectedIndex = 0;
    }
}

function populateSpaceSelects() {
    const selectImageSampler = document.getElementById("image_sampler");
    const selectMeshBuilder = document.getElementById("mesh_builder");
    const buttonGenerate = document.getElementById("generate-button");

    buttonGenerate.disabled = true;
    buttonGenerate.querySelector("span").textContent = "Checking services…";

    const imageOptions = [];
    const meshOptions = [];

    getSpaceList().forEach((space) => {
        const option = createOption(space);
        if (space.type === "image_sampler") {
            imageOptions.push(option);
        } else if (space.type === "mesh_builder") {
            meshOptions.push(option);
        }
    });

    fillSelect(selectImageSampler, imageOptions);
    fillSelect(selectMeshBuilder, meshOptions);
}

function renderSpaceOptions(spacesAvailability) {
    const selectImageSampler = document.getElementById("image_sampler");
    const selectMeshBuilder = document.getElementById("mesh_builder");
    const buttonGenerate = document.getElementById("generate-button");

    const groups = {
        image_sampler: { available: [], unavailable: [] },
        mesh_builder: { available: [], unavailable: [] }
    };

    spacesAvailability.forEach((space) => {
        const option = createOption(space, { withStatus: true });
        const bucket = space.runtime === "RUNNING" ? "available" : "unavailable";
        groups[space.type][bucket].push(option);
    });

    fillSelect(selectImageSampler, [
        ...groups.image_sampler.available,
        ...groups.image_sampler.unavailable
    ]);
    fillSelect(selectMeshBuilder, [
        ...groups.mesh_builder.available,
        ...groups.mesh_builder.unavailable
    ]);

    const canGenerate = groups.image_sampler.available.length > 0
        && groups.mesh_builder.available.length > 0;

    buttonGenerate.disabled = !canGenerate;
    buttonGenerate.querySelector("span").textContent = canGenerate
        ? "Generate 3D Model"
        : "No services available";

    return canGenerate;
}

async function getSpacesAvailability() {
    const cached = readCache();
    if (cached) {
        return buildAvailability(cached);
    }

    const runtimes = await fetchRuntimesByOwner();
    writeCache(runtimes);
    return buildAvailability(runtimes);
}

export async function initSpaceAvailability() {
    populateSpaceSelects();
    try {
        return renderSpaceOptions(await getSpacesAvailability());
    } catch (error) {
        console.error(error);
        alert("Service check failed.\nCould not verify Hugging Face Spaces. You can still try generating.");
        const buttonGenerate = document.getElementById("generate-button");
        buttonGenerate.disabled = false;
        buttonGenerate.querySelector("span").textContent = "Generate 3D Model";
        return false;
    }
}
