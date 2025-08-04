import { getSpacesAvailability, generateImage, generateMesh } from './api.js';


/****************************************************************************************
Language handler
****************************************************************************************/
// const user_language = navigator.language || navigator.userLanguage;
// var language = "en";
// if (user_language.includes("fr")) {
//     language = "fr";
// }


/****************************************************************************************
Update sheme based on user preference
****************************************************************************************/
function updateColorScheme(type) {
    const root = document.querySelector(':root')
    if (type === "light") {
        root.classList.add('light');
    } else {
        root.classList.remove('light');
    }
}
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    updateColorScheme("light");
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    const new_color_scheme = event.matches ? "dark" : "light";
    updateColorScheme(new_color_scheme);
});


/****************************************************************************************
Prompt presets list
****************************************************************************************/
const preset_list = [
    "A contemporary design chair, white, metal legs",
    "A iron axe, fantasy game axe, medieval",
    "A blue vintage car, cartoon, white stripes",
    "A wooden boat, 13th century, medieval",
    "A single 3D low poly orange cat, smiling, cartoon",
    "A green dragon, fantasy, medieval, wings",
    "A grey dolphin playing with a ball, cartoon",
    "A futuristic silver laptop, sleek design",
    "A steampunk wristwatch, bronze gears, leather strap",
    "A glass teapot, minimalist design, wooden handle",
    "A red robotic vacuum cleaner, futuristic, shiny",
    "A rustic wooden lantern, candle inside, vintage",
    "A floating magic wand, glowing, fantasy",
    "A golden treasure chest, pirate style, jewels",
    "A cyberpunk helmet, neon lights, black matte finish",
    "A cute plush teddy bear, brown, bow tie",
    "A crystal ball, mystical, swirling colors inside",
    "A sleek black racing bike, aerodynamic, modern",
    "A magical spellbook, ancient, glowing runes",
    "A bamboo flute, traditional, engraved patterns",
    "A robotic arm, silver, detailed joints",
    "A vintage typewriter, black, with paper",
    "A ceramic coffee mug, blue, with a funny quote",
    "A leather-bound journal, old, with a quill pen",
    "A neon green basketball, glowing, rainbow",
    "A silver spaceship, sleek design, with thrusters",
    "A miniature bonsai tree, detailed, in a ceramic pot",
    "A VR headset, black, with blue accents",
    "A pair of roller skates, retro design, bright colors",
    "A golden pocket watch, intricate details, chain",
    "A vintage camera, black and silver, with a strap",
    "A red electric guitar, glossy finish, rock style",
    "A futuristic drone, black, with blue lights",
    "A traditional samurai sword, detailed hilt, blade",
    "A traditional samurai helmet, red and black, horns",
    "A colorful hot air balloon, floating in the sky",
    "A sleek white yacht, modern design, on the water",
    "A rustic birdhouse, wooden, with a thatched roof",
    "A sci-fi blaster gun, black and red, glowing parts",
    "A marble chess set, black and white, with pieces",
    "A golden crown, detailed, with gemstones",
    "A futuristic jetpack, silver, with thrusters",
    "A magical potion bottle, glowing liquid, cork",
    "A vintage gramophone, brass horn, wooden base",
    "A pair of binoculars, black, with adjustable focus",
    "A golden compass, detailed, with cardinal points",
    "A wooden cuckoo clock, carved details, pendulum",
    "A futuristic ray gun, silver, glowing barrel",
    "A pair of brass candlesticks, ornate design",
    "A wooden rocking horse, traditional, with mane",
    "A silver pocket watch, intricate details, chain",
    "A wooden treasure chest, pirate style, gold coins",
    "A crystal ball, mystical, swirling colors inside",
    "A computer keyboard, black, with glowing keys",
    "A designer handbag, leather, with gold accents",
    "A pair of sunglasses, aviator style, mirrored",
    "A vintage microphone, silver, with stand",
    "A design lamp, modern, with adjustable arm",
    "A design sofa, modern, with cushions",
    "A golden trophy cup, detailed, with base",
    "A gecko lizard, green, detailed scales",
    "A wooden barrel, rustic, with metal bands",
    "A whale shark, underwater, detailed fins",
    "A race car, red, with white stripes",
    "A vintage bicycle, black, with basket",
    "A salmon fish, underwater, detailed scales",
    "A table lamp, modern, with fabric shade",
    "A wooden chair, traditional, with cushion",
    "A wooden table, rustic, with carved legs",
    "A wooden bench, outdoor, with backrest",
    "A wooden wardrobe, vintage, with drawers",
    "A wooden bed, traditional, with headboard",
    "A wooden desk, antique, with drawers",
    "A music box, vintage, with dancing ballerina",
    "A silver teapot, traditional, with handle",
    "A silver spoon, ornate, with engraved pattern",
    "A crystal vase, elegant, with floral design",
    "A iron horseshoe, rustic, with nails",
    "A copper kettle, vintage, with wooden handle",
    "A chocolate cake, delicious, with icing",
    "A strawberry ice cream, refreshing, in a cone",
    "A banana smoothie, healthy, with straw",
    "A pepperoni pizza, tasty, with cheese",
    "A sushi roll, delicious, with wasabi",
    "A cup of coffee, aromatic, with steam",
    "A glass of wine, red, with grapes",
    "A bottle of champagne, sparkling, with cork",
    "A birthday cake, colorful, with candles",
    "A chocolate bar, sweet, with nuts",
    "A bowl of fruit salad, fresh, with kiwi",
    "A plate of spaghetti, delicious, with sauce",
    "A cheeseburger, juicy, with fries",
    "A hot dog, grilled, with mustard",
    "A taco, spicy, with salsa",
    "A plate of sushi, fresh, with soy sauce",
    "A blue cow, cartoon, with dots",
    "A green frog, cartoon, with big eyes",
    "A pink pig, cartoon, with curly tail",
    "A yellow duck, cartoon, with orange beak",
    "A brown horse, cartoon, with saddle",
    "A creepy doll, old, with cracked paint",
    "A scary clown, circus, with red nose",
    "A spooky ghost, floating, with chains",
    "A black cat, Halloween, with glowing eyes",
    "A witch hat, pointed, with buckle",
    "An abandoned truck, rusty, with flat tires",
];


