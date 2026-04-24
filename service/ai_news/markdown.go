package ai_news

import (
	"fmt"
	"html"
	"regexp"
	"strconv"
	"strings"
)

// RenderMarkdownEmail converts the LLM's markdown briefing to email-safe HTML.
//
// Scope is intentionally limited to what our prompt produces: ## / ### headings,
// paragraphs, bullets (- / *), bold (**), italic (*), inline code (`), and
// [n] citations that we turn into superscript links to a numbered source list.
//
// Email clients vary wildly. We keep tags simple, inline styles only, no
// custom CSS class names, and avoid div/section nesting that some clients
// (e.g. Gmail mobile) collapse.
func RenderMarkdownEmail(md string, sources []SourceItem) string {
	if strings.TrimSpace(md) == "" {
		return ""
	}
	lines := strings.Split(strings.ReplaceAll(md, "\r\n", "\n"), "\n")

	var (
		out         strings.Builder
		inList      bool
		inParagraph bool
	)
	closeList := func() {
		if inList {
			out.WriteString("</ul>")
			inList = false
		}
	}
	closeParagraph := func() {
		if inParagraph {
			out.WriteString("</p>")
			inParagraph = false
		}
	}

	for _, raw := range lines {
		line := strings.TrimRight(raw, " \t")
		trimmed := strings.TrimSpace(line)

		// Blank line — close any open block.
		if trimmed == "" {
			closeList()
			closeParagraph()
			continue
		}

		// Headings: ##/### at start
		if strings.HasPrefix(trimmed, "### ") {
			closeList()
			closeParagraph()
			fmt.Fprintf(&out, `<h4 style="font-size:15px;margin:18px 0 6px;color:#1d1d1f;font-weight:600;">%s</h4>`,
				renderInlineMarkdown(strings.TrimPrefix(trimmed, "### "), sources))
			continue
		}
		if strings.HasPrefix(trimmed, "## ") {
			closeList()
			closeParagraph()
			fmt.Fprintf(&out, `<h3 style="font-size:17px;margin:22px 0 8px;color:#1d1d1f;font-weight:600;">%s</h3>`,
				renderInlineMarkdown(strings.TrimPrefix(trimmed, "## "), sources))
			continue
		}
		if strings.HasPrefix(trimmed, "# ") {
			closeList()
			closeParagraph()
			fmt.Fprintf(&out, `<h2 style="font-size:19px;margin:24px 0 10px;color:#1d1d1f;font-weight:600;">%s</h2>`,
				renderInlineMarkdown(strings.TrimPrefix(trimmed, "# "), sources))
			continue
		}

		// Bullet (- or *)
		if strings.HasPrefix(trimmed, "- ") || strings.HasPrefix(trimmed, "* ") {
			closeParagraph()
			if !inList {
				out.WriteString(`<ul style="margin:8px 0 12px;padding-left:22px;color:#1d1d1f;font-size:14px;line-height:1.65;">`)
				inList = true
			}
			body := strings.TrimSpace(trimmed[2:])
			fmt.Fprintf(&out, `<li style="margin-bottom:6px;">%s</li>`,
				renderInlineMarkdown(body, sources))
			continue
		}

		// Numbered list: "1. xxx"
		if numberedListPrefix.MatchString(trimmed) {
			closeParagraph()
			if !inList {
				out.WriteString(`<ul style="margin:8px 0 12px;padding-left:22px;color:#1d1d1f;font-size:14px;line-height:1.65;">`)
				inList = true
			}
			body := numberedListPrefix.ReplaceAllString(trimmed, "")
			fmt.Fprintf(&out, `<li style="margin-bottom:6px;">%s</li>`,
				renderInlineMarkdown(body, sources))
			continue
		}

		// Horizontal rule
		if trimmed == "---" || trimmed == "***" {
			closeList()
			closeParagraph()
			out.WriteString(`<hr style="border:none;border-top:1px solid #e5e5ea;margin:18px 0;">`)
			continue
		}

		// Paragraph text — collapse adjacent non-blank lines into one <p>.
		closeList()
		if !inParagraph {
			out.WriteString(`<p style="margin:0 0 12px;color:#1d1d1f;font-size:14px;line-height:1.7;">`)
			inParagraph = true
		} else {
			out.WriteString("<br>")
		}
		out.WriteString(renderInlineMarkdown(trimmed, sources))
	}
	closeList()
	closeParagraph()

	return out.String()
}

// renderInlineMarkdown handles inline patterns inside a single block: bold,
// italic, inline code, links, and [n] citations.
func renderInlineMarkdown(s string, sources []SourceItem) string {
	// Citation [n] → superscript link, BEFORE escaping (so we control the HTML).
	// Note: we render anchor + text, then escape the rest.
	// To keep the escape-then-replace pipeline simple, we'll escape first and
	// replace patterns on the escaped string (since [, ] are not escaped by html.EscapeString).

	escaped := html.EscapeString(s)
	escaped = inlineCodeRE.ReplaceAllStringFunc(escaped, func(m string) string {
		// Strip backticks and wrap in <code>.
		inner := m[1 : len(m)-1]
		return `<code style="background:#f5f5f7;padding:1px 5px;border-radius:4px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#1d1d1f;">` + inner + `</code>`
	})
	escaped = boldRE.ReplaceAllString(escaped, `<strong>$1</strong>`)
	// Italic intentionally not supported — single-asterisk patterns false-
	// positive too easily on names like *gpt-5* and our prompts emit bold only.
	escaped = linkRE.ReplaceAllStringFunc(escaped, func(m string) string {
		parts := linkRE.FindStringSubmatch(m)
		if len(parts) < 3 {
			return m
		}
		text := parts[1]
		href := parts[2]
		return fmt.Sprintf(`<a href="%s" style="color:#0066cc;text-decoration:none;">%s</a>`, href, text)
	})
	escaped = citationRE.ReplaceAllStringFunc(escaped, func(m string) string {
		nstr := m[1 : len(m)-1] // strip [ ]
		n, err := strconv.Atoi(nstr)
		if err != nil || n < 1 || n > len(sources) {
			return m // out-of-range — leave as plain text
		}
		src := sources[n-1]
		title := html.EscapeString(src.Title)
		if title == "" {
			title = html.EscapeString(src.URL)
		}
		return fmt.Sprintf(
			`<sup><a href="#ai-news-source-%d" title="%s" style="color:#0066cc;text-decoration:none;font-weight:500;">[%d]</a></sup>`,
			n, title, n,
		)
	})
	return escaped
}

var (
	boldRE             = regexp.MustCompile(`\*\*([^*]+)\*\*`)
	inlineCodeRE       = regexp.MustCompile("`[^`\n]+`")
	linkRE             = regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`) // standard markdown link
	citationRE         = regexp.MustCompile(`\[(\d+)\]`)
	numberedListPrefix = regexp.MustCompile(`^\d+\.\s+`)
)
