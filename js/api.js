import { Client, handle_file } from "@gradio/client";
import { listSpaces } from "@huggingface/hub";


/****************************************************************************************
Spaces configuration
****************************************************************************************/
const spaces = {
    sdxl: {
        label: "Stable Diffusion XL",
        api: "hysts/SDXL",
        url: "https://huggingface.co/spaces/hysts/SDXL"
    },
    sd3m: {
        label: "Stable Diffusion 3 Medium",
        api: "stabilityai/stable-diffusion-3-medium",
        url: "https://huggingface.co/spaces/stabilityai/stable-diffusion-3-medium"
    },
    instantmesh: {
        label: "InstantMesh",
        api: "TencentARC/InstantMesh",
        url: "https://huggingface.co/spaces/TencentARC/InstantMesh"
    }
}


/****************************************************************************************
Stream status of jobs
****************************************************************************************/
function streamStatus(status) {
	// console.log(`The current status for this job is: ${JSON.stringify(status, null, 2)}`);
    console.log(`Job status: ${status.endpoint} > ${status.stage}`);

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

    if (model === "sdxl") {
        // Generate image from SDXL space
        var generation_job = client.submit("/run", {
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
    } else if (model === "sd3m") {
        // Generate image from SD3M space
        var generation_job = client.submit("/infer", {
            prompt: prompt,
            negative_prompt: negative_prompt,
            seed: seed,
            randomize_seed: false,
            width: width,
            height: height,
            guidance_scale: guidance_scale_base,
            num_inference_steps: num_inference_steps_base,
        });
    }

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

}


/****************************************************************************************
Generate mesh from image
****************************************************************************************/
export async function generateMesh(
    api_key,
    image_url,
    sample_steps,
    seed
) {
    // Connect to InstantMesh space
    const client = await Client.connect(spaces.instantmesh.api, {
        hf_token: api_key,
        events: ["status", "data"]
    });

    // Fetch image
    const image = await fetch(image_url);
    if (!image.ok) {
        throw new Error("Failed to fetch the generated image");
    }

    // Convert image to blob
    const image_blob = await image.blob();

    // Preprocess image
    const preprocess_job = client.submit("/preprocess", [
        handle_file(image_blob),
        true
    ]);
    for await (const message of preprocess_job) {
        if (message.type === "status") {
            streamStatus(message);
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
            streamStatus(message);
        }
    }

    // Extrude mesh
    const extrusion_job = client.submit("/make3d", []);
    for await (const message of extrusion_job) {
        if (message.type === "status") {
            streamStatus(message);
        }
        if (message.type === "data") {
            return message.data[1].url;
        }
    }
}
