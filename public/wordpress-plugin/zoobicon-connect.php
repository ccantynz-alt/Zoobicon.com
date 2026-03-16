<?php
/**
 * Plugin Name: Zoobicon Connect
 * Plugin URI: https://zoobicon.com/wordpress
 * Description: Deploy AI-generated websites from Zoobicon.com directly to your WordPress site. One-click publishing from the Zoobicon website builder.
 * Version: 1.0.0
 * Author: Zoobicon
 * Author URI: https://zoobicon.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: zoobicon-connect
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Tested up to: 6.7
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ZOOBICON_CONNECT_VERSION', '1.0.0');
define('ZOOBICON_CONNECT_PLUGIN_DIR', plugin_dir_path(__FILE__));

/**
 * Main plugin class
 */
class Zoobicon_Connect {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_styles']);
    }

    /**
     * Register REST API routes for receiving deployments from Zoobicon
     */
    public function register_rest_routes() {
        // POST /wp-json/zoobicon/v1/deploy — receive a page deployment
        register_rest_route('zoobicon/v1', '/deploy', [
            'methods'  => 'POST',
            'callback' => [$this, 'handle_deploy'],
            'permission_callback' => [$this, 'verify_api_key'],
        ]);

        // GET /wp-json/zoobicon/v1/status — health check
        register_rest_route('zoobicon/v1', '/status', [
            'methods'  => 'GET',
            'callback' => [$this, 'handle_status'],
            'permission_callback' => [$this, 'verify_api_key'],
        ]);

        // GET /wp-json/zoobicon/v1/pages — list zoobicon-deployed pages
        register_rest_route('zoobicon/v1', '/pages', [
            'methods'  => 'GET',
            'callback' => [$this, 'handle_list_pages'],
            'permission_callback' => [$this, 'verify_api_key'],
        ]);

        // DELETE /wp-json/zoobicon/v1/pages/(?P<id>\d+) — delete a deployed page
        register_rest_route('zoobicon/v1', '/pages/(?P<id>\d+)', [
            'methods'  => 'DELETE',
            'callback' => [$this, 'handle_delete_page'],
            'permission_callback' => [$this, 'verify_api_key'],
        ]);
    }

    /**
     * Verify the Zoobicon API key from the request
     */
    public function verify_api_key($request) {
        $auth_header = $request->get_header('X-Zoobicon-Key');
        if (empty($auth_header)) {
            $auth_header = $request->get_header('Authorization');
            if ($auth_header && strpos($auth_header, 'Bearer ') === 0) {
                $auth_header = substr($auth_header, 7);
            }
        }

        $stored_key = get_option('zoobicon_connect_key', '');
        if (empty($stored_key) || empty($auth_header)) {
            return new WP_Error(
                'unauthorized',
                'Invalid or missing API key. Configure your Zoobicon Connect key in WordPress admin.',
                ['status' => 401]
            );
        }

        if (!hash_equals($stored_key, trim($auth_header))) {
            return new WP_Error(
                'unauthorized',
                'API key mismatch.',
                ['status' => 401]
            );
        }

        return true;
    }

    /**
     * Handle deployment from Zoobicon
     *
     * Accepts HTML content and creates/updates a WordPress page.
     * Supports: page creation, page update, custom templates, and SEO meta.
     */
    public function handle_deploy($request) {
        $params = $request->get_json_params();

        $html    = isset($params['html']) ? $params['html'] : '';
        $title   = isset($params['title']) ? sanitize_text_field($params['title']) : 'Zoobicon Page';
        $slug    = isset($params['slug']) ? sanitize_title($params['slug']) : '';
        $status  = isset($params['status']) ? sanitize_text_field($params['status']) : 'draft';
        $page_id = isset($params['page_id']) ? intval($params['page_id']) : 0;
        $template = isset($params['template']) ? sanitize_text_field($params['template']) : '';
        $seo     = isset($params['seo']) ? $params['seo'] : [];
        $mode    = isset($params['mode']) ? sanitize_text_field($params['mode']) : 'page';

        if (empty($html)) {
            return new WP_Error('missing_html', 'HTML content is required.', ['status' => 400]);
        }

        // Sanitize status
        $allowed_statuses = ['publish', 'draft', 'pending', 'private'];
        if (!in_array($status, $allowed_statuses)) {
            $status = 'draft';
        }

        // Extract body content if full HTML document
        $body_html = $this->extract_body_content($html);

        // Extract and enqueue styles from the HTML
        $styles = $this->extract_styles($html);

        // Build page content with embedded styles
        $page_content = '';
        if (!empty($styles)) {
            $page_content .= "<!-- zoobicon:styles -->\n<style>\n" . $styles . "\n</style>\n<!-- /zoobicon:styles -->\n\n";
        }
        $page_content .= $body_html;

        // Prepare post data
        $post_data = [
            'post_title'   => $title,
            'post_content' => $page_content,
            'post_status'  => $status,
            'post_type'    => ($mode === 'post') ? 'post' : 'page',
            'post_name'    => $slug,
            'meta_input'   => [
                '_zoobicon_deployed'   => true,
                '_zoobicon_deploy_time' => current_time('mysql'),
                '_zoobicon_version'    => 1,
                '_zoobicon_full_html'  => $html, // Store original for re-export
            ],
        ];

        if (!empty($template)) {
            $post_data['page_template'] = $template;
        }

        // Update existing page or create new one
        if ($page_id > 0) {
            $existing = get_post($page_id);
            if (!$existing || !in_array($existing->post_type, ['page', 'post'])) {
                return new WP_Error('page_not_found', 'Page not found.', ['status' => 404]);
            }

            $post_data['ID'] = $page_id;
            $version = (int) get_post_meta($page_id, '_zoobicon_version', true);
            $post_data['meta_input']['_zoobicon_version'] = $version + 1;

            $result = wp_update_post($post_data, true);
        } else {
            // Check if slug already exists
            if (!empty($slug)) {
                $existing_page = get_page_by_path($slug, OBJECT, $post_data['post_type']);
                if ($existing_page) {
                    $zoobicon_deployed = get_post_meta($existing_page->ID, '_zoobicon_deployed', true);
                    if ($zoobicon_deployed) {
                        // Update existing Zoobicon page
                        $post_data['ID'] = $existing_page->ID;
                        $version = (int) get_post_meta($existing_page->ID, '_zoobicon_version', true);
                        $post_data['meta_input']['_zoobicon_version'] = $version + 1;
                        $result = wp_update_post($post_data, true);
                    } else {
                        // Slug taken by non-Zoobicon page — append suffix
                        $post_data['post_name'] = $slug . '-zoobicon';
                        $result = wp_insert_post($post_data, true);
                    }
                } else {
                    $result = wp_insert_post($post_data, true);
                }
            } else {
                $result = wp_insert_post($post_data, true);
            }
        }

        if (is_wp_error($result)) {
            return new WP_Error('deploy_failed', $result->get_error_message(), ['status' => 500]);
        }

        $post_id = is_int($result) ? $result : $page_id;

        // Handle SEO meta if provided
        if (!empty($seo)) {
            if (isset($seo['meta_title'])) {
                update_post_meta($post_id, '_zoobicon_seo_title', sanitize_text_field($seo['meta_title']));
                // Yoast SEO compatibility
                update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($seo['meta_title']));
            }
            if (isset($seo['meta_description'])) {
                update_post_meta($post_id, '_zoobicon_seo_description', sanitize_text_field($seo['meta_description']));
                update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_text_field($seo['meta_description']));
            }
            if (isset($seo['og_image'])) {
                update_post_meta($post_id, '_zoobicon_og_image', esc_url_raw($seo['og_image']));
            }
        }

        // Log deployment
        $this->log_deployment($post_id, $title, $status);

        $permalink = get_permalink($post_id);
        $edit_link = get_edit_post_link($post_id, 'raw');
        $version = (int) get_post_meta($post_id, '_zoobicon_version', true);

        return rest_ensure_response([
            'success'    => true,
            'page_id'    => $post_id,
            'title'      => get_the_title($post_id),
            'slug'       => get_post_field('post_name', $post_id),
            'status'     => get_post_status($post_id),
            'url'        => $permalink,
            'edit_url'   => $edit_link,
            'version'    => $version,
            'deployed_at' => current_time('c'),
        ]);
    }

    /**
     * Health check endpoint
     */
    public function handle_status($request) {
        $deploy_count = $this->get_deploy_count();

        return rest_ensure_response([
            'status'     => 'connected',
            'plugin'     => 'zoobicon-connect',
            'version'    => ZOOBICON_CONNECT_VERSION,
            'wordpress'  => get_bloginfo('version'),
            'site_name'  => get_bloginfo('name'),
            'site_url'   => get_site_url(),
            'rest_url'   => get_rest_url(null, 'zoobicon/v1'),
            'theme'      => wp_get_theme()->get('Name'),
            'deploys'    => $deploy_count,
            'php'        => phpversion(),
        ]);
    }

    /**
     * List all Zoobicon-deployed pages
     */
    public function handle_list_pages($request) {
        $args = [
            'post_type'      => ['page', 'post'],
            'posts_per_page' => 50,
            'meta_key'       => '_zoobicon_deployed',
            'meta_value'     => '1',
            'orderby'        => 'modified',
            'order'          => 'DESC',
        ];

        $query = new WP_Query($args);
        $pages = [];

        foreach ($query->posts as $post) {
            $pages[] = [
                'id'         => $post->ID,
                'title'      => $post->post_title,
                'slug'       => $post->post_name,
                'status'     => $post->post_status,
                'type'       => $post->post_type,
                'url'        => get_permalink($post->ID),
                'version'    => (int) get_post_meta($post->ID, '_zoobicon_version', true),
                'deployed_at' => get_post_meta($post->ID, '_zoobicon_deploy_time', true),
                'modified'   => $post->post_modified,
            ];
        }

        return rest_ensure_response([
            'pages' => $pages,
            'total' => $query->found_posts,
        ]);
    }

    /**
     * Delete a Zoobicon-deployed page
     */
    public function handle_delete_page($request) {
        $page_id = (int) $request->get_param('id');
        $post = get_post($page_id);

        if (!$post) {
            return new WP_Error('not_found', 'Page not found.', ['status' => 404]);
        }

        $is_zoobicon = get_post_meta($page_id, '_zoobicon_deployed', true);
        if (!$is_zoobicon) {
            return new WP_Error('not_zoobicon', 'This page was not deployed by Zoobicon.', ['status' => 403]);
        }

        $result = wp_trash_post($page_id);
        if (!$result) {
            return new WP_Error('delete_failed', 'Failed to delete page.', ['status' => 500]);
        }

        return rest_ensure_response([
            'success' => true,
            'page_id' => $page_id,
            'message' => 'Page moved to trash.',
        ]);
    }

    /**
     * Extract <body> content from a full HTML document
     */
    private function extract_body_content($html) {
        // If it's a full HTML doc, extract body
        if (preg_match('/<body[^>]*>(.*)<\/body>/is', $html, $matches)) {
            return trim($matches[1]);
        }
        // Otherwise return as-is (it's already a fragment)
        return $html;
    }

    /**
     * Extract <style> blocks and inline styles from HTML
     */
    private function extract_styles($html) {
        $styles = '';
        // Extract all <style> blocks
        if (preg_match_all('/<style[^>]*>(.*?)<\/style>/is', $html, $matches)) {
            foreach ($matches[1] as $style) {
                $styles .= trim($style) . "\n";
            }
        }
        return $styles;
    }

    /**
     * Log deployment for the admin dashboard
     */
    private function log_deployment($page_id, $title, $status) {
        $log = get_option('zoobicon_deploy_log', []);
        array_unshift($log, [
            'page_id' => $page_id,
            'title'   => $title,
            'status'  => $status,
            'time'    => current_time('c'),
        ]);
        // Keep last 50 deployments
        $log = array_slice($log, 0, 50);
        update_option('zoobicon_deploy_log', $log);
    }

    /**
     * Get total deployment count
     */
    private function get_deploy_count() {
        $query = new WP_Query([
            'post_type'      => ['page', 'post'],
            'posts_per_page' => 1,
            'meta_key'       => '_zoobicon_deployed',
            'meta_value'     => '1',
            'fields'         => 'ids',
        ]);
        return $query->found_posts;
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            'Zoobicon Connect',
            'Zoobicon',
            'manage_options',
            'zoobicon-connect',
            [$this, 'render_admin_page'],
            'dashicons-cloud-upload',
            80
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('zoobicon_connect_settings', 'zoobicon_connect_key', [
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ]);

        // Auto-generate a connect key on first activation
        if (empty(get_option('zoobicon_connect_key', ''))) {
            $auto_key = 'zbc_' . bin2hex(random_bytes(24));
            update_option('zoobicon_connect_key', $auto_key);
        }
    }

    /**
     * Enqueue admin styles
     */
    public function enqueue_admin_styles($hook) {
        if ($hook !== 'toplevel_page_zoobicon-connect') {
            return;
        }
        wp_enqueue_style(
            'zoobicon-connect-admin',
            plugin_dir_url(__FILE__) . 'admin.css',
            [],
            ZOOBICON_CONNECT_VERSION
        );
    }

    /**
     * Render admin settings page
     */
    public function render_admin_page() {
        $connect_key = get_option('zoobicon_connect_key', '');
        $site_url = get_site_url();
        $rest_url = get_rest_url(null, 'zoobicon/v1');
        $deploy_log = get_option('zoobicon_deploy_log', []);
        $deploy_count = $this->get_deploy_count();
        ?>
        <div class="wrap zoobicon-wrap">
            <div class="zoobicon-header">
                <h1>
                    <span class="zoobicon-logo">Z</span>
                    Zoobicon Connect
                </h1>
                <p class="zoobicon-subtitle">Deploy AI-generated websites directly from Zoobicon to WordPress</p>
            </div>

            <?php if (isset($_GET['settings-updated'])): ?>
            <div class="notice notice-success is-dismissible">
                <p>Settings saved successfully.</p>
            </div>
            <?php endif; ?>

            <div class="zoobicon-grid">
                <!-- Connection Status -->
                <div class="zoobicon-card zoobicon-card-status">
                    <h2>Connection Status</h2>
                    <div class="zoobicon-status-indicator zoobicon-status-ready">
                        <span class="zoobicon-status-dot"></span>
                        Ready to receive deployments
                    </div>
                    <div class="zoobicon-stats">
                        <div class="zoobicon-stat">
                            <span class="zoobicon-stat-value"><?php echo esc_html($deploy_count); ?></span>
                            <span class="zoobicon-stat-label">Pages Deployed</span>
                        </div>
                        <div class="zoobicon-stat">
                            <span class="zoobicon-stat-value">v<?php echo esc_html(ZOOBICON_CONNECT_VERSION); ?></span>
                            <span class="zoobicon-stat-label">Plugin Version</span>
                        </div>
                    </div>
                </div>

                <!-- Setup Instructions -->
                <div class="zoobicon-card">
                    <h2>Quick Setup</h2>
                    <ol class="zoobicon-steps">
                        <li>Copy your <strong>Connect Key</strong> below</li>
                        <li>In Zoobicon Builder, click <strong>Export → WordPress</strong></li>
                        <li>Select <strong>"Deploy to WordPress"</strong></li>
                        <li>Paste your WordPress URL and Connect Key</li>
                        <li>Click <strong>Deploy</strong> — your page appears in WordPress</li>
                    </ol>
                </div>
            </div>

            <!-- Settings Form -->
            <div class="zoobicon-card">
                <h2>Connection Settings</h2>
                <form method="post" action="options.php">
                    <?php settings_fields('zoobicon_connect_settings'); ?>

                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="zoobicon_connect_key">Connect Key</label>
                            </th>
                            <td>
                                <div class="zoobicon-key-field">
                                    <input type="text" id="zoobicon_connect_key" name="zoobicon_connect_key"
                                        value="<?php echo esc_attr($connect_key); ?>"
                                        class="regular-text code" readonly />
                                    <button type="button" class="button" onclick="navigator.clipboard.writeText(document.getElementById('zoobicon_connect_key').value); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000);">
                                        Copy
                                    </button>
                                    <button type="button" class="button" onclick="if(confirm('Generate a new key? The old key will stop working.')) { document.getElementById('zoobicon_connect_key').readOnly = false; document.getElementById('zoobicon_connect_key').value = 'zbc_' + Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2,'0')).join(''); document.getElementById('zoobicon_connect_key').readOnly = true; }">
                                        Regenerate
                                    </button>
                                </div>
                                <p class="description">
                                    This key authenticates deployments from Zoobicon. Keep it secret.
                                    Enter this in the Zoobicon Builder when deploying to WordPress.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">REST API Endpoint</th>
                            <td>
                                <code><?php echo esc_html($rest_url); ?>/deploy</code>
                                <p class="description">Zoobicon sends deployments to this URL automatically.</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Site URL</th>
                            <td>
                                <code><?php echo esc_html($site_url); ?></code>
                                <p class="description">Enter this URL in the Zoobicon Builder WordPress deploy panel.</p>
                            </td>
                        </tr>
                    </table>

                    <?php submit_button('Save Settings'); ?>
                </form>
            </div>

            <!-- Deploy Log -->
            <?php if (!empty($deploy_log)): ?>
            <div class="zoobicon-card">
                <h2>Recent Deployments</h2>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Page</th>
                            <th>Status</th>
                            <th>Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach (array_slice($deploy_log, 0, 10) as $entry): ?>
                        <tr>
                            <td>
                                <strong>
                                    <a href="<?php echo esc_url(get_edit_post_link($entry['page_id'])); ?>">
                                        <?php echo esc_html($entry['title']); ?>
                                    </a>
                                </strong>
                            </td>
                            <td>
                                <span class="zoobicon-badge zoobicon-badge-<?php echo esc_attr($entry['status']); ?>">
                                    <?php echo esc_html(ucfirst($entry['status'])); ?>
                                </span>
                            </td>
                            <td><?php echo esc_html(human_time_diff(strtotime($entry['time']), current_time('timestamp')) . ' ago'); ?></td>
                            <td>
                                <a href="<?php echo esc_url(get_permalink($entry['page_id'])); ?>" target="_blank">View</a>
                                |
                                <a href="<?php echo esc_url(get_edit_post_link($entry['page_id'])); ?>">Edit</a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
        <?php
    }
}

// Initialize
Zoobicon_Connect::get_instance();

// Activation hook — flush rewrite rules so REST routes work immediately
register_activation_hook(__FILE__, function() {
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
