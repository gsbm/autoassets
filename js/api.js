import { Client, handle_file } from "@gradio/client";
import { listSpaces } from "@huggingface/hub";


/****************************************************************************************
Spaces configuration
****************************************************************************************/
const spaces = {
    sd3m: {
        label: "Stable Diffusion 3 Medium",
        api: "stabilityai/stable-diffusion-3-medium",
        url: "https://huggingface.co/spaces/stabilityai/stable-diffusion-3-medium",
        type: "image_sampler",
        steps: 1
    },
    sdxl: {
        label: "Stable Diffusion XL",
        api: "hysts/SDXL",
        url: "https://huggingface.co/spaces/hysts/SDXL",
        type: "image_sampler",
        steps: 1
    },
    flux1: {
        label: "FLUX.1-schnell",
        api: "black-forest-labs/FLUX.1-schnell",
        url: "https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell",
        type: "image_sampler",
        steps: 1
    },
    flux2: {
        label: "FLUX.2-klein",
        api: "black-forest-labs/FLUX.2-klein-9B",
        url: "https://huggingface.co/spaces/black-forest-labs/FLUX.2-klein-9B",
        type: "image_sampler",
        steps: 1
    },
    qwen: {
        label: "Qwen Image",
        api: "Qwen/Qwen-Image",
        url: "https://huggingface.co/spaces/Qwen/Qwen-Image",
        type: "image_sampler",
        steps: 1
    },
    chroma: {
        label: "Chroma",
        api: "gokaygokay/Chroma",
        url: "https://huggingface.co/spaces/gokaygokay/Chroma",
        type: "image_sampler",
        steps: 1
    },
    blip3o: {
        label: "BLIP3-o",
        api: "BLIP3o/blip-3o",
        url: "https://huggingface.co/spaces/BLIP3o/blip-3o",
        type: "image_sampler",
        steps: 1
    },
    instantmesh: {
        label: "InstantMesh",
        api: "TencentARC/InstantMesh",
        url: "https://huggingface.co/spaces/TencentARC/InstantMesh",
        type: "mesh_builder",
        steps: 3
    },
    trellis: {
        label: "TRELLIS",
        api: "hysts-mcp/TRELLIS",
        url: "https://huggingface.co/spaces/hysts-mcp/TRELLIS",
        type: "mesh_builder",
        steps: 3
    },
    trellis2: {
        label: "TRELLIS.2",
        api: "microsoft/TRELLIS.2",
        url: "https://huggingface.co/spaces/microsoft/TRELLIS.2",
        type: "mesh_builder",
        steps: 1
    }
};


