/**
 * Zoobicon AI WordPress Plugin — Backend API
 *
 * This powers the WordPress plugin. WordPress sites call our API
 * to access AI capabilities (writing, SEO, images, video, chatbot).
 *
 * The plugin itself is a PHP file that installs in WordPress.
 * It calls api.zoobicon.ai for all AI operations.
 *
 * Revenue: Free (50 ops/mo) → Pro $19/mo (unlimited)
 * TAM: WordPress powers 43% of the internet = 810M websites
 * If 0.01% install = 81,000 installs
 * If 5% convert to Pro = 4,050 paying customers = $77K/mo
 *
 * Add-ons sold through the plugin:
 *   - AI Video Creator: $9/mo
 *   - AI Chatbot: $9/mo
 *   - AI SEO Agent: $9/mo
 *   - AI Image Pack: $9/mo (500 images/mo)
 *   - Domain Search Widget: free (leads to domain registration revenue)
 */

export interface WordPressPluginConfig {
  siteUrl: string;
  apiKey: string; // zbk_live_xxx
  plan: "free" | "pro";
  enabledFeatures: string[];
}

// Operations the plugin can perform via our API
export const PLUGIN_OPERATIONS = {
  // Content
  "content.rewrite": { name: "AI Rewrite", cost: 1, description: "Rewrite selected text" },
  "content.expand": { name: "AI Expand", cost: 1, description: "Expand text with more detail" },
  "content.summarize": { name: "AI Summarize", cost: 1, description: "Summarize long content" },
  "content.translate": { name: "AI Translate", cost: 2, description: "Translate to another language" },
  "content.tone": { name: "Change Tone", cost: 1, description: "Change writing tone" },
  "content.headline": { name: "Generate Headlines", cost: 1, description: "Generate 5 headline options" },
  "content.blog": { name: "Write Blog Post", cost: 5, description: "Generate full blog post from topic" },
  "content.product": { name: "Product Description", cost: 2, description: "Write product description" },

  // SEO
  "seo.audit": { name: "SEO Audit", cost: 3, description: "Full page SEO audit with fixes" },
  "seo.meta": { name: "Generate Meta Tags", cost: 1, description: "Generate title + description" },
  "seo.schema": { name: "Generate Schema", cost: 2, description: "Generate JSON-LD structured data" },
  "seo.keywords": { name: "Keyword Research", cost: 2, description: "Find related keywords" },
  "seo.internal-links": { name: "Internal Link Suggestions", cost: 2, description: "Suggest internal links" },

  // Images
  "image.generate": { name: "Generate Image", cost: 3, description: "AI image from text description" },
  "image.alt": { name: "Generate Alt Text", cost: 1, description: "Generate alt text for images" },
  "image.optimize": { name: "Optimize Images", cost: 1, description: "Suggest image optimizations" },

  // Video
  "video.spokesperson": { name: "Spokesperson Video", cost: 10, description: "AI presenter video" },
  "video.embed": { name: "Video Embed", cost: 0, description: "Embed existing Zoobicon video" },

  // Chatbot
  "chatbot.create": { name: "Create Chatbot", cost: 5, description: "AI chatbot for your site" },
  "chatbot.embed": { name: "Embed Chatbot", cost: 0, description: "Add chatbot widget to site" },

  // Forms
  "form.generate": { name: "Generate Form", cost: 2, description: "AI-generated form from description" },

  // Domains
  "domain.search": { name: "Domain Search", cost: 0, description: "Search domain availability" },
  "domain.widget": { name: "Domain Widget", cost: 0, description: "Embed domain search on page" },
};

// Plan limits
export const PLAN_LIMITS = {
  free: { opsPerMonth: 50, features: ["content", "seo.meta", "image.alt", "domain"] },
  pro: { opsPerMonth: -1, features: ["all"] }, // -1 = unlimited
};

/**
 * Handle a WordPress plugin API request.
 * Validates API key, checks plan limits, routes to appropriate service.
 */
