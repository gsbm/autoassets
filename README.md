<h1><img src="assets/img/icon.svg" height="28px" style="transform: translateY(6px)"/> Autoassets</h1>

Autoassets is a web application that allows users to quickly generate 3D models from simple textual or visual descriptions using state-of-the-art AI models. The platform integrates with Hugging Face Spaces and leverages models such as Stable Diffusion 3 Medium, Stable Diffusion XL, FLUX.1, and InstantMesh to create high-quality 3D assets from user prompts or images.

## Documentation

### Parameters

Below are all the parameters available in Autoassets, with explanations of what each does:

- **Prompt**: The main textual description of the 3D model you want to generate. Used as the primary input for image generation models.
- **Image Upload**: Allows you to upload a PNG or JPEG image as a visual reference for 3D model generation (used with the "Image" input type).
- **Image Sampler**: Selects the AI model used for image generation (e.g., Stable Diffusion 3 Medium, SDXL, FLUX.1). Determines the style and quality of the generated image.
- **Mesh Builder**: Selects the AI model used for mesh generation (e.g., InstantMesh). Converts generated images into 3D meshes.
- **Additional Prompt**: Extra text to enhance or guide the generation (e.g., "(3D model), (overall view), (white background), studio photo, blender, 3D render, large view, (single object)").
- **Negative Prompt**: Text describing what you do NOT want in the generated model (e.g., "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality").
- **Sample Steps**: Number of steps used in mesh generation (affects detail and quality). Range: 30–75. Higher values may improve quality but take longer.
- **Use Random Seed**: If checked, a random seed is used for generation, making results less predictable. If unchecked, you can specify a seed for reproducible results.
- **Seed**: A number (0–1,000,000) used to initialize the random number generator for reproducible outputs. Only enabled if "Use Random Seed" is unchecked.
- **Width**: Width (in pixels) of the generated image. Range: 256–1024.
- **Height**: Height (in pixels) of the generated image. Range: 256–1024.
- **Guidance Scale**: Controls how closely the output matches the prompt. Higher values make the model follow the prompt more strictly. Range: 1–20.
- **Number of Inference Steps**: Number of steps for the image generation process. Higher values can improve quality but increase generation time. Range: 10–100.
- **Hugging Face Access Token**: (Optional) Your Hugging Face API key. Providing this can increase your GPU request limits for faster or more frequent generations.

Some models (like SDXL) may have additional advanced parameters:

- **Guidance Scale Refiner**: Guidance scale for the refiner stage (SDXL only).
- **Number of Inference Steps Refiner**: Number of inference steps for the refiner stage (SDXL only).
- **Apply Refiner**: Whether to use the refiner stage for improved image quality (SDXL only).



## Legal

### Licenses

Autoassets and its dependencies are licensed as follows:

- **Autoassets**: GPL-3 License (see `LICENSE` file).
- **SDXL**: MIT License.
- **Stable Diffusion 3 Medium**: MIT License.
- **FLUX.1**: MIT License.
- **InstantMesh**: Apache License 2.0.

Users retain ownership of the 3D models they generate, subject to the licenses and terms of use of the generative models provided by Hugging Face, SDXL, and InstantMesh.

### Terms of Service & Privacy

- No user registration or login is required.
- All user data is sent to Hugging Face for processing and may be stored as analytics by them.
- The platform is intended for experimental and educational purposes only.
- Users are responsible for ensuring their use of generated models complies with all relevant licenses and laws.
- For more details, see [Terms of Service](https://gsbm.github.io/autoassets/legal.html).
