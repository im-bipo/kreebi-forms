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

### Local Installation & Setup

#### Prerequisites

- WordPress development environment (local, Docker, or Local by Flywheel)
- Node.js (v14 or higher)
- npm or yarn
- Git (optional)

#### Steps

1. **Clone or Download the Plugin**

   ```bash
   # Option 1: Clone from repository
   git clone <repository-url> kreebi-forms
   cd kreebi-forms

   # Option 2: Manual download
   # Download and extract to: wp-content/plugins/kreebi-forms
   ```

2. **Place Plugin in WordPress**

   ```bash
   # Copy the kreebi-forms folder to your WordPress plugins directory
   cp -r kreebi-forms /path/to/wordpress/wp-content/plugins/
   ```

3. **Install Dependencies**

   ```bash
   cd /path/to/wordpress/wp-content/plugins/kreebi-forms
   npm install
   ```

4. **Build the Plugin**

   ```bash
   npm run build
   ```

5. **Activate the Plugin**

   - Go to WordPress Admin: **Plugins > Installed Plugins**
   - Find "Kreebi Forms" and click **Activate**

6. **Create Your First Form**

   - Navigate to **Kreebi Forms > Forms** in the admin menu
   - Click **Create New Form**
   - Use the JSON editor or drag-and-drop builder to create your form
   - Click **Save & Publish**

7. **Embed the Form**
   ```
   [kreebi_form id="YOUR_FORM_ID"]
   ```
   Add this shortcode to any post, page, or custom location

## Usage

- Create a form using the admin `Create New Form` modal (paste JSON or use the editor).
- Embed a form with the shortcode:

```
[kreebi_form id="001"]
```

Replace `001` with the generated form ID.

## Supported field types

`text`, `email`, `password`, `number`

## Development & Modification Guide

### Project Structure

```
kreebi-forms/
├── admin/                    # Admin menu, forms & submissions pages
│   ├── class-krefrm-admin.php
│   ├── class-krefrm-admin-menu.php
│   ├── class-krefrm-form-editor.php
│   └── class-krefrm-form-handler.php
├── includes/                 # Core plugin logic
│   ├── class-krefrm-core.php
│   ├── class-krefrm-post-types.php
│   ├── class-krefrm-rest-api.php
│   ├── class-krefrm-shortcode.php
│   └── class-krefrm-submission-handler.php
├── src/                      # React/JavaScript source (built to /build)
│   ├── App.js
│   ├── index.js
│   └── pages/
├── build/                    # Compiled JavaScript bundle (auto-generated)
├── assets/                   # Admin CSS & JS
│── kreebi-forms.php          # Main plugin file (entry point)
└── package.json              # Dependencies & scripts
```

### Development Workflow

#### 1. **Build for Production**

```bash
npm run build
```

Minifies and optimizes the JavaScript bundle.

#### 3. **Create Distribution Zip**

```bash
npm run zip
```

Creates `dist/kreebi-forms.zip` for distribution.

#### 4. **Clean Build**

```bash
npx gulp clean
```

Removes the `/build` directory without rebuilding.

### Modifying the Plugin

#### Adding Custom Field Types

1. **Update the Form JSON Schema** in `/includes/class-krefrm-core.php`

   - Add field type validation

2. **Update Frontend Component** in `/src/App.js`

   - Add field rendering logic
   - Include input validation

3. **Update Admin Editor** in `/src/pages/FormsPage.js`

   - Add field option to the builder UI

4. **Update Form Sanitizer** in `/includes/class-krefrm-form-sanitizer.php`
   - Add sanitization rules for the new field type

#### Creating Custom Form from JSON

Example form JSON structure:

```json
{
  "title": "Contact Form",
  "description": "Get in touch with us",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Full Name",
      "required": true,
      "placeholder": "Enter your name"
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "required": true
    },
    {
      "id": "message",
      "type": "textarea",
      "label": "Message",
      "required": false
    }
  ],
  "submitButtonText": "Send Message"
}
```

#### Modifying Admin Pages

- **Forms Page** (`/admin/class-krefrm-admin-forms-page.php`)

  - List, edit, delete forms
  - Manage form definitions

- **Submissions Page** (`/admin/class-krefrm-admin-submissions-page.php`)
  - View submitted form data
  - Export submissions

#### Modifying JavaScript/React

Edit files in `/src/`:

- `App.js` - Main form renderer
- `pages/FormsPage.js` - Admin form builder
- `pages/SubmissionsPage.js` - Submissions viewer
- `style.css` - Frontend styles

#### Modifying CSS

- **Admin styles**: `/assets/css/admin.css`
- **Frontend styles**: `/src/style.css` (compiled to `/build/style-index.css`)

### Testing Locally

1. **Create Test Form** via Admin UI or JSON paste
2. **Embed Test Form** using shortcode: `[kreebi_form id="test-001"]`
3. **Submit Test Data** and verify it appears in **Kreebi Forms > Submissions**
4. **Check WordPress Logs** for errors (if debugging is enabled)

### Common Development Tasks

#### Debug JavaScript

```javascript
// Enable in browser console
console.log(formData);
```

#### Check Form Submissions

- WordPress Admin → **Kreebi Forms > Submissions**
- View all submitted form data with timestamps

#### Clear Plugin Cache

```bash
# In WordPress admin or via WP-CLI
wp cache flush
```

#### Database Queries

Forms and submissions are stored as Custom Post Types:

- Forms: Post Type `krefrm_form`
- Submissions: Post Type `krefrm_submission`
- Access via WordPress Dashboard or WP-CLI

#### Enable WordPress Debugging

Add to `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Security & Data Handling

- All input is sanitized with WordPress functions (`sanitize_text_field`, `wp_unslash`, `wp_kses_post` where appropriate).
- Nonces are used for admin and frontend submissions to prevent CSRF.

## Build & Deployment

### Development Build

```bash
npm install
npm run build
```

### Production Build

```bash
npm install
npm run build
```

### Create Distribution

```bash
npm run zip
```

This creates `dist/kreebi-forms.zip` with all plugin files.

- `npm run build` creates a production-optimized build
- `npm run zip` will run the gulp task which cleans `dist/` and produces `dist/kreebi-forms.zip`
- Use `npx gulp clean` to remove `dist/` without bundling

## Contributing

Contributions and bug reports are welcome. Please open issues or PRs on the repository.

## Changelog

= 1.0.0 =

- Initial release.

## License

GPLv2 or later — see `readme.txt` for full license details.
