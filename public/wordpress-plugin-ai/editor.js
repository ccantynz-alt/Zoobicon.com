/**
 * Zoobicon AI — Gutenberg Block Editor Sidebar Panel
 *
 * Adds an AI assistant panel to the WordPress block editor sidebar.
 * Users can generate content, optimize SEO, rewrite text, and more
 * without leaving the editor.
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
    var Notice = wp.components.Notice;
    var Spinner = wp.components.Spinner;
    var apiFetch = wp.apiFetch;
    var select = wp.data.select;

    var ICON = el('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
        el('path', { d: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' })
    );

    function ZoobiconAISidebar() {
        var _useState1 = useState('generate');
        var mode = _useState1[0];
        var setMode = _useState1[1];

        var _useState2 = useState('');
        var prompt = _useState2[0];
        var setPrompt = _useState2[1];

        var _useState3 = useState(false);
        var loading = _useState3[0];
        var setLoading = _useState3[1];

        var _useState4 = useState(null);
        var result = _useState4[0];
        var setResult = _useState4[1];

        var _useState5 = useState(null);
        var error = _useState5[0];
        var setError = _useState5[1];

        var _useState6 = useState('professional');
        var tone = _useState6[0];
        var setTone = _useState6[1];

        var _useState7 = useState('improve');
        var rewriteStyle = _useState7[0];
        var setRewriteStyle = _useState7[1];

        function getPostContent() {
            try {
                return select('core/editor').getEditedPostContent() || '';
            } catch (e) {
                return '';
            }
        }

        function getPostTitle() {
            try {
                return select('core/editor').getEditedPostAttribute('title') || '';
            } catch (e) {
                return '';
            }
        }

        function getPostId() {
            try {
                return select('core/editor').getCurrentPostId() || 0;
            } catch (e) {
                return 0;
            }
        }

        function runAI() {
            setLoading(true);
            setError(null);
            setResult(null);

            var endpoint = '';
            var body = {};

            switch (mode) {
                case 'generate':
                    endpoint = '/zoobicon-ai/v1/generate';
                    body = { type: 'blog_post', prompt: prompt, tone: tone, length: 'medium' };
                    break;
                case 'seo':
                    endpoint = '/zoobicon-ai/v1/seo';
                    body = { content: getPostContent(), title: getPostTitle(), post_id: getPostId() };
                    break;
                case 'rewrite':
                    endpoint = '/zoobicon-ai/v1/rewrite';
                    body = { content: getPostContent(), style: rewriteStyle };
                    break;
                case 'image':
                    endpoint = '/zoobicon-ai/v1/image';
                    body = { prompt: prompt, style: 'realistic' };
                    break;
                case 'translate':
                    endpoint = '/zoobicon-ai/v1/translate';
                    body = { content: getPostContent(), language: prompt || 'es' };
                    break;
            }

            apiFetch({ path: endpoint, method: 'POST', data: body })
                .then(function (data) {
                    setResult(data);
                    setLoading(false);
                })
                .catch(function (err) {
                    setError(err.message || 'An error occurred');
                    setLoading(false);
                });
        }

        return el(Fragment, null,
            el(PluginSidebarMoreMenuItem, { target: 'zoobicon-ai-sidebar', icon: ICON }, 'Zoobicon AI'),
            el(PluginSidebar, {
                name: 'zoobicon-ai-sidebar',
                title: 'Zoobicon AI',
                icon: ICON,
            },
                el(PanelBody, { title: 'AI Assistant', initialOpen: true },
                    el(SelectControl, {
                        label: 'Action',
                        value: mode,
                        options: [
                            { label: 'Generate Content', value: 'generate' },
                            { label: 'Optimize SEO', value: 'seo' },
                            { label: 'Rewrite Content', value: 'rewrite' },
                            { label: 'Generate Image', value: 'image' },
                            { label: 'Translate', value: 'translate' },
                        ],
                        onChange: function (v) { setMode(v); setResult(null); setError(null); },
                    }),

                    (mode === 'generate' || mode === 'image') && el(TextareaControl, {
                        label: mode === 'generate' ? 'What should I write about?' : 'Describe the image',
                        value: prompt,
                        onChange: setPrompt,
                        rows: 3,
                    }),

                    mode === 'generate' && el(SelectControl, {
                        label: 'Tone',
                        value: tone,
                        options: [
                            { label: 'Professional', value: 'professional' },
                            { label: 'Casual', value: 'casual' },
                            { label: 'Friendly', value: 'friendly' },
                            { label: 'Authoritative', value: 'authoritative' },
                            { label: 'Humorous', value: 'humorous' },
                        ],
                        onChange: setTone,
                    }),

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

                    mode === 'translate' && el(TextControl, {
                        label: 'Language code (e.g., es, fr, de, ja)',
                        value: prompt,
                        onChange: setPrompt,
                    }),

                    el(Button, {
                        isPrimary: true,
                        isBusy: loading,
                        disabled: loading,
                        onClick: runAI,
                        style: { width: '100%', justifyContent: 'center', marginTop: 8 },
                    }, loading ? el(Spinner, null) : 'Run AI'),

                    error && el(Notice, { status: 'error', isDismissible: false, style: { marginTop: 12 } }, error),

                    result && el('div', { style: { marginTop: 12, padding: 12, background: '#f0f6fc', borderRadius: 4, fontSize: 13 } },
                        mode === 'seo' && el(Fragment, null,
                            el('p', null, el('strong', null, 'Title: '), result.meta_title || ''),
                            el('p', null, el('strong', null, 'Description: '), result.meta_description || ''),
                            result.keywords && el('p', null, el('strong', null, 'Keywords: '), result.keywords.join(', '))
                        ),
                        mode === 'generate' && el('div', null,
                            el('p', { style: { whiteSpace: 'pre-wrap' } }, (result.content || '').substring(0, 1000)),
                            el(Button, {
                                isSecondary: true,
                                onClick: function () {
                                    if (result.content) {
                                        wp.data.dispatch('core/editor').resetEditorBlocks(
                                            wp.blocks.parse(result.content)
                                        );
                                    }
                                },
                                style: { marginTop: 8 },
                            }, 'Insert into Editor')
                        ),
                        mode === 'image' && result.media_url && el('div', null,
                            el('img', { src: result.media_url, style: { width: '100%', borderRadius: 4 } }),
                            el('p', { style: { fontSize: 11, color: '#757575' } }, 'Added to Media Library')
                        ),
                        (mode === 'rewrite' || mode === 'translate') && el('div', null,
                            el('p', { style: { whiteSpace: 'pre-wrap' } }, (result.content || '').substring(0, 1000)),
                            el(Button, {
                                isSecondary: true,
                                onClick: function () {
                                    if (result.content) {
                                        wp.data.dispatch('core/editor').resetEditorBlocks(
                                            wp.blocks.parse(result.content)
                                        );
                                    }
                                },
                                style: { marginTop: 8 },
                            }, 'Replace Content')
                        )
                    )
                ),

                el(PanelBody, { title: 'About', initialOpen: false },
                    el('p', { style: { fontSize: 12, color: '#757575' } },
                        'Zoobicon AI adds powerful AI capabilities to your WordPress site. ',
                        'Free: 50 operations/month. Pro: Unlimited for $19/month.'
                    ),
                    el('p', null,
                        el('a', { href: 'https://zoobicon.com', target: '_blank', style: { fontSize: 12 } }, 'zoobicon.com'),
                        ' · ',
                        el('a', { href: 'https://zoobicon.com/ai', target: '_blank', style: { fontSize: 12 } }, 'zoobicon.ai'),
                        ' · ',
                        el('a', { href: 'https://zoobicon.io', target: '_blank', style: { fontSize: 12 } }, 'zoobicon.io'),
                        ' · ',
                        el('a', { href: 'https://zoobicon.sh', target: '_blank', style: { fontSize: 12 } }, 'zoobicon.sh')
                    )
                )
            )
        );
    }

    wp.plugins.registerPlugin('zoobicon-ai', {
        render: ZoobiconAISidebar,
        icon: ICON,
    });
})(window.wp);