/****************************************************************************************
Root elements
****************************************************************************************/
const form_object = document.getElementById('form-data');

const form_container = document.querySelector('.form-container');
const form_settings_container = document.querySelector('.form-settings-container');
const form_settings_label = document.querySelector('.form-settings-label');

// const form_preset_container = document.querySelector('.form-preset-container');
const form_type_container = document.querySelector('.form-type-container');

const properties_container = document.querySelector('.properties-container');
const informations_container = document.querySelector('.informations-container');

const loader_container = document.querySelector('.loader-container');
const loader_label = document.querySelector('.loader-label');

const status_container = document.querySelector('.status-container');
const status_content = document.querySelector('.status-content');
const status_label = document.querySelector('.status-label');

const viewer_preview = document.querySelector('.viewer-preview');
const viewer_content = document.querySelector('.viewer-content');

let prompt_type = "type-text";


/****************************************************************************************
Form events
****************************************************************************************/
// Form
function toggleForm() {
    form_settings_container.classList.toggle('active');
    form_settings_label.classList.toggle('active');
    // form_type_container.classList.toggle('disabled');
}
form_settings_label.addEventListener('click', toggleForm);
form_settings_label.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        toggleForm();
    };
});
if ('ontouchstart' in document.documentElement) {
    form_settings_label.removeAttribute('tabindex');
}

// Presets
const preset_button = document.getElementById('preset-button');
preset_button.addEventListener('click', () => {
    const prompt = document.getElementById('prompt-text');
    const i = Math.floor(Math.random() * preset_list.length);
    prompt.value = preset_list[i];
});

// Types
function updateType(type) {
    prompt_type = type;
    const active_elements = document.querySelectorAll(`.form-${type}`);
    const elements = document.querySelectorAll('.form-input');
    elements.forEach(element => {
        element.classList.add('type-disabled');
        if (element.tagName === 'INPUT') {
            element.removeAttribute('required');
        }
    });
    active_elements.forEach(element => {
        element.classList.remove('type-disabled');
        if (element.tagName === 'INPUT') {
            element.setAttribute('required', '');
        }
    });
}
const form_type_items = document.querySelectorAll('.type-item');
form_type_items.forEach(item => {
    item.addEventListener('click', () => {
        form_type_items.forEach(item => {
            item.classList.remove('active');
        });
        item.classList.add('active');
        updateType(item.id);
    });
});

