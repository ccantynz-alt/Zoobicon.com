// dom-bridge.ts — Communication bridge between parent React app and iframe visual editor

export interface SelectedElement {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  innerHTML: string;
  xpath: string;
  computedStyles: Record<string, string>;
  rect: { top: number; left: number; width: number; height: number };
  isEditable: boolean;
}

export type BridgeMessage =
  | { type: "element-selected"; element: SelectedElement }
  | { type: "element-hover"; element: SelectedElement | null }
  | { type: "text-updated"; xpath: string; newText: string }
  | { type: "style-updated"; xpath: string; property: string; value: string }
  | { type: "visual-editing-enabled" }
  | { type: "visual-editing-disabled" };

/**
 * Returns a complete JavaScript string to inject into the iframe.
 * When active, it enables hover highlights, click selection, and inline text editing.
 */
export function getVisualEditingScript(): string {
  return `
(function() {
  if (window.__zbcnVisualEditing) return;
  window.__zbcnVisualEditing = true;

  var selectedEl = null;
  var hoverOverlay = null;
  var selectOverlay = null;

  // --- Overlay creation ---
  function createOverlay(id, borderStyle, borderColor) {
    var el = document.createElement('div');
    el.id = id;
    el.style.cssText = 'position:absolute;pointer-events:none;z-index:99999;border:2px ' + borderStyle + ' ' + borderColor + ';transition:all 0.1s ease;display:none;box-sizing:border-box;';
    document.body.appendChild(el);
    return el;
  }

  hoverOverlay = createOverlay('zbcn-hover-overlay', 'dashed', 'rgba(59,130,246,0.7)');
  selectOverlay = createOverlay('zbcn-select-overlay', 'solid', 'rgba(59,130,246,1)');

  // Tag label for selected element
  var tagLabel = document.createElement('div');
  tagLabel.id = 'zbcn-tag-label';
  tagLabel.style.cssText = 'position:absolute;z-index:100000;pointer-events:none;background:#3b82f6;color:#fff;font-size:10px;font-family:monospace;padding:1px 5px;border-radius:2px;display:none;white-space:nowrap;';
  document.body.appendChild(tagLabel);

  function positionOverlay(overlay, rect) {
    overlay.style.top = (rect.top + window.scrollY) + 'px';
    overlay.style.left = (rect.left + window.scrollX) + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'block';
  }

  function hideOverlay(overlay) {
    overlay.style.display = 'none';
  }

  // --- Element info extraction ---
  function getCssSelector(el) {
    if (el.id) return '#' + CSS.escape(el.id);
    var parts = [];
    var current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      var tag = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift('#' + CSS.escape(current.id));
        break;
      }
      var parent = current.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(c) { return c.tagName === current.tagName; });
        if (siblings.length > 1) {
          var idx = siblings.indexOf(current) + 1;
          tag += ':nth-of-type(' + idx + ')';
        }
      }
      parts.unshift(tag);
      current = parent;
    }
    if (parts.length === 0) return 'body';
    return parts.join(' > ');
  }

  function getElementInfo(el) {
    var rect = el.getBoundingClientRect();
    var cs = window.getComputedStyle(el);
    var textNodes = [];
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim()) {
        textNodes.push(el.childNodes[i]);
      }
    }
    var isEditable = textNodes.length > 0 && ['P','H1','H2','H3','H4','H5','H6','SPAN','A','LI','TD','TH','LABEL','BUTTON','FIGCAPTION','BLOCKQUOTE','CITE','STRONG','EM','B','I','U','SMALL','MARK','DEL','INS','SUB','SUP','ABBR','CODE','PRE','DT','DD','SUMMARY','LEGEND','CAPTION'].indexOf(el.tagName) !== -1;
    return {
      tagName: el.tagName.toLowerCase(),
      id: el.id || '',
      className: el.className || '',
      textContent: (el.textContent || '').substring(0, 500),
      innerHTML: el.innerHTML.substring(0, 2000),
      xpath: getCssSelector(el),
      computedStyles: {
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textAlign: cs.textAlign,
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        marginTop: cs.marginTop,
        marginRight: cs.marginRight,
        marginBottom: cs.marginBottom,
        marginLeft: cs.marginLeft,
        borderWidth: cs.borderWidth,
        borderColor: cs.borderColor,
        borderRadius: cs.borderRadius,
        display: cs.display,
        flexDirection: cs.flexDirection,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        gap: cs.gap,
        backgroundImage: cs.backgroundImage,
        borderTopWidth: cs.borderTopWidth,
      },
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      isEditable: isEditable,
    };
  }

  // --- Skip elements we created ---
  function isOurElement(el) {
    return el.id && (el.id.indexOf('zbcn-') === 0);
  }

  function shouldSkip(el) {
    if (!el || el === document.body || el === document.documentElement || el === document.head) return true;
    if (isOurElement(el)) return true;
    if (el.tagName === 'HTML' || el.tagName === 'HEAD' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'META' || el.tagName === 'LINK' || el.tagName === 'NOSCRIPT') return true;
    return false;
  }

  // --- Hover ---
  document.addEventListener('mouseover', function(e) {
    var el = e.target;
    if (shouldSkip(el)) { hideOverlay(hoverOverlay); return; }
    if (el === selectedEl) { hideOverlay(hoverOverlay); return; }
    var rect = el.getBoundingClientRect();
    positionOverlay(hoverOverlay, rect);
    window.parent.postMessage({ type: 'element-hover', element: getElementInfo(el) }, '*');
  }, true);

  document.addEventListener('mouseout', function(e) {
    if (shouldSkip(e.target)) return;
    hideOverlay(hoverOverlay);
    window.parent.postMessage({ type: 'element-hover', element: null }, '*');
  }, true);

  // --- Click (select) ---
  document.addEventListener('click', function(e) {
    var el = e.target;
    if (shouldSkip(el)) return;
    e.preventDefault();
    e.stopPropagation();

    // Deselect previous
    if (selectedEl) {
      selectedEl.removeAttribute('data-zbcn-selected');
    }

    selectedEl = el;
    el.setAttribute('data-zbcn-selected', 'true');

    var rect = el.getBoundingClientRect();
    positionOverlay(selectOverlay, rect);

    // Tag label
    tagLabel.textContent = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').filter(Boolean).slice(0,2).join('.') : '');
    tagLabel.style.top = (rect.top + window.scrollY - 18) + 'px';
    tagLabel.style.left = (rect.left + window.scrollX) + 'px';
    tagLabel.style.display = 'block';

    hideOverlay(hoverOverlay);
    window.parent.postMessage({ type: 'element-selected', element: getElementInfo(el) }, '*');
  }, true);

  // --- Double-click for inline text editing ---
  document.addEventListener('dblclick', function(e) {
    var el = e.target;
    if (shouldSkip(el)) return;
    e.preventDefault();
    e.stopPropagation();

    var info = getElementInfo(el);
    if (!info.isEditable) return;

    el.contentEditable = 'true';
    el.focus();
    el.style.outline = '2px solid #3b82f6';
    el.style.outlineOffset = '2px';

    function finishEdit() {
      el.contentEditable = 'false';
      el.style.outline = '';
      el.style.outlineOffset = '';
      var newText = el.textContent || '';
      window.parent.postMessage({ type: 'text-updated', xpath: getCssSelector(el), newText: newText }, '*');
      // Re-send selection info with updated text
      window.parent.postMessage({ type: 'element-selected', element: getElementInfo(el) }, '*');
      el.removeEventListener('blur', finishEdit);
      el.removeEventListener('keydown', onKey);
    }

    function onKey(ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) {
        ev.preventDefault();
        el.blur();
      }
      if (ev.key === 'Escape') {
        el.blur();
      }
    }

    el.addEventListener('blur', finishEdit);
    el.addEventListener('keydown', onKey);
  }, true);

  // --- Prevent all navigation ---
  document.addEventListener('submit', function(e) { e.preventDefault(); }, true);

  // Intercept link clicks
  document.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function(e) { e.preventDefault(); }, true);
  });

  // Observe DOM for new links
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) {
          if (node.tagName === 'A') node.addEventListener('click', function(e) { e.preventDefault(); }, true);
          node.querySelectorAll && node.querySelectorAll('a').forEach(function(a) {
            a.addEventListener('click', function(e) { e.preventDefault(); }, true);
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // --- Listen for style updates from parent ---
  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.type) return;
    if (e.data.type === 'apply-style' && e.data.xpath && e.data.property && e.data.value !== undefined) {
      var target = document.querySelector(e.data.xpath);
      if (target) {
        target.style[e.data.property] = e.data.value;
        // Update overlay position in case size changed
        if (target === selectedEl) {
          var rect = target.getBoundingClientRect();
          positionOverlay(selectOverlay, rect);
          tagLabel.style.top = (rect.top + window.scrollY - 18) + 'px';
          tagLabel.style.left = (rect.left + window.scrollX) + 'px';
        }
        window.parent.postMessage({ type: 'element-selected', element: getElementInfo(target) }, '*');
      }
    }
    if (e.data.type === 'apply-text' && e.data.xpath && e.data.newText !== undefined) {
      var target = document.querySelector(e.data.xpath);
      if (target) {
        target.textContent = e.data.newText;
        if (target === selectedEl) {
          window.parent.postMessage({ type: 'element-selected', element: getElementInfo(target) }, '*');
        }
      }
    }
    if (e.data.type === 'deselect') {
      if (selectedEl) {
        selectedEl.removeAttribute('data-zbcn-selected');
        selectedEl = null;
      }
      hideOverlay(selectOverlay);
      tagLabel.style.display = 'none';
    }
  });

  // Update overlay positions on scroll/resize
  function updateOverlays() {
    if (selectedEl) {
      var rect = selectedEl.getBoundingClientRect();
      positionOverlay(selectOverlay, rect);
      tagLabel.style.top = (rect.top + window.scrollY - 18) + 'px';
      tagLabel.style.left = (rect.left + window.scrollX) + 'px';
    }
  }
  window.addEventListener('scroll', updateOverlays, true);
  window.addEventListener('resize', updateOverlays);

  window.parent.postMessage({ type: 'visual-editing-enabled' }, '*');
})();
`;
}