export async function handlePluginRequest(params: {
  apiKey: string;
  operation: string;
  input: Record<string, unknown>;
}): Promise<{
  success: boolean;
  result?: unknown;
  error?: string;
  opsRemaining?: number;
}> {
  // Validate API key
  try {
    const { validateAPIKey, recordUsage, API_PRICING } = await import("./api-keys");
    const key = await validateAPIKey(`Bearer ${params.apiKey}`);

    // Check operation exists
    const op = PLUGIN_OPERATIONS[params.operation as keyof typeof PLUGIN_OPERATIONS];
    if (!op) {
      return { success: false, error: `Unknown operation: ${params.operation}` };
    }

    // Check plan allows this operation
    const planLimits = PLAN_LIMITS[key.plan === "enterprise" ? "pro" : key.plan as "free" | "pro"];
    if (planLimits.features[0] !== "all") {
      const category = params.operation.split(".")[0];
      if (!planLimits.features.some(f => params.operation.startsWith(f))) {
        return { success: false, error: `${op.name} requires a Pro plan. Upgrade at zoobicon.com/pricing` };
      }
    }

    // Route to appropriate handler
    let result: unknown;

    if (params.operation.startsWith("content.")) {
      result = await handleContentOperation(params.operation, params.input);
    } else if (params.operation.startsWith("seo.")) {
      result = await handleSEOOperation(params.operation, params.input);
    } else if (params.operation.startsWith("image.")) {
      result = await handleImageOperation(params.operation, params.input);
    } else if (params.operation.startsWith("domain.")) {
      result = await handleDomainOperation(params.operation, params.input);
    } else {
      return { success: false, error: "Operation not yet implemented" };
    }

    // Record usage
    await recordUsage(key.id, `/wp/${params.operation}`, 200, 0, op.cost * 0.01);

    return {
      success: true,
      result,
      opsRemaining: planLimits.opsPerMonth === -1 ? -1 : planLimits.opsPerMonth - key.usageToday,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

// Content operations
async function handleContentOperation(operation: string, input: Record<string, unknown>): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service unavailable");

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const text = input.text as string || "";
  const language = input.language as string || "en";

  const prompts: Record<string, string> = {
    "content.rewrite": `Rewrite this text to be more engaging and professional. Keep the same meaning:\n\n${text}`,
    "content.expand": `Expand this text with more detail, examples, and depth. Keep the same tone:\n\n${text}`,
    "content.summarize": `Summarize this text concisely in 2-3 sentences:\n\n${text}`,
    "content.translate": `Translate this text to ${language}. Preserve formatting:\n\n${text}`,
    "content.tone": `Rewrite this text in a ${input.tone || "professional"} tone:\n\n${text}`,
    "content.headline": `Generate 5 compelling headline options for this content:\n\n${text}\n\nOutput as a JSON array: ["headline1", "headline2", ...]`,
    "content.blog": `Write a comprehensive, SEO-optimized blog post about: ${text}\n\nInclude: engaging intro, 3-5 subheadings, conclusion with CTA. 800-1200 words.`,
    "content.product": `Write a compelling product description for: ${text}\n\nInclude: key features, benefits, use cases. 150-300 words.`,
  };

  const prompt = prompts[operation];
  if (!prompt) throw new Error("Unknown content operation");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  return { text: response.content.find(b => b.type === "text")?.text || "" };
}

// SEO operations
async function handleSEOOperation(operation: string, input: Record<string, unknown>): Promise<unknown> {
  if (operation === "seo.audit") {
    const { auditPage } = await import("./seo-crawler");
    return auditPage(input.url as string);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service unavailable");

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const content = input.content as string || input.url as string || "";

  const prompts: Record<string, string> = {
    "seo.meta": `Generate SEO meta tags for this page content. Output JSON: {"title": "under 60 chars", "description": "under 160 chars"}\n\n${content}`,
    "seo.schema": `Generate JSON-LD structured data for this page. Output valid JSON-LD only:\n\n${content}`,
    "seo.keywords": `Find 10 related keywords for this content. Output JSON array: ["keyword1", "keyword2"]\n\n${content}`,
  };

  const prompt = prompts[operation];
  if (!prompt) throw new Error("Unknown SEO operation");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  return { text: response.content.find(b => b.type === "text")?.text || "" };
}

// Image operations
async function handleImageOperation(operation: string, input: Record<string, unknown>): Promise<unknown> {
  if (operation === "image.generate") {
    const { generateAvatar } = await import("./video-pipeline");
    const result = await generateAvatar(input.prompt as string || "professional photo");
    return { imageUrl: result.imageUrl };
  }

  if (operation === "image.alt") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service unavailable");
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: `Generate concise, descriptive alt text for an image on a page about: ${input.context || "general content"}. The image appears to show: ${input.description || "unknown"}. Output only the alt text, nothing else.` }],
    });
    return { altText: response.content.find(b => b.type === "text")?.text || "" };
  }

  throw new Error("Unknown image operation");
}