// Image input
const prompt_image_label = document.querySelector('label[for="prompt_image"]');
var prompt_image_input = document.getElementById('prompt_image');
prompt_image_input.value = '';
prompt_image_input.files = null;
prompt_image_label.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        prompt_image_label.click();
    };
});
function resetPromptImage() {
    prompt_image_input.remove();
    const input = document.createElement('input');
    input.id = 'prompt_image';
    input.name = 'prompt_image';
    input.type = 'file';
    input.accept = 'image/png, image/gif, image/jpeg';
    input.classList.add('form-input', 'form-type-image');
    input.value = '';
    input.setAttribute('required', '');
    prompt_image_label.before(input);
    prompt_image_input = input;
}
prompt_image_label.addEventListener('click', () => {
    if (prompt_image_input.classList.contains("active")) {
        prompt_image_input.classList.remove("active");
        resetPromptImage();
    } else {
        prompt_image_label.setAttribute('for', 'prompt_image');
        prompt_image_input.removeAttribute('disabled');
        prompt_image_input.click();
        prompt_image_input.addEventListener('change', () => {
            prompt_image_input.classList.add("active");
            const preview = prompt_image_label.querySelector('.input-preview-image');
            const object = URL.createObjectURL(prompt_image_input.files[0]);
            preview.style.backgroundImage = `url(${object})`;
        });
        prompt_image_input.setAttribute('disabled', '')
        prompt_image_label.removeAttribute('for');
        prompt_image_input.removeEventListener('change', () => {});
    }
    prompt_image_input.blur();
    prompt_image_label.blur();
});
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
    document.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});
["dragenter", "dragover"].forEach(event => {
    prompt_image_label.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!prompt_image_input.classList.contains("active")) {
            prompt_image_label.classList.add('dragover');
        }
    });
});
prompt_image_label.addEventListener('dragleave', () => {
    prompt_image_label.classList.remove('dragover');
});
prompt_image_label.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    prompt_image_label.classList.remove('dragover');
    if (!prompt_image_input.classList.contains("active")) {
        prompt_image_input.classList.add("active");
        const preview = prompt_image_label.querySelector('.input-preview-image');
        preview.style.backgroundImage = `url(${URL.createObjectURL(event.dataTransfer.files[0])})`;
        prompt_image_input.files = event.dataTransfer.files;
        prompt_image_input.disabled = true;
    }
});


// Settings
const form_use_random_seed = document.getElementById('use_random_seed');
const form_seed = document.getElementById('seed');
form_use_random_seed.addEventListener('change', () => {
    form_seed.disabled = form_use_random_seed.checked;
});

const form_apply_refiner = document.getElementById('apply_refiner');
const form_num_inference_steps_refiner = document.getElementById('num_inference_steps_refiner');
const form_guidance_scale_refiner = document.getElementById('guidance_scale_refiner');
form_apply_refiner.addEventListener('change', () => {
    form_num_inference_steps_refiner.disabled = !form_apply_refiner.checked;
    form_guidance_scale_refiner.disabled = !form_apply_refiner.checked;
});

const form_checkboxes = document.querySelectorAll('input[type="checkbox"]');
form_checkboxes.forEach(checkbox => {
    const label = checkbox.previousElementSibling;
    checkbox.addEventListener('change', () => {
        label.classList.toggle('active');
    });
    if (checkbox.checked) {
        label.classList.add('active');
    }
});


/****************************************************************************************
Viewer container events
****************************************************************************************/
['mousedown', 'touchstart'].forEach(event => {
    viewer_content.addEventListener(event, () => {
        form_container.classList.add('blur');
        properties_container.classList.add('blur');
        status_container.classList.add('blur');
        if (form_settings_container.classList.contains('active')) {
            toggleForm();
        }
    });
});
['mouseup', 'touchend'].forEach(event => {
    viewer_content.addEventListener(event, () => {
        form_container.classList.remove('blur');
        properties_container.classList.remove('blur');
        status_container.classList.remove('blur');
    });
});


