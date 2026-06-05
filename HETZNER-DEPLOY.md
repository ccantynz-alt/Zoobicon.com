# Self-hosted Llama on Hetzner — Deployment Recipe

> **Spec target: KILLER-MOVES-BUILDER.md #B25** — own the compute so
> marginal API cost goes to $0 beyond fixed infrastructure spend.
>
> **When to deploy:** When the monthly Anthropic + OpenAI + Gemini
> bill crosses ~$5,000/month. Below that, the per-token economics
> still favour the public clouds. Above that, owning the hardware
> wins decisively.

---

## What you get

| Resource | Size | Purpose |
|---|---|---|
| Hetzner GEX44 (or successor) × 2 | 2 × NVIDIA H100 80GB | LLM inference nodes |
| Hetzner Cloud Load Balancer | 1 | Round-robin across the nodes |
| vLLM 0.6+ | Container | Serves Llama 3.3 70B on each node |
| Llama 3.3 70B Instruct (Meta) | model weights | The inference model |

**Throughput per node:** ~40 RPS sustained Llama 3.3 70B (8-bit quantised), ~80 RPS across the cluster.
**Cost:** ~€2,800/month for 2 × GEX44. Plus ~€50/month for LB + bandwidth ≈ €2,900/month (~$3,100 USD).

**Compared to Anthropic at Tier 4:**
- Anthropic: $0.80 per million input tokens (Haiku) or $3.00 (Sonnet)
- Self-hosted: $0 per token; ~$3,100/month fixed
- Crossover: at ~3.9M input tokens/day on Haiku, or ~1M on Sonnet
- At Zoobicon's expected 1M builds/day with ~2k tokens each = 2B tokens/day — vastly beyond crossover

---

## Prerequisites

1. **Hetzner Cloud account** with billing enabled. Apply for GPU server access (currently waitlist-gated for H100).
2. **Hugging Face account** with accepted Llama 3.3 license (model is gated).
3. **Domain** for the inference endpoint — e.g. `llm.zoobicon.io` pointing at the load balancer.
4. **TLS** — Hetzner LB supports Let's Encrypt-issued certs natively. Set up in Hetzner Console.

---

## Step 1 — Provision the nodes

```bash
# Using Hetzner Cloud CLI (hcloud)
hcloud server create \
  --name zoo-llm-1 \
  --type gex44 \
  --image ubuntu-24.04 \
  --location fsn1 \
  --ssh-key your-key-name

hcloud server create \
  --name zoo-llm-2 \
  --type gex44 \
  --image ubuntu-24.04 \
  --location fsn1 \
  --ssh-key your-key-name
```

Wait for both to come up. Verify with `hcloud server list`.

---

## Step 2 — Install NVIDIA drivers + Docker

On each node:

```bash
# CUDA + NVIDIA driver
curl -fsSL https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2404/x86_64/cuda-keyring_1.1-1_all.deb -o cuda-keyring.deb
sudo dpkg -i cuda-keyring.deb
sudo apt-get update
sudo apt-get install -y cuda-toolkit-12-4 nvidia-driver-555
sudo reboot

# Docker + NVIDIA container toolkit
curl -fsSL https://get.docker.com | sh
distribution=$(. /etc/os-release; echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

---

## Step 3 — Pull the model

```bash
# Log in to Hugging Face (one-time)
docker run --rm -it -v hf-cache:/root/.cache/huggingface \
  ghcr.io/huggingface/text-generation-inference:latest \
  huggingface-cli login

# Download Llama 3.3 70B Instruct
docker run --rm -it -v hf-cache:/root/.cache/huggingface \
  ghcr.io/huggingface/text-generation-inference:latest \
  huggingface-cli download meta-llama/Llama-3.3-70B-Instruct
```

---

## Step 4 — Serve via vLLM (OpenAI-compatible API)

Create `/etc/systemd/system/vllm.service` on each node:

```ini
[Unit]
Description=vLLM Llama 3.3 70B server
After=docker.service
Requires=docker.service

[Service]
Restart=always
ExecStartPre=-/usr/bin/docker stop vllm
ExecStartPre=-/usr/bin/docker rm vllm
ExecStart=/usr/bin/docker run \
  --rm --name vllm \
  --gpus all \
  -p 8000:8000 \
  -v hf-cache:/root/.cache/huggingface \
  -e VLLM_API_KEY=${VLLM_API_KEY} \
  vllm/vllm-openai:latest \
  --model meta-llama/Llama-3.3-70B-Instruct \
  --quantization fp8 \
  --max-model-len 8192 \
  --api-key ${VLLM_API_KEY}

[Install]
WantedBy=multi-user.target
```

Set the shared API key:

```bash
sudo systemctl edit vllm
# Add:
[Service]
Environment=VLLM_API_KEY=zoo-llm-<long-random-secret>
```

Enable + start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable vllm
sudo systemctl start vllm
```

