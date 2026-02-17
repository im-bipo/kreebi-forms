# Kreebi Forms

Lightweight, developer-friendly WordPress form builder (JSON + Drag & Drop)

Kreebi Forms lets you create, embed and manage forms using a JSON definition (or the admin editor). Forms and submissions are stored as custom post types for easy management and export.

## Features

- Create forms from JSON in the WordPress admin
- Shortcode support to embed forms anywhere: `[kreebi_form id="001"]`
- Submissions saved as a custom post type with admin viewer
- Secure: sanitization and nonce checks using WordPress APIs
- Small, dependency-free plugin with simple PHP classes

## Installation

1. Upload the `kreebi-forms` folder to `/wp-content/plugins/`.
2. Activate the plugin via **Plugins > Installed Plugins**.
3. Visit **Kreebi Forms > Forms** to create your first form.

## Usage

- Create a form using the admin `Create New Form` modal (paste JSON or use the editor).
- Embed a form with the shortcode:

```
[kreebi_form id="001"]
```

Replace `001` with the generated form ID.

## Supported field types

`text`, `email`, `password`, `number`

## Security & Data Handling

- All input is sanitized with WordPress functions (`sanitize_text_field`, `wp_unslash`, `wp_kses_post` where appropriate).
- Nonces are used for admin and frontend submissions to prevent CSRF.

## Development

Install dev dependencies and build a distribution zip:

```bash
npm install
npm run zip
```

- `npm run zip` will run the gulp task which cleans `dist/` and produces `dist/kreebi-forms.zip`.
- Use `npx gulp clean` to remove `dist/` without bundling.

## Contributing

Contributions and bug reports are welcome. Please open issues or PRs on the repository.

## Changelog

= 1.0.0 =
- Initial release.

## License

GPLv2 or later — see `readme.txt` for full license details.