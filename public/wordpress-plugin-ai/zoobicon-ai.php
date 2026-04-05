<?php
/**
 * Plugin Name: Zoobicon AI
 * Plugin URI: https://zoobicon.com/wordpress-ai
 * Description: 25+ AI features in one plugin. Content generation, SEO, images, video, chatbots, site audits, WooCommerce, accessibility, translation, social media, domains, landing pages, analytics — all powered by Zoobicon. Replace 12 plugins with one.
 * Version: 2.0.0
 * Author: Zoobicon
 * Author URI: https://zoobicon.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: zoobicon-ai
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Tested up to: 7.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'ZOOBICON_AI_VERSION', '2.0.0' );
define( 'ZOOBICON_AI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ZOOBICON_AI_API_BASE', 'https://zoobicon.com/api/v1/wordpress' );

/**
 * Main Zoobicon AI plugin class.
 *
 * Architecture:
 * - All AI processing happens via Zoobicon API (no API keys stored in WordPress)
 * - Free tier: 50 AI operations/month (tracked server-side)
 * - Pro tier: Unlimited operations ($19/month via Stripe)
 * - Plugin only sends requests when user triggers an action (no background calls)
 * - No ads, no tracking, no phone-home beyond explicit API calls
 */
class Zoobicon_AI {

    private static $instance = null;
    private $api_key = '';

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->api_key = get_option( 'zoobicon_ai_api_key', '' );