/**
 * Apply a style change to HTML source by CSS selector.
 * Finds inline style on the matching element and updates/adds the property.
 */
export function applyStyleToHtml(
  html: string,
  selector: string,
  property: string,
  value: string
): string {
  // We work with the DOM to reliably apply styles
  const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
  if (!parser) return html;

  const doc = parser.parseFromString(html, "text/html");
  const el = doc.querySelector(selector);
  if (!el) return html;

  // Convert camelCase to kebab-case for inline style
  const kebab = property.replace(/([A-Z])/g, "-$1").toLowerCase();

  // Parse existing inline style
  const existingStyle = el.getAttribute("style") || "";
  const styleMap = new Map<string, string>();

  existingStyle
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((decl) => {
      const colonIdx = decl.indexOf(":");
      if (colonIdx > 0) {
        styleMap.set(decl.substring(0, colonIdx).trim(), decl.substring(colonIdx + 1).trim());
      }
    });

  styleMap.set(kebab, value);

  const newStyle = Array.from(styleMap.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");

  el.setAttribute("style", newStyle);

  // Serialize back — use the full document
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

/**
 * Apply a text change to HTML source by CSS selector.
 */
export function applyTextToHtml(
  html: string,
  selector: string,
  newText: string
): string {
  const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
  if (!parser) return html;

  const doc = parser.parseFromString(html, "text/html");
  const el = doc.querySelector(selector);
  if (!el) return html;

  el.textContent = newText;

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

/**
 * Reorder top-level <section> elements in the HTML body.
 */
export function reorderSections(
  html: string,
  fromIndex: number,
  toIndex: number
): string {
  const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
  if (!parser) return html;

  const doc = parser.parseFromString(html, "text/html");
  const sections = Array.from(doc.body.querySelectorAll(":scope > section"));

  if (fromIndex < 0 || fromIndex >= sections.length) return html;
  if (toIndex < 0 || toIndex >= sections.length) return html;
  if (fromIndex === toIndex) return html;

  const movingSection = sections[fromIndex];

  // Remove from current position
  movingSection.parentElement?.removeChild(movingSection);

  // Re-query sections after removal
  const remainingSections = Array.from(doc.body.querySelectorAll(":scope > section"));

  if (toIndex >= remainingSections.length) {
    // Insert at end
    const lastSection = remainingSections[remainingSections.length - 1];
    lastSection.parentElement?.insertBefore(movingSection, lastSection.nextSibling);
  } else {
    const refSection = remainingSections[toIndex];
    refSection.parentElement?.insertBefore(movingSection, refSection);
  }

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

/**
 * Add a new section to the HTML body.
 * Inserts the section HTML before </body> (after all existing sections).
 */
export function addSectionToHtml(html: string, sectionHtml: string): string {
  const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
  if (!parser) return html;

  const doc = parser.parseFromString(html, "text/html");

  // Create a temporary container to parse the section HTML
  const temp = doc.createElement("div");
  temp.innerHTML = sectionHtml.trim();

  // Append all children of the temp container to the body
  while (temp.firstChild) {
    doc.body.appendChild(temp.firstChild);
  }

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

/**
 * Remove a top-level <section> (or footer) at the given index from the HTML body.
 */
export function removeSectionFromHtml(html: string, sectionIndex: number): string {
  const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
  if (!parser) return html;

  const doc = parser.parseFromString(html, "text/html");
  const sections = Array.from(doc.body.querySelectorAll(":scope > section, :scope > footer"));

  if (sectionIndex < 0 || sectionIndex >= sections.length) return html;

  sections[sectionIndex].parentElement?.removeChild(sections[sectionIndex]);

  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

/**
 * Inject the visual editing script into HTML before </body>.
 */
export function injectVisualEditingScript(html: string): string {
  const script = `<script data-zbcn-visual-edit="true">${getVisualEditingScript()}</script>`;

  // Insert before </body> if it exists
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${script}\n</body>`);
  }

  // Insert before </html> if no body closing tag
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${script}\n</html>`);
  }

  // Append at end
  return html + "\n" + script;
}
