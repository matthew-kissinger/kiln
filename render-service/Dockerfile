# kiln-render-service: GLB in, PBR PNG views out. Dawn/WebGPU + three.js headless.
FROM node:24-bookworm-slim

# libglvnd0/libegl1/libgl1/libglx0: B1 finding — the injected NVIDIA Vulkan ICD
# init-fails (NULL vkCreateInstance) without the GLVND dispatch libs, and Dawn
# then silently lands on a software renderer. vulkan-tools kept for debuggability.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvulkan1 vulkan-tools \
    libglvnd0 libegl1 libgl1 libglx0 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# graphics is REQUIRED for Vulkan; utility,compute (the common example value)
# silently yields no ICD and software fallback.
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=graphics,compute,utility
ENV PORT=8000

WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund && npm rebuild webgpu

COPY src/ ./src/

EXPOSE 8000
# Boot asserts a hardware adapter and exits 1 otherwise — a driver regression
# yields a service that will not start, never one that renders on CPU silently.
CMD ["node", "--import", "./src/register-hooks.mjs", "src/server.mjs"]
