export class GenerationSession {
    #objectUrls = new Set();
    #clients = new Set();
    #controller = new AbortController();

    get signal() {
        return this.#controller.signal;
    }

    trackObjectUrl(url) {
        if (url?.startsWith("blob:")) {
            this.#objectUrls.add(url);
        }
        return url;
    }

    registerClient(client) {
        this.#clients.add(client);
    }

    cancel() {
        this.#controller.abort();
        for (const client of this.#clients) {
            client.close?.();
        }
    }

    cleanup() {
        for (const url of this.#objectUrls) {
            URL.revokeObjectURL(url);
        }
        this.#objectUrls.clear();
        for (const client of this.#clients) {
            client.close?.();
        }
        this.#clients.clear();
    }
}

function parseFormNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function collectFormData(form) {
    const data = Object.fromEntries(new FormData(form).entries());

    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        data[checkbox.name] = checkbox.checked;
    });

    form.querySelectorAll('input[type="number"]:disabled').forEach((input) => {
        delete data[input.name];
    });

    return data;
}

export function buildGenerationParams(formData) {
    const width = parseFormNumber(formData.width, 1024);
    const height = parseFormNumber(formData.height, 1024);
    const sampleSteps = parseFormNumber(formData.sample_steps, 75);

    if (![width, height, sampleSteps].every(Number.isFinite)) {
        throw new Error("Numeric parameters must be valid numbers");
    }

    const prompt = formData.additional_prompt
        ? `${formData.prompt}, ${formData.additional_prompt}`
        : formData.prompt;

    return {
        prompt,
        negativePrompt: formData.negative_prompt ?? "",
        useNegativePrompt: Boolean(formData.negative_prompt),
        sampleSteps,
        seed: formData.use_random_seed
            ? Math.floor(Math.random() * 1_000_000)
            : parseFormNumber(formData.seed, 0),
        width,
        height,
        guidanceScaleBase: parseFormNumber(formData.guidance_scale_base, 5),
        guidanceScaleRefiner: formData.apply_refiner
            ? parseFormNumber(formData.guidance_scale_refiner, 5)
            : undefined,
        numInferenceStepsBase: parseFormNumber(formData.num_inference_steps_base, 25),
        numInferenceStepsRefiner: formData.apply_refiner
            ? parseFormNumber(formData.num_inference_steps_refiner, 25)
            : undefined,
        applyRefiner: Boolean(formData.apply_refiner),
        apiKey: formData.hf_api_key || undefined,
        imageSampler: formData.image_sampler,
        meshBuilder: formData.mesh_builder
    };
}
