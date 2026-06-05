# Zoobicon Substrate — deployment runbook

The Substrate is our self-hosted LLM fallback: a single GPU box running
vLLM on Hetzner, serving an OpenAI-compatible HTTP API. When Anthropic,
OpenAI and Gemini all 529 or rate-limit, the failover chain in
`src/lib/llm-provider.ts` routes here. It is the safety net that keeps
the builder shipping when the rest of the AI internet is down.

This doc tells you exactly how to spin it up. ~30 minutes end-to-end.

## What you get

- A fixed-cost, per-call-free LLM pool that does not rate-limit us
- Llama 3.3 70B (Claude Sonnet-class quality on structured tasks)
- OpenAI-compatible API (`/v1/chat/completions`, `/v1/models`)
- Throughput: ~30–80 req/sec sustained on a single H100, easily
  enough for our current builder load (and 100× current capacity)
- Cost: ~€2.8/hour on a Hetzner GPU server (H100 80GB) =
  **~$2.2k/month** vs Anthropic Scale-tier negotiated capacity at
  $10–50k/month for comparable headroom

## Step 1 — Order the box

Hetzner dashboard → Dedicated Server → GPU Server line.

Pick `GEX44 — NVIDIA RTX 6000 Ada` (cheaper, fine for 8B) **or**
`GEX130 — NVIDIA H100 80GB` (required for 70B at full precision).

Region: Finland (Helsinki). Latency to Vercel iad1 is ~110ms, which
is fine because we only call the Substrate as a fallback, not a hot
path. If we eventually want to make it the primary, we'd move to
Hetzner Ashburn or replicate to AWS us-east-1.

OS: Ubuntu 24.04 LTS. SSH key from your `~/.ssh/zoobicon_ed25519`.

Once provisioned you get an IPv4 + root login. Save the IP — you'll
need it.

## Step 2 — Base setup

SSH in as root:

```bash
ssh root@<box-ip>

# Update + Docker
apt-get update && apt-get upgrade -y
curl -fsSL https://get.docker.com | sh

# NVIDIA Container Toolkit so Docker can see the GPU
distribution=$(. /etc/os-release; echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | apt-key add -
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
apt-get update && apt-get install -y nvidia-container-toolkit
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# Sanity check the GPU
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
# You should see an H100 (or RTX 6000) listed.
```

## Step 3 — Run vLLM

vLLM is the OpenAI-compatible serving layer. One Docker command:

```bash
# Generate an API key the substrate will require
SUBSTRATE_KEY="sk-zoo-$(openssl rand -hex 24)"
echo "SUBSTRATE_KEY=$SUBSTRATE_KEY"  # save this — you'll paste it into Vercel

# Run vLLM serving Llama 3.3 70B
docker run -d --restart=always \
  --gpus all \
  --name substrate \
  -p 8000:8000 \
  --ipc=host \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  -e HUGGING_FACE_HUB_TOKEN=<your-hf-token> \
  vllm/vllm-openai:latest \
    --model meta-llama/Llama-3.3-70B-Instruct \
    --served-model-name llama-3.3-70b \
    --api-key $SUBSTRATE_KEY \
    --max-model-len 32000 \
    --gpu-memory-utilization 0.92
```

The HuggingFace token is needed to pull the gated Llama-3.3 weights —
get one at huggingface.co/settings/tokens (read-only is fine) and
accept the Llama license on the model page.

The first start takes 10–15 minutes (~140GB download). After that
it's ready in 30 seconds on every restart.

For the smaller 8B model (no H100 needed, runs on RTX 6000):

```bash
docker run -d --restart=always \
  --gpus all \
  --name substrate \
  -p 8000:8000 \
  --ipc=host \
  -v ~/.cache/huggingface:/root/.cache/huggingface \
  vllm/vllm-openai:latest \
    --model meta-llama/Llama-3.1-8B-Instruct \
    --served-model-name llama-3.1-8b \
    --api-key $SUBSTRATE_KEY \
    --max-model-len 8192
```

## Step 4 — Front it with Caddy + TLS

Don't expose port 8000 to the open internet over HTTP. Use Caddy for
automatic Let's Encrypt:

```bash
# 1. Point a DNS A record substrate.zoobicon.io → <box-ip>
#    via Cloudflare → Zone zoobicon.io → DNS → Add record
#    (proxy OFF — we need direct connection for HTTPS to work)

apt-get install -y caddy

cat > /etc/caddy/Caddyfile <<'EOF'
substrate.zoobicon.io {
    reverse_proxy localhost:8000
    encode gzip zstd
    log {
        output file /var/log/caddy/substrate.log
        format json
    }
}
EOF

systemctl restart caddy
```

Caddy auto-provisions the TLS cert on first request.

## Step 5 — Wire into Vercel

In Vercel → zoobicon-com → Environment Variables, add:

```
SELFHOSTED_LLM_URL=https://substrate.zoobicon.io
SELFHOSTED_LLM_KEY=<the SUBSTRATE_KEY you generated>
```

Apply to All Environments. Redeploy.

## Step 6 — Verify

From your laptop:

```bash
# Direct probe — confirms the box is up
curl -s https://substrate.zoobicon.io/v1/models \
  -H "Authorization: Bearer $SUBSTRATE_KEY" | jq

# Should return:
# { "data": [{ "id": "llama-3.3-70b", "object": "model", ... }] }
```

From the admin UI:

```
/admin → System Status → Substrate (will show reachable + latency
once the substrate-health probe is wired into the dashboard tile)
```

Or hit the API directly while signed in as admin:

```bash
curl -s https://zoobicon.com/api/admin/substrate-health \
  -H "x-admin-email: <your ADMIN_EMAIL>"
```

## Step 7 — Failover test

Temporarily unset ANTHROPIC_API_KEY in a Vercel preview branch. Run
a builder request. Watch the Vercel logs:

```
[LLM Failover] claude-opus-4-7 unavailable: provider overloaded
[LLM Failover] Trying gpt-4o (openai)
[LLM Failover] gpt-4o also failed: ...
[LLM Failover] Trying gemini-2.5-pro (gemini)
[LLM Failover] gemini-2.5-pro also failed: ...
[LLM Failover] Trying zoo-llama-3.3-70b (selfhosted)
✅
```

The build completes off the substrate. This is the rainy-day proof.

## Operational notes

- **Logs**: `docker logs substrate -f` for vLLM, `/var/log/caddy/substrate.log` for Caddy
- **Restart vLLM**: `docker restart substrate` (30s downtime)
- **Update model**: stop container, change `--model` flag, restart
- **Monitor GPU**: `nvidia-smi -l 2`
- **Hetzner usually invoices monthly. ~€2.8/hour × 720h ≈ €2,000/mo.**
- If revenue isn't there yet, run the 8B model on a smaller GEX44 (~€500/mo). It's worse at long-form composition but fine as a true emergency fallback that's better than total failure.

## When to consider replacing this

- When revenue justifies Anthropic Scale tier (~$50k MRR) — keep the
  Substrate but make it tertiary
- When DeepSeek / Llama 4 / Qwen 3 ship with materially better quality —
  swap the `--model` flag, no other change needed
- When Crontech delivers their own LLM inference layer — point
  `SELFHOSTED_LLM_URL` at it instead
