/**
 * Zoobicon AI v2.0.0 — Gutenberg Block Editor Sidebar
 *
 * 25+ AI features organized into 6 panels:
 * 1. Content Creation — Generate, Rewrite, Content Calendar, Content Refresh
 * 2. SEO & Marketing — SEO Optimize, Internal Links, Social Media, Competitor Analysis
 * 3. Media — AI Images, AI Video, Alt Text
 * 4. Site Management — Site Audit, Accessibility, Analytics Explainer
 * 5. WooCommerce — Product Descriptions, Product SEO
 * 6. Platform — AI Chatbot, Domain Search, Landing Pages, Translate
 */
(function (wp) {
    var el = wp.element.createElement;
    var Fragment = wp.element.Fragment;
    var useState = wp.element.useState;
    var PluginSidebar = wp.editPost.PluginSidebar;
    var PluginSidebarMoreMenuItem = wp.editPost.PluginSidebarMoreMenuItem;
    var PanelBody = wp.components.PanelBody;
    var Button = wp.components.Button;
    var TextControl = wp.components.TextControl;
    var SelectControl = wp.components.SelectControl;
    var TextareaControl = wp.components.TextareaControl;
    var ToggleControl = wp.components.ToggleControl;
    var Notice = wp.components.Notice;
    var Spinner = wp.components.Spinner;
    var apiFetch = wp.apiFetch;
    var select = wp.data.select;
    var dispatch = wp.data.dispatch;

    /* ── Icon ── */
    var ICON = el('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
        el('path', { d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' })
    );

    /* ── Styles ── */
    var styles = {
        panel: { padding: '0 4px' },
        actionBtn: { width: '100%', justifyContent: 'center', marginTop: 8, marginBottom: 4 },
        resultBox: { marginTop: 12, padding: 12, background: '#f0f6fc', borderRadius: 6, fontSize: 13, lineHeight: 1.5, maxHeight: 400, overflowY: 'auto' },
        errorBox: { marginTop: 12 },
        label: { fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#1e40af', marginBottom: 8, display: 'block' },
        separator: { borderTop: '1px solid #e2e8f0', margin: '12px 0' },
        badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, marginLeft: 6 },
        badgePro: { background: '#dbeafe', color: '#1e40af' },
        badgeFree: { background: '#dcfce7', color: '#166534' },
        insertBtn: { marginTop: 8, width: '100%', justifyContent: 'center' },
        previewText: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 },
        sectionTitle: { fontSize: 13, fontWeight: 600, margin: '8px 0 4px' },
        kvRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' },
        kvLabel: { fontWeight: 500, color: '#475569' },
        kvValue: { color: '#1e293b', textAlign: 'right', maxWidth: '60%' },
    };

    /* ── Helpers ── */
    function getPostContent() {
        try { return select('core/editor').getEditedPostContent() || ''; } catch (e) { return ''; }
    }
    function getPostTitle() {
        try { return select('core/editor').getEditedPostAttribute('title') || ''; } catch (e) { return ''; }
    }
    function getPostId() {
        try { return select('core/editor').getCurrentPostId() || 0; } catch (e) { return 0; }
    }
    function insertContent(content) {
        if (content) {
            try {
                dispatch('core/editor').resetEditorBlocks(wp.blocks.parse(content));
            } catch (e) {
                console.error('Zoobicon: Could not insert content', e);
            }
        }
    }
    function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
    }

    /* ── Badge component ── */
    function Badge(props) {
        var s = props.pro ? Object.assign({}, styles.badge, styles.badgePro) : Object.assign({}, styles.badge, styles.badgeFree);
        return el('span', { style: s }, props.pro ? 'PRO' : 'FREE');
    }

    /* ── Result renderer ── */
    function ResultBox(props) {
        if (!props.data) return null;
        return el('div', { style: styles.resultBox }, props.children);
    }

    /* ── Key-value display row ── */
    function KV(props) {
        return el('div', { style: styles.kvRow },
            el('span', { style: styles.kvLabel }, props.label),
            el('span', { style: styles.kvValue }, props.value || '—')
        );
    }

    /* ── Generic action hook ── */
    function useAction() {
        var _l = useState(false), loading = _l[0], setLoading = _l[1];
        var _r = useState(null), result = _r[0], setResult = _r[1];
        var _e = useState(null), error = _e[0], setError = _e[1];

        function run(endpoint, body) {
            setLoading(true);
            setError(null);
            setResult(null);
            apiFetch({ path: endpoint, method: 'POST', data: body })
                .then(function (data) { setResult(data); setLoading(false); })
                .catch(function (err) { setError(err.message || 'Something went wrong'); setLoading(false); });
        }

        function reset() { setResult(null); setError(null); }

        return { loading: loading, result: result, error: error, run: run, reset: reset };
    }

    /* ── Action Button ── */
    function ActionButton(props) {
        return el(Button, {
            isPrimary: true,
            isBusy: props.loading,
            disabled: props.loading || props.disabled,
            onClick: props.onClick,
            style: styles.actionBtn,
        }, props.loading ? el(Fragment, null, el(Spinner, null), ' Working...') : props.label);
    }

    /* ── Error display ── */
    function ErrorNotice(props) {
        if (!props.error) return null;
        return el(Notice, { status: 'error', isDismissible: false, style: styles.errorBox }, props.error);
    }

    /* ====================================================================
     * PANEL 1 — CONTENT CREATION
     * ==================================================================== */
    function ContentCreationPanel() {
        var _m = useState('generate'), mode = _m[0], setMode = _m[1];
        var _p = useState(''), prompt = _p[0], setPrompt = _p[1];
        var _t = useState('professional'), tone = _t[0], setTone = _t[1];
        var _rs = useState('improve'), rewriteStyle = _rs[0], setRewriteStyle = _rs[1];
        var _w = useState('4'), weeks = _w[0], setWeeks = _w[1];
        var _pw = useState('2'), postsPerWeek = _pw[0], setPostsPerWeek = _pw[1];
        var action = useAction();

        function run() {
            switch (mode) {
                case 'generate':
                    action.run('/zoobicon-ai/v1/generate', { type: 'blog_post', prompt: prompt, tone: tone, length: 'medium' });
                    break;
                case 'rewrite':
                    action.run('/zoobicon-ai/v1/rewrite', { content: getPostContent(), style: rewriteStyle });
                    break;
                case 'calendar':
                    action.run('/zoobicon-ai/v1/content-calendar', { niche: prompt, weeks: parseInt(weeks), posts_per_week: parseInt(postsPerWeek) });
                    break;
                case 'refresh':
                    action.run('/zoobicon-ai/v1/content-refresh', { content: getPostContent(), title: getPostTitle() });
                    break;
            }
        }

        return el(PanelBody, { title: 'Content Creation', initialOpen: true, icon: 'edit' },
            el(SelectControl, {
                value: mode,
                options: [
                    { label: 'Generate Content', value: 'generate' },
                    { label: 'Rewrite Content', value: 'rewrite' },
                    { label: 'Content Calendar', value: 'calendar' },
                    { label: 'Refresh Outdated Content', value: 'refresh' },
                ],
                onChange: function (v) { setMode(v); action.reset(); },
            }),

            mode === 'generate' && el(Fragment, null,
                el(TextareaControl, { label: 'What should I write about?', value: prompt, onChange: setPrompt, rows: 3 }),
                el(SelectControl, {
                    label: 'Tone',
                    value: tone,
                    options: [
                        { label: 'Professional', value: 'professional' },
                        { label: 'Casual', value: 'casual' },
                        { label: 'Friendly', value: 'friendly' },
                        { label: 'Authoritative', value: 'authoritative' },
                        { label: 'Humorous', value: 'humorous' },
                        { label: 'Technical', value: 'technical' },
                    ],
                    onChange: setTone,
                })
            ),

            mode === 'rewrite' && el(SelectControl, {
                label: 'Rewrite Style',
                value: rewriteStyle,
                options: [
                    { label: 'Improve Quality', value: 'improve' },
                    { label: 'Simplify', value: 'simplify' },
                    { label: 'Make Formal', value: 'formal' },
                    { label: 'Make Casual', value: 'casual' },
                    { label: 'Expand', value: 'expand' },
                    { label: 'Shorten', value: 'shorten' },
                ],
                onChange: setRewriteStyle,
            }),

            mode === 'calendar' && el(Fragment, null,
                el(TextareaControl, { label: 'Your niche or topic area', value: prompt, onChange: setPrompt, rows: 2 }),
                el(SelectControl, { label: 'Weeks to plan', value: weeks, options: [
                    { label: '2 weeks', value: '2' }, { label: '4 weeks', value: '4' },
                    { label: '8 weeks', value: '8' }, { label: '12 weeks', value: '12' },
                ], onChange: setWeeks }),
                el(SelectControl, { label: 'Posts per week', value: postsPerWeek, options: [
                    { label: '1', value: '1' }, { label: '2', value: '2' },
                    { label: '3', value: '3' }, { label: '5', value: '5' },
                ], onChange: setPostsPerWeek })
            ),

            mode === 'refresh' && el('p', { style: { fontSize: 12, color: '#64748b' } },
                'Analyzes your current post and suggests updates to keep it fresh, accurate, and ranking well.'
            ),

            el(ActionButton, { loading: action.loading, onClick: run, label: mode === 'generate' ? 'Generate' : mode === 'rewrite' ? 'Rewrite' : mode === 'calendar' ? 'Plan Calendar' : 'Refresh Content' }),
            el(ErrorNotice, { error: action.error }),

            action.result && el(ResultBox, { data: action.result },
                (mode === 'generate' || mode === 'rewrite') && el(Fragment, null,
                    el('p', { style: styles.previewText }, truncate(action.result.content, 1500)),
                    el(Button, { isSecondary: true, onClick: function () { insertContent(action.result.content); }, style: styles.insertBtn },
                        mode === 'generate' ? 'Insert into Editor' : 'Replace Content'
                    )
                ),
                mode === 'calendar' && el('div', null,
                    el('p', { style: styles.sectionTitle }, 'Content Calendar'),
                    el('p', { style: styles.previewText }, typeof action.result.calendar === 'string' ? action.result.calendar : JSON.stringify(action.result.calendar || action.result, null, 2))
                ),
                mode === 'refresh' && el(Fragment, null,
                    el('p', { style: styles.sectionTitle }, 'Refresh Suggestions'),
                    el('p', { style: styles.previewText }, action.result.suggestions || action.result.content || JSON.stringify(action.result, null, 2)),
                    action.result.content && el(Button, { isSecondary: true, onClick: function () { insertContent(action.result.content); }, style: styles.insertBtn }, 'Apply Refreshed Content')
                )
            )
        );
    }

    /* ====================================================================
     * PANEL 2 — SEO & MARKETING
     * ==================================================================== */
    function SeoMarketingPanel() {
        var _m = useState('seo'), mode = _m[0], setMode = _m[1];
        var _p = useState(''), input = _p[0], setInput = _p[1];
        var _pl = useState('all'), platform = _pl[0], setPlatform = _pl[1];
        var action = useAction();

        function run() {
            var content = getPostContent();
            var title = getPostTitle();
            switch (mode) {
                case 'seo':
                    action.run('/zoobicon-ai/v1/seo', { content: content, title: title, post_id: getPostId() });
                    break;
                case 'internal-links':
                    action.run('/zoobicon-ai/v1/internal-links', { content: content, title: title });
                    break;
                case 'social':
                    action.run('/zoobicon-ai/v1/social', { content: content, title: title, platforms: platform === 'all' ? ['twitter', 'linkedin', 'facebook', 'instagram'] : [platform] });
                    break;
                case 'competitor':
                    action.run('/zoobicon-ai/v1/competitor', { url: input, focus: 'seo' });
                    break;
            }
        }

        return el(PanelBody, { title: 'SEO & Marketing', initialOpen: false, icon: 'chart-line' },
            el(SelectControl, {
                value: mode,
                options: [
                    { label: 'Optimize SEO', value: 'seo' },
                    { label: 'Internal Link Suggestions', value: 'internal-links' },
                    { label: 'Social Media Posts', value: 'social' },
                    { label: 'Competitor Analysis', value: 'competitor' },
                ],
                onChange: function (v) { setMode(v); action.reset(); },
            }),

            mode === 'social' && el(SelectControl, {
                label: 'Platform',
                value: platform,
                options: [
                    { label: 'All Platforms', value: 'all' },
                    { label: 'Twitter/X', value: 'twitter' },
                    { label: 'LinkedIn', value: 'linkedin' },
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Instagram', value: 'instagram' },
                ],
                onChange: setPlatform,
            }),

            mode === 'competitor' && el(TextControl, {
                label: 'Competitor URL',
                value: input,
                onChange: setInput,
                placeholder: 'https://competitor.com',
            }),

            (mode === 'seo' || mode === 'internal-links') && el('p', { style: { fontSize: 12, color: '#64748b' } },
                mode === 'seo' ? 'Analyzes your post and generates optimized meta title, description, and keywords.' :
                'Scans all your posts and suggests internal links to add to this content.'
            ),

            el(ActionButton, { loading: action.loading, onClick: run, label: mode === 'seo' ? 'Optimize SEO' : mode === 'internal-links' ? 'Find Links' : mode === 'social' ? 'Generate Posts' : 'Analyze Competitor' }),
            el(ErrorNotice, { error: action.error }),

            action.result && el(ResultBox, { data: action.result },
                mode === 'seo' && el(Fragment, null,
                    el(KV, { label: 'Meta Title', value: action.result.meta_title }),
                    el(KV, { label: 'Meta Description', value: action.result.meta_description }),
                    action.result.keywords && el(KV, { label: 'Keywords', value: action.result.keywords.join(', ') }),
                    action.result.score && el(KV, { label: 'SEO Score', value: action.result.score + '/100' })
                ),
                mode === 'internal-links' && el('div', null,
                    el('p', { style: styles.sectionTitle }, 'Suggested Internal Links'),
                    el('p', { style: styles.previewText }, typeof action.result.suggestions === 'string' ? action.result.suggestions : JSON.stringify(action.result.suggestions || action.result, null, 2))
                ),
                mode === 'social' && el('div', null,
                    el('p', { style: styles.sectionTitle }, 'Social Media Posts'),
                    el('p', { style: styles.previewText }, typeof action.result.posts === 'string' ? action.result.posts : JSON.stringify(action.result.posts || action.result, null, 2))
                ),
                mode === 'competitor' && el('div', null,
                    el('p', { style: styles.sectionTitle }, 'Competitor Analysis'),
                    el('p', { style: styles.previewText }, typeof action.result.analysis === 'string' ? action.result.analysis : JSON.stringify(action.result.analysis || action.result, null, 2))
                )
            )
        );
    }

    /* ====================================================================
     * PANEL 3 — MEDIA
     * ==================================================================== */
    function MediaPanel() {
        var _m = useState('image'), mode = _m[0], setMode = _m[1];
        var _p = useState(''), prompt = _p[0], setPrompt = _p[1];
        var _s = useState('realistic'), imgStyle = _s[0], setImgStyle = _s[1];
        var _v = useState('explainer'), videoType = _v[0], setVideoType = _v[1];
        var action = useAction();

        function run() {
            switch (mode) {
                case 'image':
                    action.run('/zoobicon-ai/v1/image', { prompt: prompt, style: imgStyle });
                    break;
                case 'video':
                    action.run('/zoobicon-ai/v1/video', { script: prompt, type: videoType, title: getPostTitle() });
                    break;
                case 'alt-text':
                    action.run('/zoobicon-ai/v1/alt-text', { content: getPostContent(), post_id: getPostId() });
                    break;
            }
        }

        return el(PanelBody, { title: 'Media', initialOpen: false, icon: 'format-image' },
            el(SelectControl, {
                value: mode,
                options: [
                    { label: 'Generate AI Image', value: 'image' },
                    { label: 'Generate AI Video', value: 'video' },
                    { label: 'Auto Alt Text (all images)', value: 'alt-text' },
                ],
                onChange: function (v) { setMode(v); action.reset(); },
            }),

            mode === 'image' && el(Fragment, null,
                el(TextareaControl, { label: 'Describe the image', value: prompt, onChange: setPrompt, rows: 3, placeholder: 'A modern office with natural lighting and green plants...' }),
                el(SelectControl, {
                    label: 'Style',
                    value: imgStyle,
                    options: [
                        { label: 'Realistic Photo', value: 'realistic' },
                        { label: 'Illustration', value: 'illustration' },
                        { label: 'Digital Art', value: 'digital-art' },
                        { label: '3D Render', value: '3d-render' },
                        { label: 'Watercolor', value: 'watercolor' },
                        { label: 'Minimalist', value: 'minimalist' },
                    ],
                    onChange: setImgStyle,
                })
            ),

            mode === 'video' && el(Fragment, null,
                el(TextareaControl, { label: 'Video script or description', value: prompt, onChange: setPrompt, rows: 4, placeholder: 'A 30-second explainer about our new product launch...' }),
                el(SelectControl, {
                    label: 'Video Type',
                    value: videoType,
                    options: [
                        { label: 'Explainer', value: 'explainer' },
                        { label: 'Product Demo', value: 'product-demo' },
                        { label: 'Testimonial', value: 'testimonial' },
                        { label: 'Social Media Short', value: 'social-short' },
                        { label: 'Tutorial', value: 'tutorial' },
                    ],
                    onChange: setVideoType,
                })
            ),

            mode === 'alt-text' && el('p', { style: { fontSize: 12, color: '#64748b' } },
                'Scans all images in this post and generates descriptive, SEO-friendly alt text for each one. Improves accessibility (WCAG) and search rankings.'
            ),

            el(ActionButton, { loading: action.loading, onClick: run, label: mode === 'image' ? 'Generate Image' : mode === 'video' ? 'Generate Video' : 'Generate Alt Text' }),
            el(ErrorNotice, { error: action.error }),

            action.result && el(ResultBox, { data: action.result },
                mode === 'image' && el(Fragment, null,
                    action.result.media_url && el('img', { src: action.result.media_url, style: { width: '100%', borderRadius: 6 } }),
                    el('p', { style: { fontSize: 11, color: '#64748b', marginTop: 6 } }, 'Image added to Media Library')
                ),
                mode === 'video' && el(Fragment, null,
                    action.result.video_url
                        ? el('video', { src: action.result.video_url, controls: true, style: { width: '100%', borderRadius: 6 } })
                        : el('p', null, action.result.status || 'Video generation started. Check back shortly.'),
                    action.result.job_id && el('p', { style: { fontSize: 11, color: '#64748b' } }, 'Job ID: ' + action.result.job_id)
                ),
                mode === 'alt-text' && el('div', null,
                    el('p', { style: styles.sectionTitle }, 'Alt Text Generated'),
                    el('p', { style: styles.previewText }, typeof action.result.results === 'object' ? JSON.stringify(action.result.results, null, 2) : (action.result.message || 'Alt text applied to images.'))
                )
            )
        );
    }

    /* ====================================================================
     * PANEL 4 — SITE MANAGEMENT
     * ==================================================================== */
    function SiteManagementPanel() {
        var _m = useState('audit'), mode = _m[0], setMode = _m[1];
        var action = useAction();

        function run() {
            switch (mode) {
                case 'audit':
                    action.run('/zoobicon-ai/v1/site-audit', {});
                    break;
                case 'accessibility':
                    action.run('/zoobicon-ai/v1/accessibility', { content: getPostContent(), title: getPostTitle(), auto_fix: false });
                    break;
                case 'accessibility-fix':
                    action.run('/zoobicon-ai/v1/accessibility', { content: getPostContent(), title: getPostTitle(), auto_fix: true });
                    break;
                case 'analytics':
                    action.run('/zoobicon-ai/v1/analytics', { post_id: getPostId(), question: 'How is this post performing?' });
                    break;
            }
        }

        return el(PanelBody, { title: 'Site Management', initialOpen: false, icon: 'admin-tools' },
            el(SelectControl, {
                value: mode,
                options: [
                    { label: 'Full Site Audit', value: 'audit' },
                    { label: 'Accessibility Check', value: 'accessibility' },
                    { label: 'Accessibility Auto-Fix', value: 'accessibility-fix' },
                    { label: 'Analytics Explainer', value: 'analytics' },
                ],
                onChange: function (v) { setMode(v); action.reset(); },
            }),

            el('p', { style: { fontSize: 12, color: '#64748b' } },
                mode === 'audit' ? 'Comprehensive audit of your entire site: SEO, performance, security, content quality, and technical health.' :
                mode === 'accessibility' ? 'Checks this post against WCAG 2.1 AA standards and reports issues.' :
                mode === 'accessibility-fix' ? 'Checks AND automatically fixes accessibility issues in this post.' :
                'Explains your analytics data in plain English. No jargon, just insights.'
            ),

            el(ActionButton, { loading: action.loading, onClick: run, label: mode === 'audit' ? 'Run Site Audit' : mode === 'analytics' ? 'Explain Analytics' : mode === 'accessibility-fix' ? 'Check & Fix' : 'Check Accessibility' }),
            el(ErrorNotice, { error: action.error }),

            action.result && el(ResultBox, { data: action.result },
                mode === 'audit' && el('div', null,
                    action.result.overall_score && el(KV, { label: 'Overall Score', value: action.result.overall_score + '/100' }),
                    el('p', { style: styles.previewText }, typeof action.result.audit === 'string' ? action.result.audit : JSON.stringify(action.result.audit || action.result, null, 2))
                ),
                (mode === 'accessibility' || mode === 'accessibility-fix') && el(Fragment, null,
                    action.result.issues_found !== undefined && el(KV, { label: 'Issues Found', value: String(action.result.issues_found) }),
                    action.result.issues_fixed !== undefined && el(KV, { label: 'Issues Fixed', value: String(action.result.issues_fixed) }),
                    el('p', { style: styles.previewText }, action.result.report || JSON.stringify(action.result, null, 2)),
                    action.result.content && el(Button, { isSecondary: true, onClick: function () { insertContent(action.result.content); }, style: styles.insertBtn }, 'Apply Fixed Content')
                ),
                mode === 'analytics' && el('p', { style: styles.previewText }, action.result.explanation || action.result.analysis || JSON.stringify(action.result, null, 2))
            )
        );
    }

    /* ====================================================================
     * PANEL 5 — WOOCOMMERCE
     * ==================================================================== */
    function WooCommercePanel() {
        var _m = useState('descriptions'), mode = _m[0], setMode = _m[1];
        var _t = useState('professional'), wcTone = _t[0], setWcTone = _t[1];
        var _f = useState('all'), focus = _f[0], setFocus = _f[1];
        var action = useAction();

        function run() {
            switch (mode) {
                case 'descriptions':
                    action.run('/zoobicon-ai/v1/woo/descriptions', { product_ids: [getPostId()], tone: wcTone });
                    break;
                case 'seo':
                    action.run('/zoobicon-ai/v1/woo/seo', { product_ids: [getPostId()], focus: focus });
                    break;
            }
        }

        return el(PanelBody, { title: 'WooCommerce', initialOpen: false, icon: 'cart' },
            el('p', { style: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8 } },
                'Requires WooCommerce. Actions apply to the current product.'
            ),
            el(SelectControl, {
                value: mode,
                options: [
                    { label: 'Generate Product Description', value: 'descriptions' },
                    { label: 'Optimize Product SEO', value: 'seo' },
                ],
                onChange: function (v) { setMode(v); action.reset(); },
            }),

            mode === 'descriptions' && el(SelectControl, {
                label: 'Tone',
                value: wcTone,
                options: [
                    { label: 'Professional', value: 'professional' },
                    { label: 'Playful', value: 'playful' },
                    { label: 'Luxury', value: 'luxury' },
                    { label: 'Technical', value: 'technical' },
                    { label: 'Casual', value: 'casual' },
                ],
                onChange: setWcTone,
            }),

            mode === 'seo' && el(SelectControl, {
                label: 'Focus',
                value: focus,
                options: [
                    { label: 'All (Title + Description + Tags)', value: 'all' },
                    { label: 'Title Only', value: 'title' },
                    { label: 'Description Only', value: 'description' },
                    { label: 'Tags Only', value: 'tags' },
                ],
                onChange: setFocus,
            }),

            el(ActionButton, { loading: action.loading, onClick: run, label: mode === 'descriptions' ? 'Generate Description' : 'Optimize SEO' }),
            el(ErrorNotice, { error: action.error }),

            action.result && el(ResultBox, { data: action.result },
                el('p', { style: styles.previewText }, action.result.description || action.result.content || JSON.stringify(action.result, null, 2)),
                action.result.content && el(Button, { isSecondary: true, onClick: function () { insertContent(action.result.content); }, style: styles.insertBtn }, 'Apply to Product')
            )
        );
    }

    /* ====================================================================
     * PANEL 6 — PLATFORM
     * ==================================================================== */
    function PlatformPanel() {
        var _m = useState('translate'), mode = _m[0], setMode = _m[1];
        var _p = useState(''), input = _p[0], setInput = _p[1];
        var _l = useState('es'), lang = _l[0], setLang = _l[1];
        var action = useAction();

        function run() {
            switch (mode) {
                case 'translate':
                    action.run('/zoobicon-ai/v1/translate', { content: getPostContent(), language: lang });
                    break;
                case 'chatbot':
                    action.run('/zoobicon-ai/v1/chatbot', { name: input || getPostTitle() + ' Bot', system_prompt: 'You are a helpful assistant for this website.' });
                    break;
                case 'domain':
                    action.run('/zoobicon-ai/v1/domain-search', { query: input });
                    break;
                case 'landing':
                    action.run('/zoobicon-ai/v1/landing-page', { prompt: input || getPostTitle(), tone: 'professional' });
                    break;
            }
        }

        return el(PanelBody, { title: 'Platform', initialOpen: false, icon: 'admin-multisite' },
            el(SelectControl, {
                value: mode,
                options: [
                    { label: 'Translate Content', value: 'translate' },
                    { label: 'Deploy AI Chatbot', value: 'chatbot' },
                    { label: 'Domain Search', value: 'domain' },
                    { label: 'Generate Landing Page', value: 'landing' },
                ],
                onChange: function (v) { setMode(v); action.reset(); },
            }),

            mode === 'translate' && el(SelectControl, {
                label: 'Target Language',
                value: lang,
                options: [
                    { label: 'Spanish', value: 'es' },
                    { label: 'French', value: 'fr' },
                    { label: 'German', value: 'de' },
                    { label: 'Italian', value: 'it' },
                    { label: 'Portuguese', value: 'pt' },
                    { label: 'Japanese', value: 'ja' },
                    { label: 'Chinese', value: 'zh' },
                    { label: 'Korean', value: 'ko' },
                    { label: 'Arabic', value: 'ar' },
                    { label: 'Hindi', value: 'hi' },
                    { label: 'Dutch', value: 'nl' },
                    { label: 'Russian', value: 'ru' },
                    { label: 'Maori', value: 'mi' },
                ],
                onChange: setLang,
            }),

            mode === 'chatbot' && el(TextControl, {
                label: 'Chatbot Name',
                value: input,
                onChange: setInput,
                placeholder: 'My Support Bot',
            }),

            mode === 'domain' && el(TextControl, {
                label: 'Search for a domain',
                value: input,
                onChange: setInput,
                placeholder: 'mybusiness.com',
            }),

            mode === 'landing' && el(TextareaControl, {
                label: 'What is the landing page for?',
                value: input,
                onChange: setInput,
                rows: 3,
                placeholder: 'A SaaS product that helps small businesses manage invoices...',
            }),

            el(ActionButton, { loading: action.loading, onClick: run, label: mode === 'translate' ? 'Translate' : mode === 'chatbot' ? 'Deploy Chatbot' : mode === 'domain' ? 'Search Domains' : 'Generate Landing Page' }),
            el(ErrorNotice, { error: action.error }),

            action.result && el(ResultBox, { data: action.result },
                mode === 'translate' && el(Fragment, null,
                    el('p', { style: styles.previewText }, truncate(action.result.content, 1500)),
                    el(Button, { isSecondary: true, onClick: function () { insertContent(action.result.content); }, style: styles.insertBtn }, 'Replace with Translation')
                ),
                mode === 'chatbot' && el(Fragment, null,
                    action.result.chatbot_id && el(KV, { label: 'Chatbot ID', value: action.result.chatbot_id }),
                    action.result.embed_code && el(Fragment, null,
                        el('p', { style: styles.sectionTitle }, 'Embed Code'),
                        el('code', { style: { fontSize: 11, display: 'block', padding: 8, background: '#1e293b', color: '#e2e8f0', borderRadius: 4, overflowX: 'auto', whiteSpace: 'pre-wrap' } }, action.result.embed_code)
                    ),
                    el('p', { style: { fontSize: 11, color: '#64748b', marginTop: 4 } }, action.result.message || 'Chatbot deployed successfully.')
                ),
                mode === 'domain' && el('div', null,
                    el('p', { style: styles.sectionTitle }, 'Domain Results'),
                    el('p', { style: styles.previewText }, JSON.stringify(action.result.results || action.result, null, 2))
                ),
                mode === 'landing' && el(Fragment, null,
                    el('p', { style: styles.sectionTitle }, 'Landing Page Generated'),
                    el('p', { style: { fontSize: 12, color: '#64748b' } }, action.result.url ? 'Preview: ' + action.result.url : (action.result.message || 'Landing page created.')),
                    action.result.html && el(Button, { isSecondary: true, onClick: function () { insertContent(action.result.html); }, style: styles.insertBtn }, 'Insert into Editor')
                )
            )
        );
    }

    /* ====================================================================
     * USAGE & ABOUT PANEL
     * ==================================================================== */
    function UsagePanel() {
        var action = useAction();
        var _loaded = useState(false), loaded = _loaded[0], setLoaded = _loaded[1];

        function loadUsage() {
            setLoaded(true);
            action.run('/zoobicon-ai/v1/usage', {});
        }

        return el(PanelBody, { title: 'Usage & Account', initialOpen: false, icon: 'info-outline' },
            !loaded && el(Button, { isSecondary: true, onClick: loadUsage, style: { width: '100%', justifyContent: 'center' } }, 'Load Usage Stats'),
            action.loading && el(Spinner, null),
            action.result && el(Fragment, null,
                el(KV, { label: 'Plan', value: action.result.plan || 'Free' }),
                el(KV, { label: 'Used', value: (action.result.used || 0) + ' / ' + (action.result.limit || 50) }),
                el(KV, { label: 'Remaining', value: String(action.result.remaining || 0) }),
                action.result.resets_at && el(KV, { label: 'Resets', value: action.result.resets_at })
            ),
            el('div', { style: { marginTop: 16, padding: '12px 0', borderTop: '1px solid #e2e8f0' } },
                el('p', { style: { fontSize: 12, fontWeight: 600, marginBottom: 4 } }, 'Zoobicon AI v2.0.0'),
                el('p', { style: { fontSize: 11, color: '#64748b', lineHeight: 1.5 } },
                    '25+ AI features in one plugin. Replace 12 plugins with one. ',
                    'Free: 50 ops/month. Pro: $19/mo unlimited. Agency: $99/mo.'
                ),
                el('div', { style: { marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' } },
                    el('a', { href: 'https://zoobicon.com', target: '_blank', style: { fontSize: 11, color: '#2563eb' } }, 'zoobicon.com'),
                    el('span', { style: { color: '#cbd5e1' } }, '/'),
                    el('a', { href: 'https://zoobicon.ai', target: '_blank', style: { fontSize: 11, color: '#2563eb' } }, 'zoobicon.ai'),
                    el('span', { style: { color: '#cbd5e1' } }, '/'),
                    el('a', { href: 'https://zoobicon.io', target: '_blank', style: { fontSize: 11, color: '#2563eb' } }, 'zoobicon.io'),
                    el('span', { style: { color: '#cbd5e1' } }, '/'),
                    el('a', { href: 'https://zoobicon.sh', target: '_blank', style: { fontSize: 11, color: '#2563eb' } }, 'zoobicon.sh')
                )
            )
        );
    }

    /* ====================================================================
     * MAIN SIDEBAR
     * ==================================================================== */
    function ZoobiconAISidebar() {
        return el(Fragment, null,
            el(PluginSidebarMoreMenuItem, { target: 'zoobicon-ai-sidebar', icon: ICON }, 'Zoobicon AI'),
            el(PluginSidebar, {
                name: 'zoobicon-ai-sidebar',
                title: 'Zoobicon AI',
                icon: ICON,
            },
                el(ContentCreationPanel, null),
                el(SeoMarketingPanel, null),
                el(MediaPanel, null),
                el(SiteManagementPanel, null),
                el(WooCommercePanel, null),
                el(PlatformPanel, null),
                el(UsagePanel, null)
            )
        );
    }

    wp.plugins.registerPlugin('zoobicon-ai', {
        render: ZoobiconAISidebar,
        icon: ICON,
    });
})(window.wp);
