import { Client, handle_file } from "@gradio/client";
import { listSpaces } from "@huggingface/hub";


/****************************************************************************************
Spaces configuration
****************************************************************************************/
const spaces = {
    flux1: {
        label: "FLUX.1",
        api: "black-forest-labs/FLUX.1-schnell",
        url: "https://huggingface.co/spaces/black-forest-labs/FLUX.1-schnell",
        type: "image_sampler",
        steps: 1
    },
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
    }
}


/****************************************************************************************
Stream status of jobs
****************************************************************************************/
function streamStatus(status, step = 1, max_step = 1) {
    const icons = {
        complete: "✔",
        error: "✖",
    };

    console.log(`Job status ${step}/${max_step}: ${status.endpoint} > ${status.stage} ${icons[status.stage] || ""}${status.eta ? ` (eta ${status.eta})` : ""}`);

    if (status.stage === "error") {
        throw new Error(status.message);
    }
}


/****************************************************************************************
Get space runtime
****************************************************************************************/
async function getSpaceRuntime(space_id) {
    const payload = {
        additionalFields: ['runtime'],
        search: {
            query: space_id,
        }
    };

    const space_iterator = listSpaces(payload);
    for await (const space of space_iterator) {
        if (space.name === space_id) {
            return JSON.parse(JSON.stringify(space.runtime, null, 2));
        }
    }
}