/****************************************************************************************
Status container events
****************************************************************************************/
status_label.addEventListener('mouseenter', () => {
    status_label.classList.add('active');
    status_content.classList.add('active');
});
status_container.addEventListener('mouseleave', () => {
    status_label.classList.remove('active');
    status_content.classList.remove('active');
});


/****************************************************************************************
Submit generation parameters to API
****************************************************************************************/
form_object.addEventListener('submit', async (event) => {
    event.preventDefault();

    function generateRandomSeed() {
        return Math.floor(Math.random() * 1000000);
    }

    // Get form data
    const form_data = new FormData(form_object);
    const data = Object.fromEntries(form_data.entries());

    for (const [key, value] of Object.entries(data)) {
        if (value === "on") {
            data[key] = true;
        } else if (value === "off") {
            data[key] = false;
        }
    }

    // Fix values
    const disabled_checkboxes = form_object.querySelectorAll('input[type="checkbox"]:not(:checked)');
    disabled_checkboxes.forEach(checkbox => {
        data[checkbox.name] = false;
    });

    const disabled_inputs = form_object.querySelectorAll('input[type="number"]:disabled');
    disabled_inputs.forEach(input => {
        data[input.name] = 10;
    });

    // Update display
    // form_preset_container.classList.add('disabled');
    form_type_container.classList.add('disabled');
    // refreshPresets();

    viewer_content.setAttribute('src', '');
    viewer_content.setAttribute('alt', '');
    viewer_content.classList.remove('active');

    properties_container.classList.remove('active');
    informations_container.classList.add('active');

    loader_container.classList.add('active');
    loader_container.classList.remove('static');
    loader_label.classList.add('pulse');

    const generate_button = document.getElementById('generate-button');
    generate_button.classList.add('active');
    generate_button.blur();

    const icon = generate_button.querySelector('.icon');
    icon.classList.remove('icon-sparkles');
    icon.classList.add('icon-loader-circle');

    form_settings_label.blur();
    if (form_settings_container.classList.contains('active')) {
        toggleForm();
    }

    try {
        const prompt = data.additional_prompt !== "" ? data.prompt + ", " + data.additional_prompt : data.prompt;
        const negative_prompt = data.negative_prompt;
        const use_negative_prompt = negative_prompt !== "" ? true : false;
        const sample_steps = parseInt(data.sample_steps);
        const seed_value = data.use_random_seed ? generateRandomSeed() : parseInt(data.seed);
        const width = parseInt(data.width);
        const height = parseInt(data.height);
        const guidance_scale_base = parseFloat(data.guidance_scale_base);
        const guidance_scale_refiner = parseFloat(data.guidance_scale_refiner);
        const num_inference_steps_base = parseInt(data.num_inference_steps_base);
        const num_inference_steps_refiner = parseInt(data.num_inference_steps_refiner);
        const apply_refiner = data.apply_refiner || false;
        const api_key = data.hf_api_key;
        const model_image_sampler = data.image_sampler;
        const model_mesh_builder = data.mesh_builder;

        // Prompt type text: generate image
        if (prompt_type === "type-text") {
            // Update loader
            loader_label.textContent = "Sampling image...";
            generate_button.querySelectorAll('span')[0].textContent = "Generating";

            // Generate image
            var image_url = await generateImage(
                api_key,
                prompt,
                negative_prompt,
                use_negative_prompt,
                seed_value,
                width,
                height,
                guidance_scale_base,
                guidance_scale_refiner,
                num_inference_steps_base,
                num_inference_steps_refiner,
                apply_refiner,
                model_image_sampler
            );
            // console.log("Generated Image URL:", image_url);
        } else
        
        // Prompt type image: load image
        if (prompt_type === "type-image") {
            // HOTFIX: Check if image is valid
            try {
                var image_url = URL.createObjectURL(prompt_image_input.files[0]);
            } catch (error){
                if (error instanceof TypeError) {
                    resetPromptImage();
                    throw new Error("Please select a valid image file");
                }
            }
        }

        // Update viewer
        viewer_preview.classList.add('loading');
        viewer_preview.style.backgroundImage = `url(${image_url})`;

        // Update loader
        loader_label.textContent = "Building mesh...";

        // Generate mesh
        const mesh_url = await generateMesh(
            api_key,
            image_url,
            sample_steps,
            seed_value,
            model_mesh_builder,
            guidance_scale_base,
            num_inference_steps_base,
        );
        // console.log("Generated Mesh:", mesh_url);

        // Store mesh
        const response = await fetch(mesh_url);
        const blob = await response.blob();
        const mesh = URL.createObjectURL(blob);

        // Update viewer
        viewer_content.setAttribute('src', mesh);
        viewer_content.setAttribute('alt', prompt);
        viewer_content.classList.add('active');

        // Create download button
        const weight = (blob.size / 1024 / 1024).toFixed(2);
        const download_button = document.getElementById('download-button');
        const new_download_button = download_button.cloneNode(true);
        download_button.parentNode.replaceChild(new_download_button, download_button);

        new_download_button.querySelectorAll('span')[0].textContent = `Download (${weight} MB)`;
        new_download_button.addEventListener('click', () => {
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '_').slice(0, -5);
            const a = document.createElement('a');
            a.href = mesh;
            a.download = `${timestamp}.glb`;
            a.click();
            a.remove();
        });
        
        // Update display
        loader_container.classList.remove('active');
        properties_container.classList.add('active');
        informations_container.remove('active');

    } catch (error) {
        console.error(error);
        
        // Display error message
        const message = error.message.replace(/['"]+/g, '');
        alert(`An error occurred:\n${message}`);
        // displayToast({
        //     title: "An error occurred",
        //     message: message,
        //     type: "error",
        //     duration: 6000
        // });
        
        // Reset display
        loader_container.classList.add('active');
        loader_container.classList.add('static');

        informations_container.classList.add('active');
        // form_preset_container.classList.remove('disabled');

    } finally {
        // Reset display
        form_type_container.classList.remove('disabled');
        
        loader_label.classList.remove('pulse');
        loader_label.textContent = "Write down a prompt to begin";

        generate_button.classList.remove('active');
        generate_button.querySelectorAll('span')[0].textContent = "Generate 3D Model";

        icon.classList.remove('icon-loader-circle');
        icon.classList.add('icon-sparkles');

        viewer_preview.classList.remove('loading');
        viewer_preview.style.backgroundImage = 'none';
    }
});


/****************************************************************************************
Update the status of spaces on load
****************************************************************************************/
getSpacesAvailability().then((spaces_availability) => {
    const label = document.querySelector('#status-amount');

    while (status_content.firstChild) {
        status_content.removeChild(status_content.firstChild);
    }

    let i = 0;
    for (const space of spaces_availability) {

        const space_label = space.label;
        const space_url = space.url;
        const space_type = space.type;
        const space_key = space.key;
        const space_runtime = space.runtime;
        const space_api = space.api;

        const status_item = document.createElement('div');
        status_item.classList.add('status-item');

        const status_item_link = document.createElement('a');
        status_item_link.href = space_url;
        status_item_link.target = '_blank';
        status_item_link.textContent = space_label;
        status_item.appendChild(status_item_link);

        const status_item_state = document.createElement('span');
        status_item_state.classList.add('status-item-state');

        status_item_state.textContent = space_runtime.replace(/_/g, ' ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        if (space_runtime === "RUNNING") {
            status_label.classList.remove('error');
            status_label.classList.add('success');
            status_item_state.classList.add('success');

            const status_item_state_icon = document.createElement('span');
            status_item_state_icon.classList.add('icon-fan', 'icon');
            status_item_state.appendChild(status_item_state_icon);
            i++;
        } else {
            status_label.classList.remove('success');
            status_label.classList.add('error');
            status_item_state.classList.add('error');
        }

        status_item.appendChild(status_item_state);
        status_content.appendChild(status_item);

        const select = document.getElementById(space_type);
        const option = document.createElement('option');
        option.value = space_key;
        option.textContent = space_runtime === "RUNNING" ? "🟢 " + space_label : "🔴 " + space_label;
        option.title = space_api + " ("+ space_runtime +")";
        select.appendChild(option);
    }

    label.textContent = i + '/' + spaces_availability.length;
});