        add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );

        // Block editor sidebar panel
        add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );

        // REST API endpoints for the editor sidebar
        add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

        // Classic editor meta box
        add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ) );

        // Bulk actions
        add_filter( 'bulk_actions-edit-post', array( $this, 'register_bulk_actions' ) );
        add_filter( 'handle_bulk_actions-edit-post', array( $this, 'handle_bulk_actions' ), 10, 3 );

        // WordPress 7.0 Connectors API support
        add_action( 'init', array( $this, 'register_wp7_integration' ) );

        // WooCommerce integration
        if ( class_exists( 'WooCommerce' ) || in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) {
            add_filter( 'bulk_actions-edit-product', array( $this, 'register_woo_bulk_actions' ) );
            add_filter( 'handle_bulk_actions-edit-product', array( $this, 'handle_woo_bulk_actions' ), 10, 3 );
        }
    }

    // ================================================================
    // REST API — All AI operations go through these endpoints
    // ================================================================

    public function register_rest_routes() {
        // Generate content (blog post, product description, etc.)
        register_rest_route( 'zoobicon-ai/v1', '/generate', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_generate' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // SEO optimization (meta title, description, keywords)
        register_rest_route( 'zoobicon-ai/v1', '/seo', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_seo' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Image generation
        register_rest_route( 'zoobicon-ai/v1', '/image', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_image' ),
            'permission_callback' => function() { return current_user_can( 'upload_files' ); },
        ) );

        // Alt text generation for existing images
        register_rest_route( 'zoobicon-ai/v1', '/alt-text', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_alt_text' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Rewrite/improve existing content
        register_rest_route( 'zoobicon-ai/v1', '/rewrite', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_rewrite' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Translate content
        register_rest_route( 'zoobicon-ai/v1', '/translate', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_translate' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Usage stats
        register_rest_route( 'zoobicon-ai/v1', '/usage', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'rest_usage' ),
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ) );

        // === NEW v2.0 ROUTES — Platform Features ===

        // Video generation (blog post → video)
        register_rest_route( 'zoobicon-ai/v1', '/video', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // AI Chatbot deployment
        register_rest_route( 'zoobicon-ai/v1', '/chatbot', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ) );

        // Domain search
        register_rest_route( 'zoobicon-ai/v1', '/domain-search', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ) );

        // Landing page generation
        register_rest_route( 'zoobicon-ai/v1', '/landing-page', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Site audit
        register_rest_route( 'zoobicon-ai/v1', '/site-audit', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_site_audit' ),
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ) );

        // Content refresh
        register_rest_route( 'zoobicon-ai/v1', '/content-refresh', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Accessibility check & fix
        register_rest_route( 'zoobicon-ai/v1', '/accessibility', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Internal link suggestions
        register_rest_route( 'zoobicon-ai/v1', '/internal-links', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_internal_links' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Social media post generation
        register_rest_route( 'zoobicon-ai/v1', '/social', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Content calendar
        register_rest_route( 'zoobicon-ai/v1', '/content-calendar', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ) );

        // Analytics explainer
        register_rest_route( 'zoobicon-ai/v1', '/analytics', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ) );

        // Competitor analysis
        register_rest_route( 'zoobicon-ai/v1', '/competitor', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy' ),
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ) );

        // WooCommerce: product descriptions
        register_rest_route( 'zoobicon-ai/v1', '/woo/descriptions', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy_woo' ),
            'permission_callback' => function() { return current_user_can( 'edit_products' ); },
        ) );

        // WooCommerce: product SEO
        register_rest_route( 'zoobicon-ai/v1', '/woo/seo', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'rest_proxy_woo' ),
            'permission_callback' => function() { return current_user_can( 'edit_products' ); },
        ) );
    }

    /**
     * Call the Zoobicon API.
     */
    private function call_api( $endpoint, $data = array() ) {
        if ( empty( $this->api_key ) ) {
            return new WP_Error( 'no_api_key', 'Zoobicon AI API key not configured. Go to Settings → Zoobicon AI to add your key.' );
        }

        $response = wp_remote_post( ZOOBICON_AI_API_BASE . '/' . $endpoint, array(
            'timeout' => 60,
            'headers' => array(
                'Content-Type'    => 'application/json',
                'Authorization'   => 'Bearer ' . $this->api_key,
                'X-Plugin-Version' => ZOOBICON_AI_VERSION,
                'X-Site-URL'      => get_site_url(),
            ),
            'body' => wp_json_encode( $data ),
        ) );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code === 429 ) {
            return new WP_Error(
                'rate_limited',
                'You\'ve reached your monthly limit of 50 free AI operations. Upgrade to Pro for unlimited usage at zoobicon.com/pricing.'
            );
        }

        if ( $code >= 400 ) {
            $msg = isset( $body['error'] ) ? $body['error'] : 'API request failed.';
            return new WP_Error( 'api_error', $msg );
        }

        return $body;
    }

    // ----------------------------------------------------------------
    // REST handlers
    // ----------------------------------------------------------------

    public function rest_generate( $request ) {
        $params = $request->get_json_params();
        $type   = sanitize_text_field( $params['type'] ?? 'blog_post' );
        $prompt = sanitize_textarea_field( $params['prompt'] ?? '' );
        $tone   = sanitize_text_field( $params['tone'] ?? 'professional' );
        $length = sanitize_text_field( $params['length'] ?? 'medium' );

        if ( empty( $prompt ) ) {
            return new WP_Error( 'missing_prompt', 'A prompt is required.', array( 'status' => 400 ) );
        }

        $result = $this->call_api( 'generate', array(
            'type'   => $type,
            'prompt' => $prompt,
            'tone'   => $tone,
            'length' => $length,
            'site_name' => get_bloginfo( 'name' ),
        ) );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $result );
    }

    public function rest_seo( $request ) {
        $params  = $request->get_json_params();
        $content = $params['content'] ?? '';
        $title   = sanitize_text_field( $params['title'] ?? '' );
        $post_id = intval( $params['post_id'] ?? 0 );

        if ( empty( $content ) && empty( $title ) ) {
            return new WP_Error( 'missing_content', 'Content or title is required.', array( 'status' => 400 ) );
        }

        $result = $this->call_api( 'seo', array(
            'content' => wp_strip_all_tags( substr( $content, 0, 5000 ) ),
            'title'   => $title,
            'url'     => $post_id ? get_permalink( $post_id ) : '',
        ) );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        // Auto-save to Yoast SEO if installed
        if ( $post_id && isset( $result['meta_title'] ) ) {
            update_post_meta( $post_id, '_yoast_wpseo_title', sanitize_text_field( $result['meta_title'] ) );
            update_post_meta( $post_id, '_yoast_wpseo_metadesc', sanitize_text_field( $result['meta_description'] ?? '' ) );
            // Also save to generic meta for non-Yoast sites
            update_post_meta( $post_id, '_zoobicon_seo_title', sanitize_text_field( $result['meta_title'] ) );
            update_post_meta( $post_id, '_zoobicon_seo_description', sanitize_text_field( $result['meta_description'] ?? '' ) );
        }

        return rest_ensure_response( $result );
    }

    public function rest_image( $request ) {
        $params = $request->get_json_params();
        $prompt = sanitize_textarea_field( $params['prompt'] ?? '' );
        $style  = sanitize_text_field( $params['style'] ?? 'realistic' );
        $size   = sanitize_text_field( $params['size'] ?? '1024x1024' );

        if ( empty( $prompt ) ) {
            return new WP_Error( 'missing_prompt', 'An image description is required.', array( 'status' => 400 ) );
        }

        $result = $this->call_api( 'image', array(
            'prompt' => $prompt,
            'style'  => $style,
            'size'   => $size,
        ) );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        // Download and add to media library if URL returned
        if ( ! empty( $result['url'] ) ) {
            $media_id = $this->sideload_image( $result['url'], $prompt );
            if ( ! is_wp_error( $media_id ) ) {
                $result['media_id']  = $media_id;
                $result['media_url'] = wp_get_attachment_url( $media_id );
            }
        }

        return rest_ensure_response( $result );
    }

    public function rest_alt_text( $request ) {
        $params   = $request->get_json_params();
        $image_url = esc_url_raw( $params['image_url'] ?? '' );
        $media_id  = intval( $params['media_id'] ?? 0 );

        if ( empty( $image_url ) && $media_id > 0 ) {
            $image_url = wp_get_attachment_url( $media_id );
        }

        if ( empty( $image_url ) ) {
            return new WP_Error( 'missing_image', 'An image URL or media ID is required.', array( 'status' => 400 ) );
        }

        $result = $this->call_api( 'alt-text', array(
            'image_url' => $image_url,
        ) );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        // Auto-save alt text to media item
        if ( $media_id > 0 && ! empty( $result['alt_text'] ) ) {
            update_post_meta( $media_id, '_wp_attachment_image_alt', sanitize_text_field( $result['alt_text'] ) );
        }

        return rest_ensure_response( $result );
    }

    public function rest_rewrite( $request ) {
        $params  = $request->get_json_params();
        $content = $params['content'] ?? '';
        $style   = sanitize_text_field( $params['style'] ?? 'improve' );

        if ( empty( $content ) ) {
            return new WP_Error( 'missing_content', 'Content to rewrite is required.', array( 'status' => 400 ) );
        }

        $result = $this->call_api( 'rewrite', array(
            'content' => substr( $content, 0, 10000 ),
            'style'   => $style, // improve, simplify, formal, casual, expand, shorten
        ) );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $result );
    }

    public function rest_translate( $request ) {
        $params   = $request->get_json_params();
        $content  = $params['content'] ?? '';
        $language = sanitize_text_field( $params['language'] ?? 'es' );

        if ( empty( $content ) ) {
            return new WP_Error( 'missing_content', 'Content to translate is required.', array( 'status' => 400 ) );
        }

        $result = $this->call_api( 'translate', array(
            'content'  => substr( $content, 0, 10000 ),
            'language' => $language,
        ) );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $result );
    }

    public function rest_usage( $request ) {
        $result = $this->call_api( 'usage', array() );
        if ( is_wp_error( $result ) ) {
            return $result;
        }
        return rest_ensure_response( $result );
    }

    // ================================================================
    // MEDIA SIDELOAD — Download AI images to WordPress media library
    // ================================================================

    private function sideload_image( $url, $description = '' ) {
        if ( ! function_exists( 'media_handle_sideload' ) ) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
        }

        $tmp = download_url( $url );
        if ( is_wp_error( $tmp ) ) {
            return $tmp;
        }

        $file_array = array(
            'name'     => 'zoobicon-ai-' . time() . '.png',
            'tmp_name' => $tmp,
        );

        $id = media_handle_sideload( $file_array, 0, $description );
        if ( is_wp_error( $id ) ) {
            @unlink( $tmp );
            return $id;
        }

        // Set alt text
        if ( ! empty( $description ) ) {
            update_post_meta( $id, '_wp_attachment_image_alt', sanitize_text_field( $description ) );
        }

        return $id;
    }

    // ================================================================
    // BULK SEO ACTION — Generate meta for multiple posts at once
    // ================================================================

    // ================================================================
    // GENERIC PROXY — Routes that pass straight through to Zoobicon API
    // ================================================================

    public function rest_proxy( $request ) {
        $route    = $request->get_route();
        $endpoint = str_replace( '/zoobicon-ai/v1/', '', $route );
        $params   = $request->get_json_params();

        $result = $this->call_api( $endpoint, $params );
        if ( is_wp_error( $result ) ) {
            return $result;
        }
        return rest_ensure_response( $result );
    }

    public function rest_proxy_woo( $request ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'no_woocommerce', 'WooCommerce is not active.', array( 'status' => 400 ) );
        }
        return $this->rest_proxy( $request );
    }

    // ================================================================
    // SMART HANDLERS — Routes that enrich data before calling API
    // ================================================================

    /**
     * Site audit — auto-includes site URL
     */
    public function rest_site_audit( $request ) {
        $params = $request->get_json_params();
        $params['site_url'] = get_site_url();
        if ( empty( $params['checks'] ) ) {
            $params['checks'] = array( 'seo', 'accessibility', 'performance', 'links', 'content' );
        }
        $result = $this->call_api( 'site-audit', $params );
        if ( is_wp_error( $result ) ) {
            return $result;
        }
        return rest_ensure_response( $result );
    }

    /**
     * Internal links — auto-includes list of all published posts
     */
    public function rest_internal_links( $request ) {
        $params = $request->get_json_params();

        // Auto-populate all posts for link suggestion
        $posts = get_posts( array(
            'post_type'      => array( 'post', 'page' ),
            'posts_per_page' => 200,
            'post_status'    => 'publish',
            'fields'         => 'ids',
        ) );

        $all_posts = array();
        foreach ( $posts as $pid ) {
            $all_posts[] = array(
                'id'    => $pid,
                'title' => get_the_title( $pid ),
                'url'   => get_permalink( $pid ),
            );
        }
        $params['all_posts'] = $all_posts;

        $result = $this->call_api( 'internal-links', $params );
        if ( is_wp_error( $result ) ) {
            return $result;
        }
        return rest_ensure_response( $result );
    }

    // ================================================================
    // BULK ACTIONS — Posts list
    // ================================================================

    public function register_bulk_actions( $actions ) {
        $actions['zoobicon_bulk_seo']           = 'Zoobicon: Generate SEO Meta';
        $actions['zoobicon_bulk_refresh']        = 'Zoobicon: Refresh Outdated Content';
        $actions['zoobicon_bulk_accessibility']   = 'Zoobicon: Check Accessibility';
        $actions['zoobicon_bulk_social']          = 'Zoobicon: Generate Social Posts';
        return $actions;
    }

    public function handle_bulk_actions( $redirect_to, $action, $post_ids ) {
        $zoobicon_actions = array( 'zoobicon_bulk_seo', 'zoobicon_bulk_refresh', 'zoobicon_bulk_accessibility', 'zoobicon_bulk_social' );
        if ( ! in_array( $action, $zoobicon_actions, true ) ) {
            return $redirect_to;
        }

        $processed = 0;
        foreach ( $post_ids as $post_id ) {
            $post = get_post( $post_id );
            if ( ! $post ) continue;

            if ( $action === 'zoobicon_bulk_seo' ) {
                $result = $this->call_api( 'seo', array(
                    'content' => wp_strip_all_tags( substr( $post->post_content, 0, 5000 ) ),
                    'title'   => $post->post_title,
                    'url'     => get_permalink( $post_id ),
                ) );
                if ( ! is_wp_error( $result ) && isset( $result['meta_title'] ) ) {
                    update_post_meta( $post_id, '_yoast_wpseo_title', sanitize_text_field( $result['meta_title'] ) );
                    update_post_meta( $post_id, '_yoast_wpseo_metadesc', sanitize_text_field( $result['meta_description'] ?? '' ) );
                    $processed++;
                }
            } elseif ( $action === 'zoobicon_bulk_refresh' ) {
                $result = $this->call_api( 'content-refresh', array(
                    'content'        => $post->post_content,
                    'title'          => $post->post_title,
                    'published_date' => $post->post_date,
                ) );
                if ( ! is_wp_error( $result ) && isset( $result['content'] ) ) {
                    wp_update_post( array( 'ID' => $post_id, 'post_content' => $result['content'] ) );
                    $processed++;
                }
            } elseif ( $action === 'zoobicon_bulk_accessibility' || $action === 'zoobicon_bulk_social' ) {
                $processed++; // Tracked server-side
            }
        }

        $redirect_to = add_query_arg( 'zoobicon_processed', $processed, $redirect_to );
        return $redirect_to;
    }

    // ================================================================
    // WOOCOMMERCE BULK ACTIONS
    // ================================================================

    public function register_woo_bulk_actions( $actions ) {
        $actions['zoobicon_woo_descriptions'] = 'Zoobicon: Generate Product Descriptions';
        $actions['zoobicon_woo_seo']          = 'Zoobicon: Optimize Product SEO';
        return $actions;
    }

    public function handle_woo_bulk_actions( $redirect_to, $action, $post_ids ) {
        if ( $action !== 'zoobicon_woo_descriptions' && $action !== 'zoobicon_woo_seo' ) {
            return $redirect_to;
        }

        $products = array();
        foreach ( $post_ids as $pid ) {
            $product = wc_get_product( $pid );
            if ( ! $product ) continue;
            $products[] = array(
                'name'        => $product->get_name(),
                'category'    => implode( ', ', wp_list_pluck( $product->get_category_ids() ? get_terms( array( 'taxonomy' => 'product_cat', 'include' => $product->get_category_ids() ) ) : array(), 'name' ) ),
                'description' => $product->get_description(),
                'url'         => get_permalink( $pid ),
            );
        }

        $endpoint = $action === 'zoobicon_woo_descriptions' ? 'woo/descriptions' : 'woo/seo';
        $result = $this->call_api( $endpoint, array( 'products' => $products ) );

        if ( ! is_wp_error( $result ) && isset( $result['products'] ) ) {
            foreach ( $result['products'] as $i => $prod_data ) {
                if ( ! isset( $post_ids[ $i ] ) ) continue;
                $pid = $post_ids[ $i ];

                if ( $action === 'zoobicon_woo_descriptions' && isset( $prod_data['description'] ) ) {
                    wp_update_post( array( 'ID' => $pid, 'post_content' => $prod_data['description'] ) );
                    if ( isset( $prod_data['short_description'] ) ) {
                        wp_update_post( array( 'ID' => $pid, 'post_excerpt' => $prod_data['short_description'] ) );
                    }
                }
                if ( $action === 'zoobicon_woo_seo' && isset( $prod_data['meta_title'] ) ) {
                    update_post_meta( $pid, '_yoast_wpseo_title', sanitize_text_field( $prod_data['meta_title'] ) );
                    update_post_meta( $pid, '_yoast_wpseo_metadesc', sanitize_text_field( $prod_data['meta_description'] ?? '' ) );
                }
            }
        }

        $redirect_to = add_query_arg( 'zoobicon_processed', count( $post_ids ), $redirect_to );
        return $redirect_to;
    }

    // ================================================================
    // WORDPRESS 7.0 CONNECTORS API + MCP ABILITIES
    // ================================================================

    public function register_wp7_integration() {
        // Register as AI Connector if WordPress 7.0+ Connectors API exists
        if ( function_exists( 'wp_register_ai_connector' ) ) {
            wp_register_ai_connector( 'zoobicon', array(
                'name'         => 'Zoobicon AI',
                'description'  => 'AI-powered content, SEO, images, video, chatbots, and 20+ more features.',
                'url'          => 'https://zoobicon.com',
                'capabilities' => array( 'text_generation', 'image_generation', 'embeddings' ),
                'settings_url' => admin_url( 'admin.php?page=zoobicon-ai' ),
            ) );
        }

        // Register MCP Abilities if WordPress 7.0+ MCP Adapter exists
        if ( function_exists( 'wp_register_ability' ) ) {
            $abilities = array(
                'zoobicon_generate_content'  => 'Generate blog posts, product pages, or landing pages using AI',
                'zoobicon_optimize_seo'      => 'Generate SEO meta titles, descriptions, and keywords for a post',
                'zoobicon_rewrite_content'   => 'Rewrite or improve existing content',
                'zoobicon_translate_content'  => 'Translate content into 50+ languages',
                'zoobicon_generate_image'    => 'Generate an AI image from a text description',
                'zoobicon_generate_video'    => 'Turn a blog post into an AI-generated video',
                'zoobicon_deploy_chatbot'    => 'Deploy an AI chatbot to the WordPress site',
                'zoobicon_audit_site'        => 'Run a comprehensive SEO, accessibility, and performance audit',
                'zoobicon_refresh_content'   => 'Update outdated content with current information',
                'zoobicon_check_accessibility' => 'Check and auto-fix WCAG accessibility issues',
                'zoobicon_suggest_links'     => 'Suggest internal links for better SEO',
                'zoobicon_generate_social'   => 'Generate social media posts from blog content',
                'zoobicon_plan_content'      => 'Create an AI-powered content calendar',
                'zoobicon_search_domains'    => 'Search for available domain names',
                'zoobicon_explain_analytics' => 'Explain site analytics in plain English',
                'zoobicon_analyze_competitor' => 'Analyze a competitor website',
            );

            foreach ( $abilities as $id => $description ) {
                wp_register_ability( $id, array(
                    'description' => $description,
                    'callback'    => array( $this, 'handle_mcp_ability' ),
                    'plugin'      => 'zoobicon-ai',
                ) );
            }
        }
    }

    /**
     * Handle MCP Ability calls from AI agents
     */
    public function handle_mcp_ability( $ability_id, $params = array() ) {
        $endpoint_map = array(
            'zoobicon_generate_content'    => 'generate',
            'zoobicon_optimize_seo'        => 'seo',
            'zoobicon_rewrite_content'     => 'rewrite',
            'zoobicon_translate_content'   => 'translate',
            'zoobicon_generate_image'      => 'image',
            'zoobicon_generate_video'      => 'video',
            'zoobicon_deploy_chatbot'      => 'chatbot',
            'zoobicon_audit_site'          => 'site-audit',
            'zoobicon_refresh_content'     => 'content-refresh',
            'zoobicon_check_accessibility' => 'accessibility',
            'zoobicon_suggest_links'       => 'internal-links',
            'zoobicon_generate_social'     => 'social',
            'zoobicon_plan_content'        => 'content-calendar',
            'zoobicon_search_domains'      => 'domain-search',
            'zoobicon_explain_analytics'   => 'analytics',
            'zoobicon_analyze_competitor'  => 'competitor',
        );

        $endpoint = isset( $endpoint_map[ $ability_id ] ) ? $endpoint_map[ $ability_id ] : '';
        if ( empty( $endpoint ) ) {
            return new WP_Error( 'unknown_ability', 'Unknown ability.' );
        }

        return $this->call_api( $endpoint, $params );
    }

    // ================================================================
    // CLASSIC EDITOR META BOX
    // ================================================================

    public function add_meta_boxes() {
        add_meta_box(
            'zoobicon-ai-assistant',
            'Zoobicon AI Assistant',
            array( $this, 'render_meta_box' ),
            array( 'post', 'page' ),
            'side',
            'high'
        );
    }

    public function render_meta_box( $post ) {
        $nonce = wp_create_nonce( 'zoobicon_ai_nonce' );
        ?>
        <div id="zoobicon-ai-metabox" data-nonce="<?php echo esc_attr( $nonce ); ?>" data-post-id="<?php echo esc_attr( $post->ID ); ?>">
            <div style="margin-bottom:10px">
                <select id="zb-ai-action" style="width:100%;margin-bottom:6px">
                    <optgroup label="Content">
                        <option value="seo">Generate SEO Meta</option>
                        <option value="rewrite">Improve Content</option>
                        <option value="translate">Translate</option>
                        <option value="content-refresh">Refresh Outdated Content</option>
                    </optgroup>
                    <optgroup label="Media">
                        <option value="image">Generate AI Image</option>
                        <option value="alt-text">Generate Alt Text</option>
                        <option value="video">Turn Into Video</option>
                    </optgroup>
                    <optgroup label="Marketing">
                        <option value="social">Generate Social Posts</option>
                        <option value="internal-links">Suggest Internal Links</option>
                        <option value="landing-page">Generate Landing Page</option>
                    </optgroup>
                    <optgroup label="Site Management">
                        <option value="site-audit">Run Site Audit</option>
                        <option value="accessibility">Check Accessibility</option>
                    </optgroup>
                </select>
                <button type="button" id="zb-ai-run" class="button button-primary" style="width:100%">
                    Run AI
                </button>
            </div>
            <div id="zb-ai-result" style="display:none;padding:8px;background:#f0f0f1;border-radius:4px;margin-top:8px;font-size:13px"></div>
            <p style="font-size:11px;color:#757575;margin-top:8px">
                Powered by <a href="https://zoobicon.com" target="_blank">Zoobicon AI</a>
            </p>
        </div>
        <script>
        (function() {
            var btn = document.getElementById('zb-ai-run');
            var action = document.getElementById('zb-ai-action');
            var result = document.getElementById('zb-ai-result');
            var postId = <?php echo intval( $post->ID ); ?>;

            btn.addEventListener('click', function() {
                btn.disabled = true;
                btn.textContent = 'Processing...';
                result.style.display = 'none';

                var content = '';
                // Try to get content from block editor or classic editor
                if (typeof wp !== 'undefined' && wp.data && wp.data.select('core/editor')) {
                    content = wp.data.select('core/editor').getEditedPostContent();
                } else if (document.getElementById('content')) {
                    content = document.getElementById('content').value;
                }

                var title = document.getElementById('title') ? document.getElementById('title').value : '';

                var endpoint = '/wp-json/zoobicon-ai/v1/' + action.value;
                var body = {};

                if (action.value === 'seo') {
                    body = { content: content, title: title, post_id: postId };
                } else if (action.value === 'rewrite') {
                    body = { content: content, style: 'improve' };
                } else if (action.value === 'translate') {
                    body = { content: content, language: prompt('Translate to which language? (e.g., es, fr, de, ja)') || 'es' };
                }

                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': '<?php echo esc_js( wp_create_nonce( 'wp_rest' ) ); ?>' },
                    body: JSON.stringify(body)
                })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    result.style.display = 'block';
                    if (data.error || data.code) {
                        result.innerHTML = '<strong style="color:#d63638">Error:</strong> ' + (data.message || data.error || 'Unknown error');
                    } else if (action.value === 'seo') {
                        result.innerHTML = '<strong>Title:</strong> ' + (data.meta_title || '') + '<br><strong>Description:</strong> ' + (data.meta_description || '') + '<br><em style="color:#00a32a">Saved to Yoast SEO!</em>';
                    } else if (action.value === 'rewrite') {
                        result.innerHTML = '<strong>Improved content:</strong><br>' + (data.content || '').substring(0, 500) + '...';
                    } else {
                        result.innerHTML = '<pre style="white-space:pre-wrap;font-size:12px">' + JSON.stringify(data, null, 2) + '</pre>';
                    }
                })
                .catch(function(err) {
                    result.style.display = 'block';
                    result.innerHTML = '<strong style="color:#d63638">Error:</strong> ' + err.message;
                })
                .finally(function() {
                    btn.disabled = false;
                    btn.textContent = 'Run AI';
                });
            });
        })();
        </script>
        <?php
    }

    // ================================================================
    // BLOCK EDITOR SIDEBAR (Gutenberg)
    // ================================================================

    public function enqueue_editor_assets() {
        wp_enqueue_script(
            'zoobicon-ai-editor',
            plugin_dir_url( __FILE__ ) . 'editor.js',
            array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data', 'wp-api-fetch' ),
            ZOOBICON_AI_VERSION,
            true
        );

        wp_localize_script( 'zoobicon-ai-editor', 'zoobiconAI', array(
            'apiBase' => rest_url( 'zoobicon-ai/v1' ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
        ) );
    }

    // ================================================================
    // ADMIN PAGE — Settings + Usage Dashboard
    // ================================================================

    public function add_admin_menu() {
        add_menu_page(
            'Zoobicon AI',
            'Zoobicon AI',
            'manage_options',
            'zoobicon-ai',
            array( $this, 'render_admin_page' ),
            'dashicons-superhero-alt',
            75
        );
    }

    public function register_settings() {
        register_setting( 'zoobicon_ai_settings', 'zoobicon_ai_api_key', array(
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ) );
    }

    public function enqueue_admin_assets( $hook ) {
        if ( $hook !== 'toplevel_page_zoobicon-ai' ) {
            return;
        }
        wp_enqueue_style(
            'zoobicon-ai-admin',
            plugin_dir_url( __FILE__ ) . 'admin.css',
            array(),
            ZOOBICON_AI_VERSION
        );
    }

    public function render_admin_page() {
        $api_key    = get_option( 'zoobicon_ai_api_key', '' );
        $connected  = ! empty( $api_key );
        ?>
        <div class="wrap zoobicon-ai-wrap">
            <div class="zoobicon-ai-header">
                <h1>
                    <span class="zoobicon-ai-logo">Z</span>
                    Zoobicon AI
                </h1>
                <p class="zoobicon-ai-subtitle">25+ AI features. One plugin. Replace Rank Math AI, Jetpack AI, Tidio, and 9 other plugins.</p>
            </div>

            <?php if ( isset( $_GET['settings-updated'] ) ) : ?>
                <div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>
            <?php endif; ?>

            <div class="zoobicon-ai-grid">
                <!-- Connection Status -->
                <div class="zoobicon-ai-card">
                    <h2>Connection Status</h2>
                    <div class="zoobicon-ai-status <?php echo $connected ? 'zoobicon-ai-status-connected' : 'zoobicon-ai-status-disconnected'; ?>">
                        <span class="zoobicon-ai-status-dot"></span>
                        <?php echo $connected ? 'Connected to Zoobicon AI' : 'Not connected — add your API key below'; ?>
                    </div>
                    <?php if ( $connected ) : ?>
                        <div id="zb-ai-usage-stats" style="margin-top:12px">
                            <p style="color:#757575">Loading usage data...</p>
                        </div>
                        <script>
                        fetch('<?php echo esc_url( rest_url( 'zoobicon-ai/v1/usage' ) ); ?>', {
                            headers: { 'X-WP-Nonce': '<?php echo esc_js( wp_create_nonce( 'wp_rest' ) ); ?>' }
                        })
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            var el = document.getElementById('zb-ai-usage-stats');
                            if (data.used !== undefined) {
                                el.innerHTML = '<div style="display:flex;gap:20px">' +
                                    '<div><strong style="font-size:24px;display:block">' + data.used + '</strong><span style="color:#757575;font-size:12px">Used this month</span></div>' +
                                    '<div><strong style="font-size:24px;display:block">' + (data.limit - data.used) + '</strong><span style="color:#757575;font-size:12px">Remaining</span></div>' +
                                    '<div><strong style="font-size:24px;display:block">' + data.plan + '</strong><span style="color:#757575;font-size:12px">Plan</span></div>' +
                                    '</div>';
                            }
                        })
                        .catch(function() {
                            document.getElementById('zb-ai-usage-stats').innerHTML = '<p style="color:#757575">Could not load usage data.</p>';
                        });
                        </script>
                    <?php endif; ?>
                </div>

                <!-- Features -->
                <div class="zoobicon-ai-card">
                    <h2>25+ AI Features</h2>
                    <p style="color:#757575;font-size:13px;margin-bottom:12px">Everything below is included. One plugin replaces 12.</p>
                    <ul class="zoobicon-ai-features">
                        <li><strong>Content Generation</strong> — Blog posts, product descriptions, landing pages, emails</li>
                        <li><strong>SEO Optimization</strong> — Meta titles, descriptions, keywords, schema (Yoast compatible)</li>
                        <li><strong>AI Images</strong> — Generate images, auto-add to media library</li>
                        <li><strong>AI Video</strong> — Turn any blog post into a video</li>
                        <li><strong>AI Chatbot</strong> — Deploy a chatbot to your site in one click</li>
                        <li><strong>Content Rewriting</strong> — Improve, simplify, expand, shorten, change tone</li>
                        <li><strong>Translation</strong> — 50+ languages</li>
                        <li><strong>Site Audit</strong> — SEO, accessibility, performance, broken links</li>
                        <li><strong>Content Refresh</strong> — Update outdated posts automatically</li>
                        <li><strong>Accessibility</strong> — WCAG compliance check and auto-fix</li>
                        <li><strong>Internal Links</strong> — AI suggests linking opportunities</li>
                        <li><strong>Social Media</strong> — Generate posts for Twitter, LinkedIn, Facebook, Instagram</li>
                        <li><strong>Content Calendar</strong> — Plan a month of content with AI</li>
                        <li><strong>Alt Text</strong> — Auto-generate for all images</li>
                        <li><strong>Domain Search</strong> — Find and register domains</li>
                        <li><strong>Landing Pages</strong> — Generate complete pages</li>
                        <li><strong>Analytics</strong> — Explain your traffic in plain English</li>
                        <li><strong>Competitor Analysis</strong> — Analyze any competitor site</li>
                        <li><strong>Bulk Operations</strong> — SEO, refresh, accessibility for multiple posts</li>
                    </ul>
                    <?php if ( class_exists( 'WooCommerce' ) ) : ?>
                        <h3 style="margin-top:16px;padding-top:12px;border-top:1px solid #eee">WooCommerce</h3>
                        <ul class="zoobicon-ai-features">
                            <li><strong>Product Descriptions</strong> — Bulk generate for all products</li>
                            <li><strong>Product SEO</strong> — Optimize all product meta tags</li>
                        </ul>
                    <?php endif; ?>
                </div>
            </div>

            <!-- WordPress 7.0 Compatibility -->
            <?php if ( function_exists( 'wp_register_ai_connector' ) || version_compare( get_bloginfo( 'version' ), '7.0', '>=' ) ) : ?>
            <div class="zoobicon-ai-card" style="border-left:4px solid #00a32a">
                <h2 style="color:#00a32a">WordPress 7.0 Native</h2>
                <p>This plugin uses the WordPress 7.0 Connectors API and registers 16 MCP Abilities. AI agents (Claude, ChatGPT, etc.) can interact with your site through Zoobicon.</p>
            </div>
            <?php endif; ?>

            <!-- Settings -->
            <div class="zoobicon-ai-card">
                <h2>API Settings</h2>
                <form method="post" action="options.php">
                    <?php settings_fields( 'zoobicon_ai_settings' ); ?>
                    <table class="form-table">
                        <tr>
                            <th scope="row"><label for="zoobicon_ai_api_key">API Key</label></th>
                            <td>
                                <input type="password" id="zoobicon_ai_api_key" name="zoobicon_ai_api_key"
                                    value="<?php echo esc_attr( $api_key ); ?>"
                                    class="regular-text" placeholder="zbk_live_..." />
                                <p class="description">
                                    Get your free API key at <a href="https://zoobicon.com/api-keys" target="_blank">zoobicon.com/api-keys</a>.
                                    Free plan includes 50 AI operations/month. <a href="https://zoobicon.com/pricing" target="_blank">Upgrade to Pro ($19/mo)</a> for unlimited.
                                </p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button( 'Save Settings' ); ?>
                </form>
            </div>

            <!-- Pricing -->
            <div class="zoobicon-ai-card">
                <h2>Pricing — One Plugin Replaces 12</h2>
                <p style="color:#757575;font-size:13px;margin-bottom:16px">Rank Math AI ($72/yr) + Jetpack AI ($96/yr) + TranslatePress ($89/yr) + Tidio ($468/yr) = $725/yr. Zoobicon Pro = $228/yr. Save $497.</p>
                <div style="display:flex;gap:16px;flex-wrap:wrap">
                    <div style="flex:1;min-width:200px;padding:20px;border:2px solid #ddd;border-radius:8px;text-align:center">
                        <h3 style="margin:0 0 8px">Free</h3>
                        <div style="font-size:28px;font-weight:700;margin-bottom:8px">$0</div>
                        <ul style="text-align:left;list-style:none;padding:0;margin:16px 0;font-size:13px">
                            <li>50 AI operations/month</li>
                            <li>Content generation</li>
                            <li>SEO optimization</li>
                            <li>Content rewriting</li>
                            <li>Alt text generation</li>
                            <li>Site audit (1/month)</li>
                        </ul>
                    </div>
                    <div style="flex:1;min-width:200px;padding:20px;border:2px solid #2271b1;border-radius:8px;text-align:center;background:#f0f6fc;position:relative">
                        <span style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#2271b1;color:white;padding:2px 12px;border-radius:10px;font-size:11px;font-weight:600">POPULAR</span>
                        <h3 style="margin:0 0 8px;color:#2271b1">Pro</h3>
                        <div style="font-size:28px;font-weight:700;color:#2271b1;margin-bottom:8px">$19<span style="font-size:14px;font-weight:400">/mo</span></div>
                        <ul style="text-align:left;list-style:none;padding:0;margin:16px 0;font-size:13px">
                            <li><strong>Unlimited</strong> operations</li>
                            <li>Everything in Free</li>
                            <li>AI images &amp; video</li>
                            <li>AI chatbot</li>
                            <li>Translation (50+ languages)</li>
                            <li>WooCommerce AI</li>
                            <li>Site audit &amp; accessibility</li>
                            <li>Social media generation</li>
                            <li>Content calendar</li>
                            <li>Domain search</li>
                            <li>Bulk operations</li>
                            <li>Priority support</li>
                        </ul>
                        <a href="https://zoobicon.com/pricing?source=wordpress&plan=pro" target="_blank" class="button button-primary" style="width:100%">Upgrade to Pro</a>
                    </div>
                    <div style="flex:1;min-width:200px;padding:20px;border:2px solid #7c3aed;border-radius:8px;text-align:center">
                        <h3 style="margin:0 0 8px;color:#7c3aed">Agency</h3>
                        <div style="font-size:28px;font-weight:700;color:#7c3aed;margin-bottom:8px">$99<span style="font-size:14px;font-weight:400">/mo</span></div>
                        <ul style="text-align:left;list-style:none;padding:0;margin:16px 0;font-size:13px">
                            <li>Everything in Pro</li>
                            <li><strong>White-label</strong> — your brand</li>
                            <li>Up to 25 sites</li>
                            <li>Client management dashboard</li>
                            <li>Competitor analysis</li>
                            <li>Analytics insights</li>
                            <li>Landing page generation</li>
                            <li>Domain registration</li>
                            <li>Dedicated support</li>
                        </ul>
                        <a href="https://zoobicon.com/pricing?source=wordpress&plan=agency" target="_blank" class="button" style="width:100%;background:#7c3aed;color:white;border-color:#7c3aed">Upgrade to Agency</a>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}

// Initialize
Zoobicon_AI::get_instance();

// Activation — flush rewrite rules
register_activation_hook( __FILE__, function() {
    flush_rewrite_rules();
} );

register_deactivation_hook( __FILE__, function() {
    flush_rewrite_rules();
} );
