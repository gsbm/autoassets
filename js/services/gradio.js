import { Client, handle_file } from "@gradio/client";
import { spaces } from "../config/spaces.js";
import { addFormEvent } from "../ui/status.js";

export function resolveMediaUrl(value) {
    if (!value) {
        return null;
    }
    if (typeof value === "string" && value.startsWith("http")) {
        return value;
    }
    if (typeof value === "object" && value.url) {
        return value.url;
    }
    if (typeof value === "string") {
        const match = value.match(/href=["'](https?:\/\/[^"']+)["']/);
        return match ? match[1] : null;
    }
    return null;
}

export async function fetchBlob(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${url}`);
    }
    return response.blob();
}

async function connectSpace(model, apiKey, session) {
    const client = await Client.connect(spaces[model].api, {
        token: apiKey || undefined,
        events: ["status", "data"]
    });
    session?.registerClient(client);
    return client;
}

function streamStatus(status, step = 1, maxStep = 1) {
    const icons = { complete: "✔", error: "✖" };
    const endpoint = status.endpoint ?? "job";
    const stage = status.stage ?? status.status ?? "pending";
    const eta = status.eta ? ` (eta ${status.eta})` : "";
    const label = `Job status ${step}/${maxStep}: ${endpoint} > ${stage} ${icons[stage] || ""}${eta}`;

    console.log(label);
    addFormEvent(label);

    if (stage === "error") {
        const message = typeof status.message === "string"
            ? status.message
            : Array.isArray(status.message)
                ? status.message.map((entry) => entry.msg ?? entry.message ?? entry).join(", ")
                : "Generation failed";
        throw new Error(message);
    }
}

export async function runSubmission(submission, { step = 1, maxStep = 1, extractResult, signal } = {}) {
    for await (const message of submission) {
        if (signal?.aborted) {
            submission.cancel?.();
            throw new DOMException("Generation cancelled", "AbortError");
        }
        if (message.type === "status") {
            streamStatus(message, step, maxStep);
        }
        if (message.type === "data") {
            return extractResult ? extractResult(message) : message;
        }
    }
    throw new Error("Job ended without returning data");
}

const defaultExtract = (message) => resolveMediaUrl(message.data[0]);

const imageModels = {
    sdxl: {
        endpoint: "/predict",
        buildPayload: (p) => ({
            prompt: p.prompt,
            negative_prompt: p.negativePrompt,
            prompt_2: "",
            negative_prompt_2: "",
            use_negative_prompt: p.useNegativePrompt,
            use_prompt_2: false,
            use_negative_prompt_2: false,
            seed: p.seed,
            width: p.width,
            height: p.height,
            guidance_scale_base: p.guidanceScaleBase,
            guidance_scale_refiner: p.guidanceScaleRefiner,
            num_inference_steps_base: p.numInferenceStepsBase,
            num_inference_steps_refiner: p.numInferenceStepsRefiner,
            apply_refiner: p.applyRefiner
        })
    },
    sd3m: {
        endpoint: "/infer",
        buildPayload: (p) => ({
            prompt: p.prompt,
            negative_prompt: p.negativePrompt,
            seed: p.seed,
            randomize_seed: false,
            width: p.width,
            height: p.height,
            guidance_scale: p.guidanceScaleBase,
            num_inference_steps: p.numInferenceStepsBase
        })
    },
    flux1: {
        endpoint: "/infer",
        buildPayload: (p) => ({
            prompt: p.prompt,
            seed: p.seed,
            randomize_seed: false,
            width: p.width,
            height: p.height,
            num_inference_steps: p.numInferenceStepsBase
        })
    },
    flux2: {
        endpoint: "/generate",
        buildPayload: (p) => ({
            prompt: p.prompt,
            input_images: [],
            mode_choice: "Distilled (4 steps)",
            seed: p.seed,
            randomize_seed: false,
            width: p.width,
            height: p.height,
            num_inference_steps: 4,
            guidance_scale: 1,
            prompt_upsampling: false
        })
    },
    qwen: {
        endpoint: "/infer",
        buildPayload: (p) => ({
            prompt: p.prompt,
            seed: p.seed,
            randomize_seed: false,
            aspect_ratio: "1:1",
            guidance_scale: p.guidanceScaleBase,
            num_inference_steps: p.numInferenceStepsBase,
            prompt_enhance: true
        })
    },
    chroma: {
        endpoint: "/generate_image",
        buildPayload: (p) => ({
            prompt: p.prompt,
            negative_prompt: p.negativePrompt,
            width: p.width,
            height: p.height,
            steps: p.numInferenceStepsBase,
            cfg: p.guidanceScaleBase,
            seed: p.seed
        })
    },
    blip3o: {
        endpoint: "/run_generate_image_tab",
        buildPayload: (p) => ({
            prompt: p.prompt,
            seed: p.seed,
            guidance: p.guidanceScaleBase,
            num_images: 1
        }),
        extract: (message) => message.data[0].value[0].image.url
    }
};

function logRunning(model) {
    console.log("Running:", spaces[model].api);
    addFormEvent(`Running: ${spaces[model].api}`);
}

export async function generateImage(params, session) {
    const { model, apiKey } = params;
    const config = imageModels[model];
    if (!config) {
        throw new Error("Unknown or unsupported image model");
    }

    const client = await connectSpace(model, apiKey, session);
    logRunning(model);

    return runSubmission(client.submit(config.endpoint, config.buildPayload(params)), {
        extractResult: config.extract ?? defaultExtract,
        signal: session?.signal
    });
}

async function resolveImageInput(imageSource) {
    if (imageSource instanceof Blob) {
        return imageSource;
    }
    return fetchBlob(imageSource);
}

export async function generateMesh(params, session) {
    const {
        model,
        apiKey,
        imageSource,
        sampleSteps,
        seed,
        guidanceScaleBase,
        numInferenceStepsBase,
        size
    } = params;

    const space = spaces[model];
    if (!space || space.type !== "mesh_builder") {
        throw new Error("Unknown or unsupported mesh model");
    }

    const client = await connectSpace(model, apiKey, session);
    logRunning(model);

    const imageBlob = await resolveImageInput(imageSource);
    const signal = session?.signal;
    let meshUrl;

    if (model === "instantmesh") {
        const preprocessResult = await runSubmission(
            client.submit("/preprocess", [handle_file(imageBlob), true]),
            { step: 1, maxStep: space.steps, signal }
        );
        const processedImageBlob = await fetchBlob(preprocessResult.data[0].url);
        await runSubmission(
            client.submit("/generate_mvs", [handle_file(processedImageBlob), sampleSteps, seed]),
            { step: 2, maxStep: space.steps, signal }
        );
        meshUrl = await runSubmission(client.submit("/make3d", []), {
            step: 3,
            maxStep: space.steps,
            extractResult: (message) => resolveMediaUrl(message.data[1]),
            signal
        });
    } else if (model === "trellis") {
        const preprocessResult = await runSubmission(
            client.submit("/preprocess_image", [handle_file(imageBlob)]),
            { step: 1, maxStep: space.steps, signal }
        );
        const processedImageBlob = await fetchBlob(preprocessResult.data[0].url);
        const result3d = await runSubmission(
            client.submit("/image_to_3d", {
                image: handle_file(processedImageBlob),
                seed,
                ss_guidance_strength: Math.min(guidanceScaleBase, 50),
                ss_sampling_steps: Math.min(sampleSteps, 10),
                slat_guidance_strength: Math.min(guidanceScaleBase, 50),
                slat_sampling_steps: Math.min(numInferenceStepsBase, 10)
            }),
            { step: 2, maxStep: space.steps, signal }
        );
        const stateFileBlob = await fetchBlob(result3d.data[0].url);
        meshUrl = await runSubmission(
            client.submit("/extract_glb", {
                state_path: handle_file(stateFileBlob),
                mesh_simplify: 0.95,
                texture_size: size
            }),
            {
                step: 3,
                maxStep: space.steps,
                extractResult: (message) => resolveMediaUrl(message.data[0]),
                signal
            }
        );
    } else if (model === "trellis2") {
        const resolution = size >= 1536 ? "1536" : size >= 1024 ? "1024" : "512";
        const result3d = await runSubmission(
            client.submit("/image_to_3d", {
                image: handle_file(imageBlob),
                seed,
                resolution,
                ss_guidance_strength: 7.5,
                ss_guidance_rescale: 0.7,
                ss_sampling_steps: 12,
                ss_rescale_t: 5,
                shape_slat_guidance_strength: 7.5,
                shape_slat_guidance_rescale: 0.5,
                shape_slat_sampling_steps: 12,
                shape_slat_rescale_t: 3,
                tex_slat_guidance_strength: 1,
                tex_slat_guidance_rescale: 0,
                tex_slat_sampling_steps: 12,
                tex_slat_rescale_t: 3
            }),
            { step: 1, maxStep: space.steps, signal }
        );
        meshUrl = resolveMediaUrl(result3d.data[0]);
        if (!meshUrl) {
            throw new Error("TRELLIS.2 did not return a mesh URL");
        }
    }

    return {
        url: meshUrl,
        blob: await fetchBlob(meshUrl)
    };
}