/****************************************************************************************
Get spaces availability
****************************************************************************************/
export async function getSpacesAvailability() {
    let spaces_availability = [];

    for (const space_id of Object.values(spaces)) {
        let runtime = await getSpaceRuntime(space_id.api);

        spaces_availability.push({
            label: space_id.label,
            api: space_id.api,
            url: space_id.url,
            type: space_id.type,
            key: Object.keys(spaces).find(key => spaces[key] === space_id),
            runtime: runtime.stage
        });
    }

    return spaces_availability;
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
    // Connect to space
    const client = await Client.connect(spaces[model].api, {
        hf_token: api_key,
        events: ["status", "data"]
    });

    console.log("Running:", spaces[model].api);

    if (model === "sdxl") {
        /******************************************
        Job: sdxl
        ******************************************/
        // Generate image
        const generation_job = client.submit("/run", {
            prompt: prompt,
            negative_prompt: negative_prompt,
            prompt_2: "",
            negative_prompt_2: "",
            use_negative_prompt: use_negative_prompt,
            use_prompt_2: false,
            use_negative_prompt_2: false,
            seed: seed,
            width: width,
            height: height,
            guidance_scale_base: guidance_scale_base,
            guidance_scale_refiner: guidance_scale_refiner,
            num_inference_steps_base: num_inference_steps_base,
            num_inference_steps_refiner: num_inference_steps_refiner,
            apply_refiner: apply_refiner,
        });
        for await (const message of generation_job) {
            if (message.type === "status") {
                streamStatus(message);
    
            }
            if (message.type === "data") {
                const {
                    data: [result]
                } = message;
            
                return result.url;
            }
        }
    } else if (model === "sd3m") {
        /******************************************
        Job: sd3m
        ******************************************/
        // Generate image
        const generation_job = client.submit("/infer", {
            prompt: prompt,
            negative_prompt: negative_prompt,
            seed: seed,
            randomize_seed: false,
            width: width,
            height: height,
            guidance_scale: guidance_scale_base,
            num_inference_steps: num_inference_steps_base,
        });
        for await (const message of generation_job) {
            if (message.type === "status") {
                streamStatus(message);
    
            }
            if (message.type === "data") {
                const {
                    data: [result]
                } = message;
            
                return result.url;
            }
        }
    } else if (model === "flux1") {
        /******************************************
        Job: flux1
        ******************************************/
        // Generate image
        const generation_job = client.submit("/infer", {
            prompt: prompt,
            seed: seed,
            randomize_seed: false,
            width: width,
            height: height,
            num_inference_steps: num_inference_steps_base,
        });
        for await (const message of generation_job) {
            if (message.type === "status") {
                streamStatus(message);
            }
            if (message.type === "data") {
                const {
                    data: [result]
                } = message;
            
                return result.url;
            }
        }
    } else {
        throw new Error("Unknown or unsupported model");
    }
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
) {
    // Connect to space
    const client = await Client.connect(spaces[model].api, {
        hf_token: api_key,
        events: ["status", "data"]
    });

    console.log("Running:", spaces[model].api);

    // Fetch image
    const image = await fetch(image_url);
    if (!image.ok) {
        throw new Error("Failed to fetch the reference image");
    }

    // Convert image to blob
    const image_blob = await image.blob();

    if (model === "instantmesh") {
        /******************************************
        Job: instantmesh
        ******************************************/
        // Preprocess image
        const preprocess_job = client.submit("/preprocess", [
            handle_file(image_blob),
            true
        ]);
        for await (const message of preprocess_job) {
            if (message.type === "status") {
                streamStatus(message, 1, spaces[model].steps);
            }
            if (message.type === "data") {
                var result_processed_image = message;
            }
        }

        // Fetch processed image
        const processed_image = await fetch(result_processed_image.data[0].url);
        if (!processed_image.ok) {
            throw new Error("Failed to fetch the processed image");
        }

        // Convert processed image to blob
        const processed_image_blob = await processed_image.blob();

        // Generate MVS
        const generation_job = client.submit("/generate_mvs", [
            handle_file(processed_image_blob),
            sample_steps,
            seed,
        ]);
        for await (const message of generation_job) {
            if (message.type === "status") {
                streamStatus(message, 2, spaces[model].steps);
            }
        }

        // Extrude mesh
        const extrusion_job = client.submit("/make3d", []);
        for await (const message of extrusion_job) {
            if (message.type === "status") {
                streamStatus(message, 3, spaces[model].steps);
            }
            if (message.type === "data") {
                return message.data[1].url;
            }
        }
    } else if (model === "trellis") {
        /******************************************
        Job: trellis
        ******************************************/
        // Preprocess image
        const preprocess_job = client.submit("/preprocess_image", [
            handle_file(image_blob)
        ]);
        let result_processed_image;
        for await (const message of preprocess_job) {
            if (message.type === "status") {
                streamStatus(message, 1, spaces[model].steps);
            }
            if (message.type === "data") {
                result_processed_image = message;
            }
        }

        // Fetch processed image
        const processed_image = await fetch(result_processed_image.data[0].url);
        if (!processed_image.ok) {
            throw new Error("Failed to fetch the processed image");
        }
        const processed_image_blob = await processed_image.blob();

        // Image to 3D
        const image_to_3d_job = client.submit("/image_to_3d", {
            image: handle_file(processed_image_blob),
            seed: seed,
            ss_guidance_strength: guidance_scale_base > 50 ? 50 : guidance_scale_base,
            ss_sampling_steps: sample_steps > 10 ? 10 : sample_steps,
            slat_guidance_strength: guidance_scale_base > 50 ? 50 : guidance_scale_base,
            slat_sampling_steps: num_inference_steps_base > 10 ? 10 : num_inference_steps_base
        });
        let result_3d;
        for await (const message of image_to_3d_job) {
            if (message.type === "status") {
                streamStatus(message, 2, spaces[model].steps);
            }
            if (message.type === "data") {
                result_3d = message;
            }
        }

        // Fetch state path
        const state_file = await fetch(result_3d.data[0].url);
        if (!state_file.ok) {
            throw new Error("Failed to fetch the 3D model state file");
        }
        const state_file_blob = await state_file.blob();

        // Extract GLB
        const extract_glb_job = client.submit("/extract_glb", { 
            state_path: state_file_blob,
            mesh_simplify: 0.95,
            texture_size: 1024,
        });
        for await (const message of extract_glb_job) {
            if (message.type === "status") {
                streamStatus(message, 3, spaces[model].steps);
            }
            if (message.type === "data") {
                return message.data[0].url;
            }
        }
    } else {
        throw new Error("Unknown or unsupported model");
    }
}
