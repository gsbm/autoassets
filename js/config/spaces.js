export const spaces = {
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

export const RUNTIME_LABELS = {
    RUNNING: "Running",
    PAUSED: "Paused",
    ERROR: "Unavailable"
};

export function getSpaceList() {
    return Object.entries(spaces).map(([key, space]) => ({
        key,
        ...space
    }));
}
