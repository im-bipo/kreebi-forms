=== Kreebi Forms - Drag & Drop Form Builder. Contact Forms, Survey Form, Registration Form and More ===
Contributors: imbipo
Tags: contact form, form builder, drag-and-drop, webhook, custom forms
Requires at least: 5.7
Tested up to: 6.9.4
Stable tag: 1.1.8
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight and Powerful WordPress form builder plugin with Drag-and-drop form builder with JSON editing, submission management, webhook, and reCAPTCHA v3. Part of the Kreebi Suite.

== Description ==

**Kreebi Forms** is a lightweight WordPress form builder for developers, agencies, and site owners who want full control — visually and at the code level.

Build with drag-and-drop. Edit raw form structure in JSON. Deploy via shortcode. Collect and manage submissions. Connect to any external service with webhooks.

👉 [Watch the demo](https://youtu.be/xbwOcGuh7JA)

= Part of the Kreebi Suite =

Kreebi Forms is the core plugin in the **Kreebi Suite** — a growing set of focused WordPress tools built around forms, data, and workflows.

* **[Kreebi Forms](https://wordpress.org/plugins/kreebi-forms/)** — this plugin. Build and manage forms.
* **[Kreebi Templates](https://wordpress.org/plugins/kreebi-templates/)** — browse and import cloud-backed form templates.
* **Kreebi Forms Dashboard** — analytics for your forms. Submission trends, conversion rates, field-level insights. *(Coming soon)*

= Who is this for? =


* **Site owners** who want all submissions inside WordPress — no third-party SaaS account needed
* **Agencies** building lead capture, inquiry, and campaign forms for client sites
* **Developers** who want JSON-editable form structure with a clean admin UI and no bloat
* **Teams** who need a central place to review, search, and manage form entries

= Core Features =

**Drag-and-Drop Form Builder**
Build forms visually with a live editor, field settings panel, and real-time preview. Supports text, email, password, number, checkbox, radio, and dropdown fields.

**Quick Builder**
Create a simple form in seconds using prebuilt field patterns — ideal for contact pages, landing pages, and inquiry forms where speed matters.

**JSON Form Builder + JSON Editor**
Define and edit your entire form in JSON. Useful for versioned forms, developer handoffs, templating across projects, and reusable field architecture.

**Shortcode Embedding**
Publish any form anywhere using `[kreebi_form id="001"]`. Works in posts, pages, widget areas, and page builders.

**Submission Management**
Every submission is stored in WordPress as a custom post type. Review, search, and manage all entries from your admin dashboard — no external platform required.

**Style Templates**
Apply pre-built visual templates or add custom CSS to match your brand without touching plugin files.

**Responsive Output**
Forms render correctly on desktop, tablet, and mobile with no additional configuration.

= Integrations =

**Email Notifications**
Automated emails on submission. Configure sender details, recipient list, subject, and template content.

**Webhook Integration**
POST submission data to any external URL in real time. Works with Zapier, Make, n8n, custom APIs, CRMs, and internal data pipelines.

**reCAPTCHA v3**
Google reCAPTCHA v3 score-based protection. Stops bots without adding friction for real users.

**JSON View**
Inspect raw submission payloads in structured JSON. Useful for debugging and API integration work.

= Form Types You Can Build =

* Contact forms
* Lead generation forms for landing pages
* Service inquiry and quote request forms
* Consultation booking forms
* Support and helpdesk request forms
* Event registration forms
* Newsletter signup forms
* Feedback and survey forms
* Campaign-specific conversion forms

= Developer Notes =

Forms are stored as WordPress custom post types. Form structure is saved as post meta in JSON. All input is sanitized and validated using WordPress core APIs. The JSON editor exposes the full form definition for direct editing — useful for version control, migrations, and templating workflows.

= Usage =

1. Go to **Kreebi Forms > Forms** and create a new form using Drag and Drop, Quick Builder, or the JSON editor.
2. Embed with shortcode: `[kreebi_form id="001"]`
3. View entries under **Kreebi Forms > Submissions**.
4. Configure Email, Webhook, JSON View, and reCAPTCHA under **Kreebi Forms > Integrations**.

== Screenshots ==

1. Advanced drag-and-drop form builder with live preview and field settings panel.
2. Quick Builder — create a simple form in seconds using prebuilt patterns.
3. Forms overview — manage all your forms in one place.
4. Submissions dashboard — search, review, and manage all form entries.
5. Style Templates — apply visual themes without writing CSS.
6. Integrations panel — configure email notifications, webhooks, JSON view, and reCAPTCHA.

== Installation ==

1. Upload the `kreebi-forms` folder to `/wp-content/plugins/`.
2. Activate via **Plugins > Installed Plugins**.
3. Go to **Kreebi Forms > Forms** to create your first form.
4. Configure integrations under **Kreebi Forms > Integrations**.

== Frequently Asked Questions ==

= What field types are supported? =
Text, email, password, number, checkbox, radio, and dropdown. More field types are in active development.

= Does it work with my theme? =
Yes. Kreebi Forms outputs standard HTML with scoped styles. It is compatible with all major WordPress themes and page builders.

= Can I connect forms to Zapier or Make? =
Yes. The Webhook integration POSTs submission data to any URL — Zapier webhooks, Make scenarios, n8n workflows, or custom API endpoints.

= How does spam protection work? =
Kreebi Forms uses Google reCAPTCHA v3. Configure your site key and secret key under Kreebi Forms > Integrations > CAPTCHA.

= Where is submission data stored? =
All submissions are stored as a WordPress custom post type on your own server. No data leaves your server unless you configure a webhook.

= Can I edit a form's structure directly in JSON? =
Yes. The JSON editor gives you direct access to the full form definition for precision editing, templating, or developer workflows.

= What is the Kreebi Suite? =
The Kreebi Suite is a set of focused WordPress plugins built around forms, templates, and data workflows. Kreebi Forms is the core plugin. Kreebi Templates adds a cloud-backed template library. Kreebi Forms Dashboard (coming soon) adds submission analytics and conversion tracking.

= Can I export form submissions? =
You can view and manage all submissions in the WordPress admin dashboard. CSV export is on the roadmap.

== Changelog ==

= 1.1.8 =
* Fixed activation redirect so the welcome screen opens reliably after plugin activation.
* Updated plugin icon to SVG for sharper display at all sizes.
* Added demo video reference for onboarding.

= 1.1.7 =
* Added toast notification system for user feedback across the admin.
* Integrated toast notifications into form error handling and the JSON editor.

= 1.1.6 =
* Added consent text and refined the Welcome Editor onboarding flow.
* Set drag-and-drop as the default editor on first use.
* Added custom Shadow DOM focus styles for the form wrapper.
* Refactored Forms page components and improved editor selection behavior.

= 1.1.5 =
* Added the Welcome Editor page and styles.
* Added form name validation with feedback in FormBuilder and QuickBuilder.
* Normalized form JSON option values to match labels for consistency.
* Improved style template saving and reCAPTCHA settings validation.

= 1.1.4 =
* Fixed deactivation survey modal not opening when plugin slug is URL-encoded.

= 1.1.3 =
* Improved deactivation survey link interception with safer anchor traversal logic.

= 1.1.2 =
* Added reCAPTCHA v3 integration and verification flow.
* Improved webhook settings organization.
* Enhanced email notification defaults and activation-time setup.
* Refined form ID normalization across routes and rendering.

= 1.1.1 =
* Added upgrade notice and version bump.

= 1.0.1 =
* Bug fixes and security improvements.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.1.8 =
Fixes activation redirect, updates plugin icon to SVG, and adds demo video reference.