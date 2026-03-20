=== Kreebi Forms ===
Contributors: imbipo
Tags: form builder, contact form, custom forms, submission management, integrations
Requires at least: 5.7
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.1.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Repository: https://github.com/im-bipo/kreebi-forms



Kreebi Forms is a lightweight WordPress form builder plugin for fast, secure contact and lead capture with drag & drop and integration support.

== Description ==

Kreebi Forms helps teams, creators, agencies, and developers build professional WordPress forms without friction. It combines a modern drag-and-drop form builder with JSON-level control so you can move from simple lead capture forms to advanced workflows in minutes.

This plugin is designed for websites that care about speed, security, SEO relevance, and clean user experience. Every form is built to be easy to publish, easy to manage, and easy to scale.

= Why Kreebi Forms for WordPress? =

Kreebi Forms gives you practical control over the full form lifecycle:

- Build forms visually with drag and drop.
- Fine-tune structure and logic with JSON form definitions.
- Publish anywhere via shortcode.
- Capture and manage submissions in your WordPress admin.
- Connect events to integrations such as Email Notifications, Webhook, JSON View, and CAPTCHA.

= Core Features (Explained) =

= 1) Drag-and-Drop Form Builder =
Create forms visually with an intuitive editor, live controls, and organized settings. This is ideal for non-technical users who need production-ready forms quickly.

= 2) Quick Builder Workflow =
Launch forms faster using quick setup tools and pre-structured building patterns. Great for contact forms, inquiry forms, and conversion pages where speed matters.

= 3) JSON Form Builder + JSON Editor =
Advanced users can define or edit form structure in JSON for precision and consistency. This is useful for versioned form architecture, reusable patterns, and developer workflows.

= 4) Shortcode Embedding =
Embed any form in posts, pages, or widget areas using a simple shortcode format. This allows flexible placement across landing pages, service pages, and campaign content.

= 5) Submission Management =
Capture and review user submissions directly in WordPress admin. Teams can monitor incoming leads, review records efficiently, and keep workflows centralized.

= 6) Security and Data Sanitization =
Kreebi Forms follows secure WordPress practices with input sanitization and validation. This helps reduce unsafe payload risks and keeps stored submission data clean.

= 7) Responsive Frontend Output =
Forms are built to render well on desktop and mobile devices, helping improve completion rates and user trust.

= 8) Style Templates and Custom Styling =
Use style templates to create a polished form appearance and align form UI with your brand identity.

= Integrations (Explained Strongly) =

= Email Notification Integration =
Send automated email notifications on form submissions. Configure sender details, recipient behavior, and notification templates to support sales, support, and operations workflows.

= Webhook Integration =
Push form submission data to external services and automations in real time. This is ideal for CRM syncing, workflow automation platforms, custom APIs, and internal data pipelines.

= JSON View Integration =
Inspect or consume structured submission data in JSON format. Useful for debugging, technical review, and external processing workflows that require machine-readable payloads.

= CAPTCHA Integration (reCAPTCHA v3) =
Protect forms from spam and bot abuse using score-based reCAPTCHA v3 verification. This improves lead quality while keeping user friction low.

= SEO and Conversion Advantage =

Kreebi Forms supports SEO-friendly website performance by keeping form workflows lightweight and manageable inside WordPress. It also supports conversion optimization through flexible placement, faster form deployment, and cleaner user journeys.

If you are building pages to rank and convert, Kreebi Forms helps you publish targeted forms for each intent stage: contact, quote request, consultation, registration, or custom lead capture.

= Best Use Cases =

- Contact forms for business websites
- Lead generation forms for landing pages
- Service inquiry forms for agencies
- Support and request forms for operations teams
- Campaign-specific forms for SEO and paid traffic funnels


== Installation ==

1. Upload the `kreebi-forms` folder to `/wp-content/plugins/`.
2. Activate the plugin via **Plugins > Installed Plugins**.
3. Go to **Kreebi Forms > Forms** to create a new form.
4. Configure optional integrations in **Kreebi Forms > Integrations**.

== Usage ==

- Create a form in **Kreebi Forms > Forms** using Drag and Drop, Quick Builder, or JSON editing.
- Publish the form with shortcode: `[kreebi_form id="001"]` (replace `001` with your form ID).
- Review incoming entries in **Kreebi Forms > Submissions**.
- Configure Email Notification, Webhook, JSON View, and CAPTCHA from **Kreebi Forms > Integrations**.

The plugin auto-generates a form ID and stores the form definition as post meta. For security and compatibility, all input is sanitized and validated using WordPress APIs.

== Frequently Asked Questions ==


= What field types are supported? =

Kreebi Forms supports common production field types, including text, email, password, number, and selectable choice fields such as checkbox, radio, and dropdown.

= Can I connect form submissions to external services? =

Yes. Use Webhook integration to send submission data to third-party platforms, custom APIs, or automation systems.

= How does spam protection work? =

Kreebi Forms supports Google reCAPTCHA v3 for score-based bot filtering with minimal user friction.

= Can I customize form styles? =

Yes. You can apply style templates and custom CSS to match your brand and improve visual consistency.

= Where are submissions stored? =

Submissions are stored as a custom post type and can be viewed under **Kreebi Forms > Submissions** in the admin.

== Screenshots ==

1. *Advanced Form Builder* – fully featured drag‑and‑drop interface with live preview and field settings.
2. *Quick Form Builder* – create a simple form in seconds using prebuilt templates and shortcuts.
3. *Submission Page* – review, search and export all form entries right from the admin dashboard.
4. *Style Template Page* – choose or customise visual templates to style your forms without touching code.
5. *Integrations Page* – connect fields to third‑party services like email, CRM, or webhooks with ease.

== Upgrade Notice ==


= 1.1.1 =
* Improved integrations coverage, stronger configuration defaults, and stability enhancements.

= 1.1.0 =
* Minor enhancements and additional bug fixes.

= 1.0.1 =
* Bug fixes and security tweaks.

== Changelog ==

= 1.1.2 =
* Added reCAPTCHA v3 integration support and verification flow.
* Improved webhook settings organization and centralized service handling.
* Enhanced email notification defaults and activation-time setup.
* Refined form ID normalization and consistency across routes and rendering.

= 1.1.1 =
* Added upgrade notice and bumped version.

= 1.0.1 =
* Bug fixes and security tweaks.

= 1.0.0 =
* Initial release.
