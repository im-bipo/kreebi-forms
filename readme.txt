=== Kreebi Forms ===
Contributors: imbipo
Tags: forms, form-builder, submissions, contact-form
Requires at least: 5.7
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.1.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Repository: https://github.com/im-bipo/kreebi-forms



Kreebi Forms makes it simple to build flexible forms using Drag and Drop as well as JSON definition from the WordPress admin.

== Description ==

Kreebi Forms is a lightweight, WordPress form builder that lets you create and manage forms using a Drag and Drop as well as JSON-based definition stored as a custom post type. It provides an admin UI for creating forms, a frontend shortcode to embed forms anywhere, and a submissions area for easy review and export. The plugin focuses on security, accessibility, and clean markup to integrate seamlessly with WordPress themes.

**Benefits:**

- Lightweight and dependency-free: small footprint, no external frameworks required.
- Secure by default: inputs are validated and sanitized using WordPress APIs.
- Developer-friendly JSON format: programmatically generate or import form definitions.
- Built-in submissions viewer in the admin for quick review.


== Installation ==

1. Upload the `kreebi-forms` folder to `/wp-content/plugins/`.
2. Activate the plugin via **Plugins > Installed Plugins**.
3. Go to **Kreebi Forms > Forms** to create a new form.

== Usage ==

- Create a form in the admin using the JSON editor provided in the form modal.
- Embed the form with the shortcode: `[kreebi_form id="001"]` (replace `001` with your form ID).
- View submissions under **Kreebi Forms > Submissions**.

The plugin auto-generates a form ID and stores the form definition as post meta. For security and compatibility, all input is sanitized and validated using WordPress APIs.

== Frequently Asked Questions ==


= What field types are supported? =

`text`, `email`, `password`, and `number`.

= Where are submissions stored? =

Submissions are stored as a custom post type and can be viewed under **Kreebi Forms > Submissions** in the admin.

== Screenshots ==

1. *Advanced Form Builder* – fully featured drag‑and‑drop interface with live preview and field settings.
2. *Quick Form Builder* – create a simple form in seconds using prebuilt templates and shortcuts.
3. *Submission Page* – review, search and export all form entries right from the admin dashboard.
4. *Style Template Page* – choose or customise visual templates to style your forms without touching code.
5. *Integrations Page* – connect fields to third‑party services like email, CRM, or webhooks with ease.

== Upgrade Notice ==


= 1.1.0 =
* Minor enhancements and additional bug fixes.

= 1.1.0 =
* New Integrations Added

= 1.0.1 =
* Bug fixes and security tweaks.

== Changelog ==

= 1.1.0 =
* Added upgrade notice and bumped version.

= 1.0.1 =
* Bug fixes and security tweaks.

= 1.0.0 =
* Initial release.