// Domain operations
async function handleDomainOperation(operation: string, input: Record<string, unknown>): Promise<unknown> {
  if (operation === "domain.search") {
    // Use our real OpenSRS domain search
    const query = input.query as string || "";
    const tlds = (input.tlds as string) || "com,ai,io";
    const res = await fetch(`https://zoobicon.com/api/domains/search?q=${encodeURIComponent(query)}&tlds=${encodeURIComponent(tlds)}`);
    return res.json();
  }

  return { message: "Use the domain search widget" };
}

/**
 * Generate the WordPress plugin PHP code.
 * This is the actual plugin file that gets installed in WordPress.
 */
export function generatePluginPHP(): string {
  return `<?php
/**
 * Plugin Name: Zoobicon AI
 * Plugin URI: https://zoobicon.com/wordpress
 * Description: AI-powered content writing, SEO optimization, image generation, chatbot, and video creation for WordPress.
 * Version: 1.0.0
 * Author: Zoobicon
 * Author URI: https://zoobicon.com
 * License: GPL v2 or later
 * Text Domain: zoobicon-ai
 */

if (!defined('ABSPATH')) exit;

define('ZOOBICON_AI_VERSION', '1.0.0');
define('ZOOBICON_API_URL', 'https://api.zoobicon.ai/v1/wordpress');

class Zoobicon_AI {
    private static $instance = null;
    private $api_key = '';

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->api_key = get_option('zoobicon_api_key', '');
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_scripts'));
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Add AI button to block editor
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_editor_assets'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'Zoobicon AI',
            'Zoobicon AI',
            'manage_options',
            'zoobicon-ai',
            array($this, 'admin_page'),
            'dashicons-superhero',
            30
        );
    }

    public function register_settings() {
        register_setting('zoobicon_ai_settings', 'zoobicon_api_key');
        register_setting('zoobicon_ai_settings', 'zoobicon_chatbot_enabled');
        register_setting('zoobicon_ai_settings', 'zoobicon_seo_auto');
    }

    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Zoobicon AI</h1>
            <p>AI-powered tools for your WordPress site. <a href="https://zoobicon.com" target="_blank">Get your API key</a></p>
            <form method="post" action="options.php">
                <?php settings_fields('zoobicon_ai_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th>API Key</th>
                        <td><input type="text" name="zoobicon_api_key" value="<?php echo esc_attr(get_option('zoobicon_api_key')); ?>" class="regular-text" placeholder="zbk_live_..." /></td>
                    </tr>
                    <tr>
                        <th>AI Chatbot</th>
                        <td><label><input type="checkbox" name="zoobicon_chatbot_enabled" value="1" <?php checked(get_option('zoobicon_chatbot_enabled'), 1); ?> /> Enable AI chatbot on your site</label></td>
                    </tr>
                    <tr>
                        <th>Auto SEO</th>
                        <td><label><input type="checkbox" name="zoobicon_seo_auto" value="1" <?php checked(get_option('zoobicon_seo_auto'), 1); ?> /> Auto-generate meta tags for new posts</label></td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function call_api($operation, $input) {
        if (empty($this->api_key)) return new WP_Error('no_key', 'Zoobicon API key not set');

        $response = wp_remote_post(ZOOBICON_API_URL, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array(
                'apiKey' => $this->api_key,
                'operation' => $operation,
                'input' => $input,
            )),
            'timeout' => 60,
        ));

        if (is_wp_error($response)) return $response;
        return json_decode(wp_remote_retrieve_body($response), true);
    }

    public function register_rest_routes() {
        register_rest_route('zoobicon/v1', '/ai', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_ai_request'),
            'permission_callback' => function() { return current_user_can('edit_posts'); },
        ));
    }

    public function handle_ai_request($request) {
        $operation = $request->get_param('operation');
        $input = $request->get_param('input') ?: array();
        $result = $this->call_api($operation, $input);
        return rest_ensure_response($result);
    }

    public function enqueue_admin_scripts() { /* Admin styles */ }
    public function enqueue_frontend_scripts() {
        if (get_option('zoobicon_chatbot_enabled')) {
            // Inject chatbot widget
            wp_add_inline_script('jquery', $this->get_chatbot_script());
        }
    }
    public function enqueue_editor_assets() { /* Block editor AI button */ }
    private function get_chatbot_script() { return '/* Chatbot widget code */'; }
}

Zoobicon_AI::get_instance();
`;
}