/****************************************************************************************
Shared helpers
****************************************************************************************/
function resolveMediaUrl(value) {
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

async function connectSpace(model, api_key) {
    return Client.connect(spaces[model].api, {
        token: api_key || undefined,
        events: ["status", "data"]
    });
}

async function runSubmission(submission, { step = 1, maxStep = 1, extractResult }) {
    for await (const message of submission) {
        if (message.type === "status") {
            streamStatus(message, step, maxStep);
        }
        if (message.type === "data") {
            return extractResult ? extractResult(message) : message;
        }
    }
}

async function fetchBlob(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${url}`);
    }
    return response.blob();
}


/****************************************************************************************
Stream status of jobs
****************************************************************************************/
function streamStatus(status, step = 1, max_step = 1) {
    const icons = {
        complete: "✔",
        error: "✖",
    };

    const endpoint = status.endpoint ?? "job";
    const stage = status.stage ?? status.status ?? "pending";
    const eta = status.eta ? ` (eta ${status.eta})` : "";
    const label = `Job status ${step}/${max_step}: ${endpoint} > ${stage} ${icons[stage] || ""}${eta}`;

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


/****************************************************************************************
Get space runtime
****************************************************************************************/
async function getSpaceRuntime(space_id) {
    const [owner, name] = space_id.split("/");

    for await (const space of listSpaces({
        additionalFields: ["runtime"],
        search: { owner, query: name }
    })) {
        if (space.name === space_id) {
            return space.runtime ?? null;
        }
    }

    return null;
}


/****************************************************************************************
Get spaces availability
****************************************************************************************/
export async function getSpacesAvailability() {
    return Promise.all(
        Object.entries(spaces).map(async ([key, space]) => {
            const runtime = await getSpaceRuntime(space.api);
            return {
                label: space.label,
                api: space.api,
                url: space.url,
                type: space.type,
                key,
                runtime: runtime == null ? "ERROR" : runtime.stage
            };
        })
    );
}


/****************************************************************************************
Generate image from prompt
****************************************************************************************/
export async function generateImage(
    api_key,
    prompt,
    negative_prompt,
    use_negative_prompt,
    seed,
    width,
    height,
    guidance_scale_base,
    guidance_scale_refiner,
    num_inference_steps_base,
    num_inference_steps_refiner,
    apply_refiner,
    model
) {
    const client = await connectSpace(model, api_key);

    console.log("Running:", spaces[model].api);
    addFormEvent(`Running: ${spaces[model].api}`);

    if (model === "sdxl") {
        return runSubmission(client.submit("/predict", {
            prompt,
            negative_prompt,
            prompt_2: "",
            negative_prompt_2: "",
            use_negative_prompt,
            use_prompt_2: false,
            use_negative_prompt_2: false,
            seed,
            width,
            height,
            guidance_scale_base,
            guidance_scale_refiner,
            num_inference_steps_base,
            num_inference_steps_refiner,
            apply_refiner,
        }), {
            extractResult: (message) => resolveMediaUrl(message.data[0])
        });
    }

    if (model === "sd3m") {
        return runSubmission(client.submit("/infer", {
            prompt,
            negative_prompt,
            seed,
            randomize_seed: false,
            width,
            height,
            guidance_scale: guidance_scale_base,
            num_inference_steps: num_inference_steps_base,
        }), {
            extractResult: (message) => resolveMediaUrl(message.data[0])
        });
    }

    if (model === "flux1") {
        return runSubmission(client.submit("/infer", {
            prompt,
            seed,
            randomize_seed: false,
            width,
            height,
            num_inference_steps: num_inference_steps_base,
        }), {
            extractResult: (message) => resolveMediaUrl(message.data[0])
        });
    }

    if (model === "flux2") {
        return runSubmission(client.submit("/generate", {
            prompt,
            input_images: [],
            mode_choice: "Distilled (4 steps)",
            seed,
            randomize_seed: false,
            width,
            height,
            num_inference_steps: 4,
            guidance_scale: 1,
            prompt_upsampling: false,
        }), {
            extractResult: (message) => resolveMediaUrl(message.data[0])
        });
    }

    if (model === "qwen") {
        return runSubmission(client.submit("/infer", {
            prompt,
            seed,
            randomize_seed: false,
            aspect_ratio: "1:1",
            guidance_scale: guidance_scale_base,
            num_inference_steps: num_inference_steps_base,
            prompt_enhance: true
        }), {
            extractResult: (message) => resolveMediaUrl(message.data[0])
        });
    }

    if (model === "chroma") {
        return runSubmission(client.submit("/generate_image", {
            prompt,
            negative_prompt,
            width,
            height,
            steps: num_inference_steps_base,
            cfg: guidance_scale_base,
            seed
        }), {
            extractResult: (message) => resolveMediaUrl(message.data[0])
        });
    }

    if (model === "blip3o") {
        return runSubmission(client.submit("/run_generate_image_tab", {
            prompt,
            seed,
            guidance: guidance_scale_base,
            num_images: 1,
        }), {
            extractResult: (message) => message.data[0].value[0].image.url
        });
    }

    throw new Error("Unknown or unsupported model");
}


/****************************************************************************************
Generate mesh from image
****************************************************************************************/
export async function generateMesh(
    api_key,
    image_url,
    sample_steps,
    seed,
    model,
    guidance_scale_base,
    num_inference_steps_base,
    size
) {
    const client = await connectSpace(model, api_key);

    console.log("Running:", spaces[model].api);
    addFormEvent(`Running: ${spaces[model].api}`);

    const image_blob = await fetchBlob(image_url);

    if (model === "instantmesh") {
        const preprocess_result = await runSubmission(
            client.submit("/preprocess", [handle_file(image_blob), true]),
            { step: 1, maxStep: spaces[model].steps }
        );

        const processed_image_blob = await fetchBlob(preprocess_result.data[0].url);

        await runSubmission(
            client.submit("/generate_mvs", [
                handle_file(processed_image_blob),
                sample_steps,
                seed,
            ]),
            { step: 2, maxStep: spaces[model].steps }
        );

        return runSubmission(client.submit("/make3d", []), {
            step: 3,
            maxStep: spaces[model].steps,
            extractResult: (message) => resolveMediaUrl(message.data[1])
        });
    }

    if (model === "trellis") {
        const preprocess_result = await runSubmission(
            client.submit("/preprocess_image", [handle_file(image_blob)]),
            { step: 1, maxStep: spaces[model].steps }
        );

        const processed_image_blob = await fetchBlob(preprocess_result.data[0].url);

        const result_3d = await runSubmission(
            client.submit("/image_to_3d", {
                image: handle_file(processed_image_blob),
                seed,
                ss_guidance_strength: guidance_scale_base > 50 ? 50 : guidance_scale_base,
                ss_sampling_steps: sample_steps > 10 ? 10 : sample_steps,
                slat_guidance_strength: guidance_scale_base > 50 ? 50 : guidance_scale_base,
                slat_sampling_steps: num_inference_steps_base > 10 ? 10 : num_inference_steps_base
            }),
            { step: 2, maxStep: spaces[model].steps }
        );

        const state_file_blob = await fetchBlob(result_3d.data[0].url);

        return runSubmission(
            client.submit("/extract_glb", {
                state_path: handle_file(state_file_blob),
                mesh_simplify: 0.95,
                texture_size: size,
            }),
            {
                step: 3,
                maxStep: spaces[model].steps,
                extractResult: (message) => resolveMediaUrl(message.data[0])
            }
        );
    }

    if (model === "trellis2") {
        const resolution = size >= 1536 ? "1536" : size >= 1024 ? "1024" : "512";
        const result_3d = await runSubmission(
            client.submit("/image_to_3d", {
                image: handle_file(image_blob),
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
                tex_slat_rescale_t: 3,
            }),
            { step: 1, maxStep: spaces[model].steps }
        );

        const meshUrl = resolveMediaUrl(result_3d.data[0]);
        if (!meshUrl) {
            throw new Error("TRELLIS.2 did not return a mesh URL");
        }
        return meshUrl;
    }

    throw new Error("Unknown or unsupported model");
}