---

## Step 5 — Load balancer

```bash
hcloud load-balancer create \
  --name zoo-llm-lb \
  --type lb11 \
  --location fsn1 \
  --algorithm round_robin

hcloud load-balancer add-target zoo-llm-lb --server zoo-llm-1
hcloud load-balancer add-target zoo-llm-lb --server zoo-llm-2

hcloud load-balancer add-service zoo-llm-lb \
  --protocol https \
  --listen-port 443 \
  --destination-port 8000 \
  --health-check-protocol http \
  --health-check-path /health \
  --add-http-redirect

# Point DNS llm.zoobicon.io at the LB's IPv4 address
hcloud load-balancer describe zoo-llm-lb | grep IPv4
```

---

## Step 6 — Wire into Zoobicon

In Vercel env vars:

```
SELFHOSTED_LLM_URL=https://llm.zoobicon.io
SELFHOSTED_LLM_KEY=zoo-llm-<same-secret-as-vllm>
```

That's it. The next deploy picks up the env vars, `getAvailableProviders()` adds `"selfhosted"` to the list, and the api-bank picker starts routing traffic to the cluster.

Use `model: "zoo-llama-3.3-70b"` (or `zoo-llama-70b`) in requests to explicitly route to self-hosted. Otherwise the api-bank picker chooses based on capacity headroom — when Anthropic + OpenAI + Gemini are healthy and have headroom, they're preferred for premium-class slots; self-hosted absorbs mechanical-class + spillover.

---

## Cost crossover model

| Build volume / day | Anthropic Tier 4 cost | Hetzner self-hosted | Winner |
|---|---|---|---|
| 1,000 builds | ~$40/mo | ~$3,100/mo | Anthropic by far |
| 10,000 builds | ~$400/mo | ~$3,100/mo | Anthropic |
| 100,000 builds | ~$4,000/mo | ~$3,100/mo | **Hetzner ↑** |
| 1,000,000 builds | ~$40,000/mo | ~$3,100/mo + capacity expansion | **Hetzner by 10×** |
| 10,000,000 builds | ~$400,000/mo | ~$15,000/mo (5× nodes) | **Hetzner by 25×** |

At 1M builds/day the platform saves ~$37,000/month switching to self-hosted. At 10M/day it saves ~$385,000/month. Every additional GEX44 added to the cluster scales linearly with negligible per-token cost.

---

## Quality vs cost trade-off

Llama 3.3 70B scores ~5.5/10 on our slot-fill quality benchmark (vs Claude Haiku 7.5/10). Per the B21b quality-aware routing (`src/lib/api-bank-quality.ts`):

- **Premium-class slots** (headlines, hero copy): stay on Claude even at heavy load. Self-hosted Llama only used here when Claude + GPT are exhausted AND wait would exceed 8 seconds.
- **Acceptable slots** (section descriptions, CTA labels): Claude preferred, but Llama tolerated when Claude is over budget.
- **Mechanical slots** (URLs, booleans, icon names, enum choices): any provider including Llama is fine — quality difference is negligible.

A typical build has ~12 premium / 30 acceptable / 20 mechanical slots = 62 total. With the quality router, self-hosted Llama handles the 20 mechanical slots from day one (saving ~30% of the per-build LLM cost) and absorbs spillover for the other 42 only when needed.

---

## Operational checklist

- [ ] Hetzner GPU access approved
- [ ] 2× GEX44 provisioned at `fsn1` (Falkenstein)
- [ ] NVIDIA drivers + Docker + nvidia-container-toolkit installed
- [ ] Llama 3.3 70B Instruct downloaded to `hf-cache` volume
- [ ] vLLM running on port 8000, accessible from Hetzner LB
- [ ] LB DNS pointing at `llm.zoobicon.io`
- [ ] Let's Encrypt TLS cert active on LB
- [ ] `SELFHOSTED_LLM_URL` + `SELFHOSTED_LLM_KEY` set in Vercel
- [ ] Health-check endpoint (`/health`) returning 200 on both nodes
- [ ] Telemetry: `/admin/builds` shows `selfhosted` as an active provider in the API capacity strip
- [ ] First builds routed via `zoo-llama-3.3-70b` model id end-to-end

---

## Maintenance

- **Model updates** — when Meta ships Llama 3.4 or a successor, download the new weights to `hf-cache`, restart vllm. Zero downtime per node when rolling.
- **Scaling out** — add a 3rd / 4th node + register with LB. Linear capacity, no Zoobicon code change.
- **Monitoring** — vLLM exposes Prometheus metrics on `:8000/metrics`. Scrape into Grafana or push to Hetzner Cloud Metrics.
