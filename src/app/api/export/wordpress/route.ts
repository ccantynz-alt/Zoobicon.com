import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const WP_CONVERSION_PROMPT = `You are an expert WordPress theme developer. Given an HTML document, convert it into a complete WordPress theme by splitting it into proper template parts.

You MUST return a valid JSON object with this exact structure (no markdown, no code fences, ONLY JSON):

{
  "style_css": "The complete style.css file content with WordPress theme header comment block",
  "index_php": "The main index.php template file",
  "functions_php": "The functions.php file with theme setup, enqueue styles, register menus and widget areas",
  "header_php": "The header.php template part with <!DOCTYPE html>, <head>, wp_head(), and opening body/header markup",
  "footer_php": "The footer.php template part with footer markup, wp_footer(), and closing tags",
  "page_php": "The page.php template for static pages",
  "pages": [{"title": "Page Title", "slug": "page-slug", "content": "Page HTML content"}],
  "menu_items": [{"title": "Menu Label", "url": "/page-slug"}]
}

Rules for the conversion:
- style.css MUST start with a WordPress theme header comment: /* Theme Name: ..., Theme URI: ..., Author: ..., Description: ..., Version: 1.0.0, etc. */
- Move ALL CSS into style.css (remove from inline <style> tags)
- header.php must include: <!DOCTYPE html>, <html <?php language_attributes(); ?>>, <head>, <meta charset="<?php bloginfo('charset'); ?>">, wp_head(), navigation using wp_nav_menu()
- footer.php must include: wp_footer() before </body>, closing </html>
- index.php must use get_header() and get_footer(), and include The Loop
- page.php must use get_header(), get_footer(), and the_content()
- functions.php must: add_theme_support for title-tag, post-thumbnails, html5; register_nav_menus; register_sidebar; wp_enqueue_style for the theme stylesheet
- Extract logical page sections from the HTML as separate pages
- Extract navigation links as menu items
- Keep all styling intact - the theme should look identical to the original HTML
- Use proper WordPress template tags throughout (bloginfo, the_title, the_content, etc.)
- Include proper escaping with esc_html, esc_url, esc_attr where appropriate`;

export async function POST(req: NextRequest) {
  try {
    const { code, siteName, siteDescription } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "HTML code is required" },
        { status: 400 }
      );
    }

    if (!siteName || typeof siteName !== "string") {
      return NextResponse.json(
        { error: "Site name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: WP_CONVERSION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Convert this HTML into a WordPress theme called "${siteName}"${siteDescription ? ` with description: "${siteDescription}"` : ""}.\n\nHTML:\n${code}`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response into WordPress theme structure" },
        { status: 500 }
      );
    }

    const themeSlug = siteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const themeFiles: Record<string, string> = {
      "style.css": parsed.style_css || generateFallbackStyleCSS(siteName, siteDescription, themeSlug),
      "index.php": parsed.index_php || generateFallbackIndexPHP(),
      "functions.php": parsed.functions_php || generateFallbackFunctionsPHP(siteName, themeSlug),
      "header.php": parsed.header_php || generateFallbackHeaderPHP(siteName),
      "footer.php": parsed.footer_php || generateFallbackFooterPHP(siteName),
      "page.php": parsed.page_php || generateFallbackPagePHP(),
      "README.txt": generateReadme(siteName, themeSlug),
    };

    const pages = parsed.pages || [];
    const menuItems = parsed.menu_items || [];
    const wxrXml = generateWXR(siteName, siteDescription || "", pages, menuItems);

    const instructions = [
      `1. Download the theme ZIP file containing all theme files.`,
      `2. In your WordPress admin, go to Appearance → Themes → Add New → Upload Theme.`,
      `3. Upload the ZIP file and click "Install Now".`,
      `4. Click "Activate" to make "${siteName}" your active theme.`,
      `5. To import your content, go to Tools → Import → WordPress.`,
      `6. If the WordPress Importer is not installed, click "Install Now" then "Run Importer".`,
      `7. Upload the WXR XML file and click "Upload file and import".`,
      `8. Assign imported content to an existing user or create a new one.`,
      `9. Go to Appearance → Menus to verify your navigation menu was imported correctly.`,
      `10. Go to Settings → Reading and set your homepage to a static page if desired.`,
      `11. Visit your site to confirm everything looks correct.`,
    ];

    return NextResponse.json({
      themeFiles,
      wxrXml,
      instructions,
    });
  } catch (error) {
    console.error("WordPress export error:", error);
    return NextResponse.json(
      { error: "Failed to generate WordPress theme" },
      { status: 500 }
    );
  }
}

