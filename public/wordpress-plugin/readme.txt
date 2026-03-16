=== Zoobicon Connect ===
Contributors: zoobicon
Tags: ai, website builder, deploy, page builder, zoobicon
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Deploy AI-generated websites from Zoobicon.com directly to your WordPress site.

== Description ==

Zoobicon Connect bridges the Zoobicon AI website builder with your WordPress installation. Generate stunning websites with AI, then deploy them as WordPress pages with one click.

**How it works:**

1. Install and activate Zoobicon Connect on your WordPress site
2. Copy your auto-generated Connect Key from the plugin settings
3. In the Zoobicon Builder (zoobicon.com/builder), click Export → WordPress → Deploy
4. Enter your WordPress site URL and Connect Key
5. Click Deploy — your AI-generated page is now live on WordPress

**Features:**

* One-click deployment from Zoobicon Builder to WordPress
* Automatic page creation with proper formatting
* Update existing pages without losing WordPress settings
* Full HTML + CSS preserved (styles embedded inline)
* SEO meta support (title, description, OG image)
* Yoast SEO compatibility (auto-fills Yoast fields)
* Deploy as draft, published, pending, or private
* Deployment history in WordPress admin
* Deploy as pages or posts
* Secure authentication via Connect Key
* REST API for programmatic deployments

**For Agencies:**

Zoobicon Connect is perfect for agencies using the Zoobicon Agency Platform. Generate client websites with AI, apply white-label branding, then deploy directly to each client's WordPress site. No manual file transfers, no FTP, no copy-pasting HTML.

== Installation ==

1. Upload `zoobicon-connect.php` to `/wp-content/plugins/zoobicon-connect/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to the 'Zoobicon' menu item in your admin sidebar
4. Copy your Connect Key
5. Use it in Zoobicon Builder when deploying to WordPress

== Frequently Asked Questions ==

= Do I need a Zoobicon account? =

Yes. Sign up for free at zoobicon.com to use the AI website builder.

= Does this modify my WordPress theme? =

No. Zoobicon Connect creates standard WordPress pages/posts with embedded styles. Your theme remains unchanged.

= Can I edit deployed pages in WordPress? =

Yes! Deployed pages are standard WordPress content. Edit them in the block editor, classic editor, or any page builder.

= Is the Connect Key secure? =

The Connect Key is a random 48-character hex string generated locally on your WordPress site. It never leaves your server unless you copy it. All deployments are authenticated with this key via HTTPS.

= Can I deploy to multiple sites? =

Yes. Each WordPress site has its own Connect Key. In the Zoobicon Builder, you can save multiple WordPress site connections.

== Changelog ==

= 1.0.0 =
* Initial release
* REST API deploy endpoint
* Admin settings page with Connect Key management
* Deployment history log
* SEO meta support with Yoast compatibility
* Page/post support with status control

== Upgrade Notice ==

= 1.0.0 =
Initial release of Zoobicon Connect.