function generateWXR(
  siteName: string,
  siteDescription: string,
  pages: Array<{ title: string; slug: string; content: string }>,
  menuItems: Array<{ title: string; url: string }>
): string {
  const now = new Date();
  const dateStr = now.toISOString().replace("T", " ").substring(0, 19);
  const pubDate = now.toUTCString();

  let pagesXml = "";
  pages.forEach((page, i) => {
    pagesXml += `
    <item>
      <title><![CDATA[${page.title}]]></title>
      <link>http://localhost/${page.slug}</link>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[admin]]></dc:creator>
      <content:encoded><![CDATA[${page.content}]]></content:encoded>
      <excerpt:encoded><![CDATA[]]></excerpt:encoded>
      <wp:post_id>${i + 2}</wp:post_id>
      <wp:post_date><![CDATA[${dateStr}]]></wp:post_date>
      <wp:post_date_gmt><![CDATA[${dateStr}]]></wp:post_date_gmt>
      <wp:post_modified><![CDATA[${dateStr}]]></wp:post_modified>
      <wp:post_modified_gmt><![CDATA[${dateStr}]]></wp:post_modified_gmt>
      <wp:comment_status><![CDATA[closed]]></wp:comment_status>
      <wp:ping_status><![CDATA[closed]]></wp:ping_status>
      <wp:post_name><![CDATA[${page.slug}]]></wp:post_name>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_parent>0</wp:post_parent>
      <wp:menu_order>${i}</wp:menu_order>
      <wp:post_type><![CDATA[page]]></wp:post_type>
      <wp:post_password><![CDATA[]]></wp:post_password>
      <wp:is_sticky>0</wp:is_sticky>
    </item>`;
  });

  let menuXml = "";
  menuItems.forEach((item, i) => {
    menuXml += `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>http://localhost/</link>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[admin]]></dc:creator>
      <content:encoded><![CDATA[]]></content:encoded>
      <excerpt:encoded><![CDATA[]]></excerpt:encoded>
      <wp:post_id>${pages.length + i + 100}</wp:post_id>
      <wp:post_date><![CDATA[${dateStr}]]></wp:post_date>
      <wp:post_date_gmt><![CDATA[${dateStr}]]></wp:post_date_gmt>
      <wp:post_modified><![CDATA[${dateStr}]]></wp:post_modified>
      <wp:post_modified_gmt><![CDATA[${dateStr}]]></wp:post_modified_gmt>
      <wp:comment_status><![CDATA[closed]]></wp:comment_status>
      <wp:ping_status><![CDATA[closed]]></wp:ping_status>
      <wp:post_name><![CDATA[menu-item-${i + 1}]]></wp:post_name>
      <wp:status><![CDATA[publish]]></wp:status>
      <wp:post_parent>0</wp:post_parent>
      <wp:menu_order>${i + 1}</wp:menu_order>
      <wp:post_type><![CDATA[nav_menu_item]]></wp:post_type>
      <wp:post_password><![CDATA[]]></wp:post_password>
      <wp:is_sticky>0</wp:is_sticky>
      <wp:postmeta>
        <wp:meta_key><![CDATA[_menu_item_type]]></wp:meta_key>
        <wp:meta_value><![CDATA[custom]]></wp:meta_value>
      </wp:postmeta>
      <wp:postmeta>
        <wp:meta_key><![CDATA[_menu_item_url]]></wp:meta_key>
        <wp:meta_value><![CDATA[${item.url}]]></wp:meta_value>
      </wp:postmeta>
      <wp:postmeta>
        <wp:meta_key><![CDATA[_menu_item_menu_item_parent]]></wp:meta_key>
        <wp:meta_value><![CDATA[0]]></wp:meta_value>
      </wp:postmeta>
      <wp:postmeta>
        <wp:meta_key><![CDATA[_menu_item_object_id]]></wp:meta_key>
        <wp:meta_value><![CDATA[${pages.length + i + 100}]]></wp:meta_value>
      </wp:postmeta>
      <wp:postmeta>
        <wp:meta_key><![CDATA[_menu_item_object]]></wp:meta_key>
        <wp:meta_value><![CDATA[custom]]></wp:meta_value>
      </wp:postmeta>
      <wp:postmeta>
        <wp:meta_key><![CDATA[_menu_item_target]]></wp:meta_key>
        <wp:meta_value><![CDATA[]]></wp:meta_value>
      </wp:postmeta>
      <category domain="nav_menu" nicename="primary-menu"><![CDATA[Primary Menu]]></category>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
  <channel>
    <title><![CDATA[${siteName}]]></title>
    <link>http://localhost</link>
    <description><![CDATA[${siteDescription}]]></description>
    <pubDate>${pubDate}</pubDate>
    <language>en-US</language>
    <wp:wxr_version>1.2</wp:wxr_version>
    <wp:base_site_url>http://localhost</wp:base_site_url>
    <wp:base_blog_url>http://localhost</wp:base_blog_url>

    <wp:author>
      <wp:author_id>1</wp:author_id>
      <wp:author_login><![CDATA[admin]]></wp:author_login>
      <wp:author_email><![CDATA[admin@example.com]]></wp:author_email>
      <wp:author_display_name><![CDATA[Admin]]></wp:author_display_name>
    </wp:author>

    <wp:term>
      <wp:term_id>2</wp:term_id>
      <wp:term_taxonomy><![CDATA[nav_menu]]></wp:term_taxonomy>
      <wp:term_slug><![CDATA[primary-menu]]></wp:term_slug>
      <wp:term_name><![CDATA[Primary Menu]]></wp:term_name>
    </wp:term>
${pagesXml}
${menuXml}
  </channel>
</rss>`;
}

function generateFallbackStyleCSS(
  siteName: string,
  siteDescription: string | undefined,
  themeSlug: string
): string {
  return `/*
Theme Name: ${siteName}
Theme URI: https://example.com/${themeSlug}
Author: Zoobicon
Author URI: https://zoobicon.com
Description: ${siteDescription || `Custom theme generated from ${siteName}`}
Version: 1.0.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: ${themeSlug}
*/

/* Reset & Base Styles */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; }
`;
}

function generateFallbackIndexPHP(): string {
  return `<?php get_header(); ?>

<main id="main-content" role="main">
  <?php if ( have_posts() ) : ?>
    <?php while ( have_posts() ) : the_post(); ?>
      <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
        <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
        <div class="entry-content">
          <?php the_content(); ?>
        </div>
      </article>
    <?php endwhile; ?>
    <?php the_posts_navigation(); ?>
  <?php else : ?>
    <p><?php esc_html_e( 'No content found.', 'theme' ); ?></p>
  <?php endif; ?>
</main>

<?php get_footer(); ?>
`;
}

function generateFallbackFunctionsPHP(siteName: string, themeSlug: string): string {
  return `<?php
/**
 * ${siteName} Theme Functions
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function ${themeSlug.replace(/-/g, "_")}_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array(
        'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'
    ) );
    add_theme_support( 'custom-logo' );
    add_theme_support( 'customize-selective-refresh-widgets' );

    register_nav_menus( array(
        'primary' => esc_html__( 'Primary Menu', '${themeSlug}' ),
        'footer'  => esc_html__( 'Footer Menu', '${themeSlug}' ),
    ) );
}
add_action( 'after_setup_theme', '${themeSlug.replace(/-/g, "_")}_setup' );

function ${themeSlug.replace(/-/g, "_")}_scripts() {
    wp_enqueue_style( '${themeSlug}-style', get_stylesheet_uri(), array(), '1.0.0' );
}
add_action( 'wp_enqueue_scripts', '${themeSlug.replace(/-/g, "_")}_scripts' );

function ${themeSlug.replace(/-/g, "_")}_widgets_init() {
    register_sidebar( array(
        'name'          => esc_html__( 'Sidebar', '${themeSlug}' ),
        'id'            => 'sidebar-1',
        'description'   => esc_html__( 'Add widgets here.', '${themeSlug}' ),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ) );

    register_sidebar( array(
        'name'          => esc_html__( 'Footer Widget Area', '${themeSlug}' ),
        'id'            => 'footer-1',
        'description'   => esc_html__( 'Add footer widgets here.', '${themeSlug}' ),
        'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="footer-widget-title">',
        'after_title'   => '</h3>',
    ) );
}
add_action( 'widgets_init', '${themeSlug.replace(/-/g, "_")}_widgets_init' );
`;
}

function generateFallbackHeaderPHP(siteName: string): string {
  return `<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header id="site-header" role="banner">
    <div class="site-branding">
        <?php if ( has_custom_logo() ) : ?>
            <?php the_custom_logo(); ?>
        <?php else : ?>
            <h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a></h1>
        <?php endif; ?>
        <?php
        $description = get_bloginfo( 'description', 'display' );
        if ( $description || is_customize_preview() ) : ?>
            <p class="site-description"><?php echo esc_html( $description ); ?></p>
        <?php endif; ?>
    </div>

    <nav id="site-navigation" role="navigation" aria-label="<?php esc_attr_e( 'Primary Menu', 'theme' ); ?>">
        <?php
        wp_nav_menu( array(
            'theme_location' => 'primary',
            'menu_id'        => 'primary-menu',
            'container'      => false,
            'fallback_cb'    => false,
        ) );
        ?>
    </nav>
</header>
`;
}

function generateFallbackFooterPHP(siteName: string): string {
  return `<footer id="site-footer" role="contentinfo">
    <div class="footer-content">
        <?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
            <div class="footer-widgets">
                <?php dynamic_sidebar( 'footer-1' ); ?>
            </div>
        <?php endif; ?>
        <div class="footer-info">
            <p>&copy; <?php echo esc_html( date( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. All rights reserved.</p>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
`;
}

function generateFallbackPagePHP(): string {
  return `<?php get_header(); ?>

<main id="main-content" role="main">
  <?php while ( have_posts() ) : the_post(); ?>
    <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
      <header class="entry-header">
        <h1 class="entry-title"><?php the_title(); ?></h1>
      </header>
      <div class="entry-content">
        <?php the_content(); ?>
      </div>
    </article>
  <?php endwhile; ?>
</main>

<?php get_footer(); ?>
`;
}

function generateReadme(siteName: string, themeSlug: string): string {
  return `=== ${siteName} ===

Theme generated by Zoobicon (https://zoobicon.com)

== Description ==

Custom WordPress theme "${siteName}" generated from an HTML design using Zoobicon's AI-powered website builder.

== Installation ==

1. Download the theme ZIP file.
2. In WordPress admin, go to Appearance → Themes → Add New → Upload Theme.
3. Upload the ZIP file and click "Install Now".
4. Activate the theme.

== Content Import ==

1. Go to Tools → Import → WordPress.
2. Install the WordPress Importer plugin if prompted.
3. Upload the provided WXR XML file.
4. Map imported authors to existing users.
5. Check "Download and import file attachments" if desired.

== After Installation ==

1. Go to Appearance → Menus and assign the "Primary Menu" to the Primary location.
2. Go to Settings → Reading to set your homepage.
3. Go to Appearance → Customize to adjust site identity and other settings.

== Theme Structure ==

- style.css       - Main stylesheet with theme header
- index.php       - Main template (The Loop)
- header.php      - Header template part (wp_head, navigation)
- footer.php      - Footer template part (wp_footer)
- page.php        - Static page template
- functions.php   - Theme setup, scripts, menus, and widgets

== License ==

GNU General Public License v2 or later
http://www.gnu.org/licenses/gpl-2.0.html
`;
}
