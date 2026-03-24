<?php

if (! defined('ABSPATH')) {
  exit;
}

/**
 * Shortcode Handler
 *
 * Supports single-step and multi-step forms.
 * - 1 step  → rendered as a normal form.
 * - 2+ steps → rendered step-by-step with Next / Previous navigation.
 */
class Krefrm_Shortcode
{
  private $allowed_types = array('text', 'email', 'password', 'number', 'checkbox', 'radio', 'dropdown');

  /**
   * Map styleTemplate values to the CSS classes injected at render time.
   * These are merged with any developer-provided wrapper classes.
   */
  private $style_class_map = array(
    'kreebi_style_1' => array(
      'form'    => 'krefrm-ui-style-1-form',
      'field'   => 'krefrm-ui-style-1-field',
      'label'   => 'krefrm-ui-style-1-label',
      'input'   => 'krefrm-ui-style-1-input',
      'btn'     => 'krefrm-ui-style-1-btn',
    ),
    'kreebi_style_2' => array(
      'form'    => 'krefrm-ui-style-2-form',
      'field'   => 'krefrm-ui-style-2-field',
      'label'   => 'krefrm-ui-style-2-label',
      'input'   => 'krefrm-ui-style-2-input',
      'btn'     => 'krefrm-ui-style-2-btn',
    ),
    'blank_dev' => array(
      'form'    => '',
      'field'   => '',
      'label'   => '',
      'input'   => '',
      'btn'     => '',
    ),
  );

  public function __construct()
  {
    add_action('init', array($this, 'register'));
  }

  public function register()
  {
    add_shortcode('kreebi_form', array($this, 'render'));
  }

  /**
   * Shortcode renderer: [kreebi_form id="001"]
   */
  public function render($atts = array())
  {
    $atts = shortcode_atts(array('id' => '', 'post_id' => ''), $atts, 'kreebi_form');

    // Find form post
    $form_post = null;
    if (! empty($atts['post_id']) && is_numeric($atts['post_id'])) {
      $form_post = get_post(intval($atts['post_id']));
    } elseif (! empty($atts['id'])) {
      $form_post = $this->find_form_post_by_public_id($atts['id']);
    }

    if (! $form_post) {
      return '';
    }

    $form_data = get_post_meta($form_post->ID, '_krefrm_form_data', true);
    $form_id   = (is_array($form_data) && ! empty($form_data['id']))
      ? (string) $form_data['id']
      : (string) $form_post->post_name;

    $captcha_settings = $this->get_frontend_captcha_settings();

    $this->enqueue_frontend_assets($captcha_settings);

    // Resolve style template — global option overrides any per-form value
    $style_template = get_option('krefrm_style_template', 'kreebi_style_1');
    $style_classes  = isset($this->style_class_map[$style_template]) ? $this->style_class_map[$style_template] : $this->style_class_map['blank_dev'];

    // Normalise to steps format (handles both legacy fields and new steps)
    $steps = $this->normalise_steps($form_data);

    if (empty($steps)) {
      return '';
    }

    $is_multistep = count($steps) > 1;
    $total_steps  = count($steps);

    $action     = esc_url(admin_url('admin-post.php'));
    $form_class = 'krefrm-frontend-form' . ($is_multistep ? ' krefrm-multistep-form' : '');
    if (! empty($style_classes['form'])) {
      $form_class .= ' ' . $style_classes['form'];
    }

    $html  = '<form class="' . esc_attr($form_class) . '" method="post" action="' . $action . '"';
    $html .= ' data-krefrm-style-template="' . esc_attr($style_template) . '"';
    if ($is_multistep) {
      $html .= ' data-krefrm-steps="' . esc_attr($total_steps) . '"';
    }
    $html .= '>';
    $html .= '<input type="hidden" name="action" value="krefrm_submit">';
    $html .= '<input type="hidden" name="krefrm_form_id" value="' . esc_attr($form_id) . '">';
    $html .= wp_nonce_field('krefrm_frontend_submit', 'krefrm_frontend_submit', true, false);
    if (! empty($captcha_settings['enabled']) && ! empty($captcha_settings['siteKey'])) {
      $html .= '<input type="hidden" name="krefrm_recaptcha_token" value="">';
    }

    foreach ($steps as $step_index => $step) {
      $step_name = isset($step['name']) ? $step['name'] : '';
      $fields    = isset($step['fields']) ? $step['fields'] : array();
      $is_first  = $step_index === 0;
      $is_last   = $step_index === $total_steps - 1;

      // --- Multi-step wrapper open ---
      if ($is_multistep) {
        $step_style = $is_first ? '' : ' style="display:none;"';
        $step_class = 'krefrm-step' . ($is_first ? ' krefrm-step-active' : '');
        $html .= '<div class="' . esc_attr($step_class) . '" data-krefrm-step="' . esc_attr($step_index) . '"' . $step_style . '>';

        // Progress indicator
        $html .= '<div class="krefrm-step-progress">';
        $html .= '<span class="krefrm-step-indicator">' . sprintf(
          /* translators: 1: current step number, 2: total steps */
          esc_html__('Step %1$d of %2$d', 'kreebi-forms'),
          $step_index + 1,
          $total_steps
        ) . '</span>';
        $html .= '</div>';

        if (! empty($step_name)) {
          $html .= '<h3 class="krefrm-step-title">' . esc_html($step_name) . '</h3>';
        }
      }

      // --- Fields wrapper (flex row) ---
      $html .= '<div class="krefrm-fields-flex">';
      foreach ($fields as $field_index => $f) {
        $html .= $this->render_field($f, $form_id, $step_index, $field_index, $style_classes);
      }
      $html .= '</div>';

      // --- Navigation buttons ---
      if ($is_multistep) {
        $html .= '<div class="krefrm-step-nav">';
        if (! $is_first) {
          $html .= '<button type="button" class="krefrm-prev-btn">' . esc_html__('Previous', 'kreebi-forms') . '</button>';
        }
        if (! $is_last) {
          $html .= '<button type="button" class="krefrm-next-btn">' . esc_html__('Next', 'kreebi-forms') . '</button>';
        }
        if ($is_last) {
          $btn_class = ! empty($style_classes['btn']) ? ' class="' . esc_attr($style_classes['btn']) . '"' : '';
          $html .= '<button type="submit"' . $btn_class . '>' . esc_html__('Submit', 'kreebi-forms') . '</button>';
        }
        $html .= '</div>';
        $html .= '</div>'; // close .krefrm-step
      }
    }

    // Single-step: wrap fields in grid + submit
    if (! $is_multistep) {
      // re-render fields in grid (single step has only one set of fields)
      // Note: fields were already rendered above inside the step loop.
      $btn_class = ! empty($style_classes['btn']) ? ' class="' . esc_attr($style_classes['btn']) . '"' : '';
      $html .= '<p><button type="submit"' . $btn_class . '>' . esc_html__('Submit', 'kreebi-forms') . '</button></p>';
    }

    $html .= '</form>';

    // Inline JS for multi-step navigation (added once per page)
    if ($is_multistep) {
      $html .= $this->get_multistep_script();
    }

    // Wrap form in Shadow DOM with embedded CSS
    return $this->wrap_form_in_shadow_dom($html, $captcha_settings);
  }

  /**
   * Find form post by the public form id.
   *
   * Prefers slug lookup for performance, then falls back to scanning
   * saved form metadata for legacy records where slug/meta may differ.
   */
  private function find_form_post_by_public_id($form_id)
  {
    $form_id = trim((string) $form_id);
    if ('' === $form_id) {
      return null;
    }

    $posts = get_posts(array(
      'post_type'      => 'krefrm_form',
      'name'           => sanitize_title($form_id),
      'post_status'    => 'publish',
      'posts_per_page' => 1,
    ));
    if (! empty($posts)) {
      return $posts[0];
    }

    $all_posts = get_posts(array(
      'post_type'      => 'krefrm_form',
      'post_status'    => 'publish',
      'posts_per_page' => -1,
    ));

    foreach ($all_posts as $post) {
      $form_data = get_post_meta($post->ID, '_krefrm_form_data', true);
      if (is_array($form_data) && isset($form_data['id']) && (string) $form_data['id'] === $form_id) {
        return $post;
      }
    }

    return null;
  }

  /**
   * Wrap form HTML in Shadow DOM for complete CSS isolation (without iframe).
   */
  private function wrap_form_in_shadow_dom($form_html, $captcha_settings = array())
  {
    // Generate unique element ID
    $element_id = 'krefrm-form-' . wp_generate_uuid4();

    // Get embedded styles
    $styles = $this->get_iframe_styles();

    // Create Shadow DOM wrapper with embedded HTML
    $shadow_dom_html = '
<div id="' . esc_attr($element_id) . '" class="krefrm-shadow-wrapper"></div>
<script id="' . esc_attr($element_id) . '-setup">
(function() {
  var formHTML = ' . wp_json_encode($form_html) . ';
  var styles = ' . wp_json_encode($styles) . ';
  var container = document.getElementById("' . esc_attr($element_id) . '");
  var captchaConfig = ' . wp_json_encode($captcha_settings) . ';
  
  if (!container) return;
  
  // Create Shadow DOM root
  var shadow = container.attachShadow({ mode: "open" });
  
  // Create style element
  var styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);
  
  // Create wrapper for form content
  var wrapper = document.createElement("div");
  wrapper.style.cssText = "box-sizing: border-box;";
  wrapper.innerHTML = formHTML;
  shadow.appendChild(wrapper);

  var form = shadow.querySelector("form.krefrm-frontend-form");
  if (!form) {
    return;
  }

  var submitButton = form.querySelector("button[type=\"submit\"], input[type=\"submit\"]");
  var styleTemplate = form.getAttribute("data-krefrm-style-template") || "";
  var isBlankTemplate = styleTemplate === "blank_dev";

  var feedback = form.querySelector(".krefrm-submit-feedback");
  if (!feedback) {
    feedback = document.createElement("div");
    feedback.className = "krefrm-submit-feedback is-hidden";
    feedback.setAttribute("aria-live", "polite");
    form.appendChild(feedback);
  }

  var setFeedback = function(type, message) {
    feedback.className = "krefrm-submit-feedback";
    if (!message) {
      feedback.className += " is-hidden";
      feedback.textContent = "";
      return;
    }

    if (isBlankTemplate) {
      if (type === "loading") {
        feedback.className += " krefrm-loading";
      } else if (type === "error") {
        feedback.className += " krefrm-error";
      } else {
        feedback.className += " krefrm-success";
      }
    } else if (type === "loading") {
      feedback.className += " is-loading";
    } else if (type === "error") {
      feedback.className += " is-error";
    } else {
      feedback.className += " is-success";
    }
    feedback.textContent = message;
  };

  var setButtonState = function(disabled, text) {
    if (!submitButton) {
      return;
    }
    submitButton.disabled = !!disabled;
    if (typeof text === "string" && text.length > 0) {
      if (submitButton.tagName === "INPUT") {
        submitButton.value = text;
      } else {
        submitButton.textContent = text;
      }
    }
  };

  var getCaptchaToken = function() {
    return new Promise(function(resolve, reject) {
      if (!(captchaConfig && captchaConfig.enabled && captchaConfig.siteKey)) {
        resolve("");
        return;
      }

      var tokenInput = form.querySelector("input[name=\"krefrm_recaptcha_token\"]");
      if (!tokenInput) {
        reject(new Error("Captcha token field is missing."));
        return;
      }

      var executeCaptcha = function(tries) {
        if (!window.grecaptcha || typeof window.grecaptcha.ready !== "function") {
          if (tries >= 40) {
            reject(new Error("Captcha failed to load. Please try again."));
            return;
          }
          window.setTimeout(function() {
            executeCaptcha(tries + 1);
          }, 100);
          return;
        }

        window.grecaptcha.ready(function() {
          window.grecaptcha
            .execute(captchaConfig.siteKey, { action: "krefrm_submit" })
            .then(function(token) {
              tokenInput.value = token || "";
              resolve(token || "");
            })
            .catch(function() {
              reject(new Error("Captcha verification failed. Please try again."));
            });
        });
      };

      executeCaptcha(0);
    });
  };

  form.addEventListener("submit", function(event) {
    event.preventDefault();

    if (form.getAttribute("data-krefrm-submitted") === "1") {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      setButtonState(false, "Send Again");
      setFeedback("error", "Please fill in all required fields with valid values.");
      return;
    }

    setButtonState(true, "Submitting...");
    setFeedback("loading", "Submitting...");

    getCaptchaToken()
      .then(function(token) {
        var data = new FormData(form);
        data.set("krefrm_ajax", "1");
        if (token) {
          data.set("krefrm_recaptcha_token", token);
        }

        var submitUrl = form.getAttribute("action") || "";
        if (!submitUrl) {
          throw new Error("Check your network connection.");
        }

        return window.fetch(submitUrl, {
          method: "POST",
          body: data,
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          }
        });
      })
      .then(function(response) {
        return response
          .json()
          .catch(function() {
            throw new Error("Check your network connection.");
          })
          .then(function(payload) {
            return { response: response, payload: payload };
          });
      })
      .then(function(result) {
        var response = result.response;
        var payload = result.payload;

        if (!response.ok || !payload || !payload.success) {
          var message = (payload && payload.data && payload.data.message)
            ? payload.data.message
            : "Check your network connection.";
          throw new Error(message);
        }

        form.setAttribute("data-krefrm-submitted", "1");
        setButtonState(true, "Submitted");
        setFeedback("success", (payload.data && payload.data.message) ? payload.data.message : "Successfully send message.");
      })
      .catch(function(error) {
        setButtonState(false, "Send Again");
        var message = (error && error.message) ? error.message : "";
        if (!message || /failed to fetch|networkerror/i.test(message)) {
          message = "Check your network connection.";
        }
        setFeedback("error", message);
      });
  });
})();
</script>
        ';

    return $shadow_dom_html;
  }

  /**
   * Get embedded CSS for iframe isolation (all templates).
   */
  private function get_iframe_styles()
  {
    $base_css = <<<'CSS'
        html, body {
          margin: 0;
          padding: 20px;
          background: transparent;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
        }
        
        * {
          all: revert;
          box-sizing: border-box;
        }
        
        form { display: block; }
        input, button, label, textarea, select { all: revert; box-sizing: border-box; }
        button { cursor: pointer; }
        
        /* ─── Style 1 — Polished / Rounded ─── */
        .krefrm-ui-style-1-form {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif ;
        }
        
        .krefrm-ui-style-1-field {
          margin-bottom: 14px ;
        }
        
        .krefrm-ui-style-1-label {
          display: block ;
          font-size: 14px ;
          font-weight: 600 ;
          color: #1d2327 ;
          margin-bottom: 6px ;
        }
        
        .krefrm-ui-style-1-input {
          width: 100% ;
          padding: 10px 14px ;
          border: 1px solid #c3c4c7 ;
          border-radius: 6px ;
          font-size: 14px ;
          background: #fff ;
          box-sizing: border-box ;
          color: #1d2327 ;
          appearance: none ;
          -webkit-appearance: none ;
          transition: border-color 0.2s, box-shadow 0.2s ;
        }
        
        .krefrm-ui-style-1-input:focus {
          border-color: #2271b1 ;
          box-shadow: 0 0 0 1px #2271b1 ;
          outline: none ;
        }
        
        /* Checkboxes & Radio buttons for Style 1 */
        .krefrm-ui-style-1-field input[type="checkbox"],
        .krefrm-ui-style-1-field input[type="radio"] {
          min-width: 18px ;
          min-height: 18px ;
          width: 18px ;
          height: 18px ;
          padding: 0 ;
          border: initial ;
          background: initial ;
          appearance: auto ;
          -webkit-appearance: auto ;
          margin-right: 8px ;
          cursor: pointer ;
          accent-color: #2271b1 ;
          opacity: 1 ;
          visibility: visible ;
          pointer-events: auto ;
        }
        
        .krefrm-ui-style-1-field input[type="checkbox"] + label,
        .krefrm-ui-style-1-field input[type="radio"] + label {
          display: inline ;
          font-weight: normal ;
          margin-left: 0 ;
          cursor: pointer ;
          pointer-events: auto ;
        }
        
        .krefrm-ui-style-1-field fieldset {
          border: none ;
          padding: 0 ;
          margin: 0 ;
        }
        
        .krefrm-ui-style-1-field legend {
          display: block ;
          font-size: 14px ;
          font-weight: 600 ;
          color: #1d2327 ;
          margin-bottom: 8px ;
          padding: 0 ;
        }
        
        /* Select for Style 1 */
        .krefrm-ui-style-1-field select {
          width: 100% ;
          padding: 10px 14px ;
          border: 1px solid #c3c4c7 ;
          border-radius: 6px ;
          font-size: 14px ;
          background: #fff ;
          box-sizing: border-box ;
          color: #1d2327 ;
          appearance: none ;
          -webkit-appearance: none ;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232271b1' d='M6 9L1 4h10z'/%3E%3C/svg%3E") ;
          background-repeat: no-repeat ;
          background-position: right 10px center ;
          padding-right: 32px ;
          cursor: pointer ;
        }
        
        .krefrm-ui-style-1-field select:focus {
          border-color: #2271b1 ;
          box-shadow: 0 0 0 1px #2271b1 ;
          outline: none ;
        }
        
        .krefrm-ui-style-1-btn {
          display: inline-flex ;
          align-items: center ;
          justify-content: center ;
          padding: 10px 24px ;
          font-size: 14px ;
          font-weight: 600 ;
          color: #fff ;
          background: #2271b1 ;
          border: none ;
          border-radius: 6px ;
          cursor: pointer ;
          transition: background 0.2s ;
          text-transform: none ;
          line-height: 1.3 ;
          text-decoration: none ;
        }
        
        .krefrm-ui-style-1-btn:hover {
          background: #135e96 ;
        }
        
        /* ─── Style 2 — Flat / Bordered ─── */
        .krefrm-ui-style-2-form {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif ;
        }
        
        .krefrm-ui-style-2-field {
          margin-bottom: 14px ;
          padding: 10px 12px ;
          border: 1px solid #e0e0e0 ;
          border-radius: 3px ;
          background: #fafafa ;
        }
        
        .krefrm-ui-style-2-label {
          display: block ;
          font-size: 13px ;
          font-weight: 700 ;
          text-transform: uppercase ;
          letter-spacing: 0.5px ;
          color: #444 ;
          margin-bottom: 6px ;
        }
        
        .krefrm-ui-style-2-input {
          width: 100% ;
          padding: 8px 10px ;
          border: 1px solid #bbb ;
          border-radius: 3px ;
          font-size: 14px ;
          background: #fff ;
          box-sizing: border-box ;
          color: #1d2327 ;
          appearance: none ;
          -webkit-appearance: none ;
        }
        
        .krefrm-ui-style-2-input:focus {
          border-color: #333 ;
          outline: none ;
        }
        
        /* Checkboxes & Radio buttons for Style 2 */
        .krefrm-ui-style-2-field input[type="checkbox"],
        .krefrm-ui-style-2-field input[type="radio"] {
          min-width: 18px ;
          min-height: 18px ;
          width: 18px ;
          height: 18px ;
          padding: 0 ;
          border: initial ;
          background: initial ;
          appearance: auto ;
          -webkit-appearance: auto ;
          margin-right: 8px ;
          cursor: pointer ;
          accent-color: #333 ;
          opacity: 1 ;
          visibility: visible ;
          pointer-events: auto ;
        }
        
        .krefrm-ui-style-2-field input[type="checkbox"] + label,
        .krefrm-ui-style-2-field input[type="radio"] + label {
          display: inline ;
          font-weight: normal ;
          margin-left: 0 ;
          cursor: pointer ;
          pointer-events: auto ;
        }
        
        .krefrm-ui-style-2-field fieldset {
          border: none ;
          padding: 0 ;
          margin: 0 ;
        }
        
        .krefrm-ui-style-2-field legend {
          display: block ;
          font-size: 13px ;
          font-weight: 700 ;
          text-transform: uppercase ;
          letter-spacing: 0.5px ;
          color: #444 ;
          margin-bottom: 8px ;
          padding: 0 ;
        }
        
        /* Select for Style 2 */
        .krefrm-ui-style-2-field select {
          width: 100% ;
          padding: 8px 10px ;
          border: 1px solid #bbb ;
          border-radius: 3px ;
          font-size: 14px ;
          background: #fff ;
          box-sizing: border-box ;
          color: #1d2327 ;
          appearance: none ;
          -webkit-appearance: none ;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E") ;
          background-repeat: no-repeat ;
          background-position: right 10px center ;
          padding-right: 32px ;
          cursor: pointer ;
        }
        
        .krefrm-ui-style-2-field select:focus {
          border-color: #333 ;
          outline: none ;
        }
        
        .krefrm-ui-style-2-btn {
          display: inline-flex ;
          align-items: center ;
          justify-content: center ;
          padding: 10px 24px ;
          font-size: 13px ;
          font-weight: 700 ;
          text-transform: uppercase ;
          letter-spacing: 0.5px ;
          color: #fff ;
          background: #333 ;
          border: none ;
          border-radius: 3px ;
          cursor: pointer ;
          transition: background 0.2s ;
          line-height: 1.3 ;
          text-decoration: none ;
        }
        
        .krefrm-ui-style-2-btn:hover {
          background: #555 ;
        }
        
        .krefrm-fields-flex {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        
        .krefrm-required-star {
          color: #d63638;
        }

        .krefrm-ui-style-1-form .krefrm-submit-feedback,
        .krefrm-ui-style-2-form .krefrm-submit-feedback {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 14px;
          line-height: 1.4;
          border: 1px solid transparent;
        }

        .krefrm-submit-feedback.is-hidden {
          display: none;
        }

        .krefrm-ui-style-1-form .krefrm-submit-feedback.is-loading,
        .krefrm-ui-style-2-form .krefrm-submit-feedback.is-loading {
          background: #f0f6fc;
          color: #1d4f91;
          border: 1px solid #b6d4fe;
        }

        .krefrm-ui-style-1-form .krefrm-submit-feedback.is-error,
        .krefrm-ui-style-2-form .krefrm-submit-feedback.is-error {
          background: #fcf0f1;
          color: #8a2424;
          border: 1px solid #f1b3b8;
        }

        .krefrm-ui-style-1-form .krefrm-submit-feedback.is-success,
        .krefrm-ui-style-2-form .krefrm-submit-feedback.is-success {
          background: #edf7ed;
          color: #1f5f31;
          border: 1px solid #9fd7a9;
        }

        /* Style 1 feedback tone: rounded + soft WP blue accents */
        .krefrm-ui-style-1-form .krefrm-submit-feedback {
          border-radius: 6px;
          font-size: 14px;
        }

        .krefrm-ui-style-1-form .krefrm-submit-feedback.is-loading {
          background: #f0f6fc;
          color: #1d4f91;
          border-color: #b6d4fe;
        }

        .krefrm-ui-style-1-form .krefrm-submit-feedback.is-error {
          background: #fcf0f1;
          color: #8a2424;
          border-color: #f1b3b8;
        }

        .krefrm-ui-style-1-form .krefrm-submit-feedback.is-success {
          background: #edf7ed;
          color: #1f5f31;
          border-color: #9fd7a9;
        }

        /* Style 2 feedback tone: flatter card + stronger borders/uppercase */
        .krefrm-ui-style-2-form .krefrm-submit-feedback {
          border-radius: 3px;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .krefrm-ui-style-2-form .krefrm-submit-feedback.is-loading {
          background: #f7f7f7;
          color: #333;
          border-color: #a8a8a8;
        }

        .krefrm-ui-style-2-form .krefrm-submit-feedback.is-error {
          background: #fff4f4;
          color: #6e1e1e;
          border-color: #c17d7d;
        }

        .krefrm-ui-style-2-form .krefrm-submit-feedback.is-success {
          background: #f2faf2;
          color: #205022;
          border-color: #7eb182;
        }

        button[disabled],
        input[type="submit"][disabled] {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        /* ─── Default styles for checkbox, radio, select (all templates) ─── */
        input[type="checkbox"],
        input[type="radio"] {
          min-width: 18px ;
          min-height: 18px ;
          width: 18px ;
          height: 18px ;
          padding: 0 ;
          border: initial ;
          background: initial ;
          appearance: auto ;
          -webkit-appearance: auto ;
          cursor: pointer ;
          accent-color: #2271b1 ;
          margin: 0 ;
          margin-right: 8px ;
          flex-shrink: 0 ;
          opacity: 1 ;
          visibility: visible ;
          pointer-events: auto ;
        }
        
        input[type="checkbox"] + label,
        input[type="radio"] + label {
          display: inline ;
          font-weight: normal ;
          margin-left: 0 ;
          cursor: pointer ;
          pointer-events: auto ;
        }
        
        .krefrm-checkbox-option,
        .krefrm-radio-option {
          display: flex ;
          align-items: center ;
          margin-bottom: 10px ;
          pointer-events: auto ;
          cursor: pointer ;
        }
        
        fieldset {
          border: none ;
          padding: 0 ;
          margin: 0 ;
        }
        
        legend {
          display: block ;
          font-size: 14px ;
          font-weight: 600 ;
          color: #1d2327 ;
          margin-bottom: 10px ;
          padding: 0 ;
        }
        
        select {
          width: 100% ;
          padding: 10px 14px ;
          border: 1px solid #c3c4c7 ;
          border-radius: 6px ;
          font-size: 14px ;
          background: #fff ;
          box-sizing: border-box ;
          color: #1d2327 ;
          appearance: none ;
          -webkit-appearance: none ;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232271b1' d='M6 9L1 4h10z'/%3E%3C/svg%3E") ;
          background-repeat: no-repeat ;
          background-position: right 10px center ;
          padding-right: 32px ;
          cursor: pointer ;
        }
        
        select:focus {
          border-color: #2271b1 ;
          box-shadow: 0 0 0 1px #2271b1 ;
          outline: none ;
        }
        
        p { margin: 0; }
        p button { margin-top: 10px; }
CSS;

    // Append custom CSS saved via the admin panel (if present)
    $custom_css_file = KREFRM_PLUGIN_DIR . 'includes/custom-css.css';
    $custom_css = '';
    if (file_exists($custom_css_file)) {
      $custom_css = file_get_contents($custom_css_file);
    }

    return $base_css . "\n\n/* Custom CSS (saved via admin settings) */\n" . $custom_css;
  }

  /**
   * Enqueue frontend CSS for form rendering.
   */
  private function enqueue_frontend_assets($captcha_settings = array())
  {
    $css_path = KREFRM_PLUGIN_DIR . 'assets/css/admin.css';
    $version  = file_exists($css_path) ? filemtime($css_path) : '1.1.1';

    wp_enqueue_style(
      'krefrm-frontend',
      KREFRM_PLUGIN_URL . 'assets/css/admin.css',
      array(),
      $version
    );

    // Enqueue custom CSS if it exists
    $custom_css_path = KREFRM_PLUGIN_DIR . 'includes/custom-css.css';
    if (file_exists($custom_css_path)) {
      $custom_css_version = filemtime($custom_css_path);
      wp_enqueue_style(
        'krefrm-custom-css',
        KREFRM_PLUGIN_URL . 'includes/custom-css.css',
        array('krefrm-frontend'),
        $custom_css_version
      );
    }

    if (! empty($captcha_settings['enabled']) && ! empty($captcha_settings['siteKey'])) {
      wp_enqueue_script(
        'krefrm-recaptcha-v3',
        'https://www.google.com/recaptcha/api.js?render=' . rawurlencode($captcha_settings['siteKey']),
        array(),
        '1.1.1',
        true
      );
    }
  }

  /**
   * Return sanitized global captcha settings used on frontend.
   */
  private function get_frontend_captcha_settings()
  {
    $settings = get_option('krefrm_settings', array());
    if (! is_array($settings)) {
      return array(
        'enabled' => false,
        'siteKey' => '',
      );
    }

    $integrations = isset($settings['integrations']) && is_array($settings['integrations'])
      ? $settings['integrations']
      : array();
    if (empty($integrations['captcha'])) {
      return array(
        'enabled' => false,
        'siteKey' => '',
      );
    }

    $captcha = isset($settings['captcha']) && is_array($settings['captcha'])
      ? $settings['captcha']
      : array();

    return array(
      'enabled' => ! empty($captcha['enabled']),
      'siteKey' => isset($captcha['siteKey']) ? sanitize_text_field($captcha['siteKey']) : '',
    );
  }

  /* ─── Helpers ─── */

  private function render_field($f, $form_id, $step_index, $field_index, $style_classes = array())
  {
    $name        = isset($f['name']) ? $f['name'] : 'field_' . $field_index;
    $key         = sanitize_key(preg_replace('/\s+/', '_', strtolower($name)));
    $type        = isset($f['type']) ? $f['type'] : 'text';
    if (! in_array($type, $this->allowed_types, true)) {
      $type = 'text';
    }
    $placeholder = isset($f['placeholder']) ? $f['placeholder'] : '';
    $required    = ! empty($f['required']);
    $options     = isset($f['options']) && is_array($f['options']) ? $f['options'] : array();

    // Auto-generated unique input id
    $input_id = 'krefrm_' . sanitize_key($form_id) . '_s' . $step_index . '_f' . $field_index;

    // Build wrapper classes: just field + any style template
    $wrapper_classes = 'krefrm-field';
    if (! empty($style_classes['field'])) {
      $wrapper_classes .= ' ' . $style_classes['field'];
    }

    // Label classes
    $label_class = ! empty($style_classes['label']) ? ' class="' . esc_attr($style_classes['label']) . '"' : '';

    // Input classes
    $input_class = ! empty($style_classes['input']) ? ' class="' . esc_attr($style_classes['input']) . '"' : '';

    $html = '<div class="' . $wrapper_classes . '">';

    $required_marker = $required ? ' <span class="krefrm-required-star">*</span>' : '';
    $label_text = esc_html($name) . $required_marker;

    // Handle checkbox, radio, and dropdown types
    if ($type === 'checkbox') {
      $html .= '<fieldset>';
      $html .= '<legend' . $label_class . '>' . $label_text . '</legend>';
      foreach ($options as $opt) {
        $opt_value = isset($opt['value']) ? sanitize_text_field($opt['value']) : '';
        $opt_label = isset($opt['label']) ? sanitize_text_field($opt['label']) : '';
        $opt_id    = $input_id . '_' . sanitize_key($opt_value);
        $html .= '<div class="krefrm-checkbox-option">';
        $html .= '<input type="checkbox" id="' . esc_attr($opt_id) . '" name="krefrm_fields[' . esc_attr($key) . '][]" value="' . esc_attr($opt_value) . '"' . $input_class;
        if ($required) {
          $html .= ' required';
        }
        $html .= ' />';
        $html .= '<label for="' . esc_attr($opt_id) . '">' . esc_html($opt_label) . '</label>';
        $html .= '</div>';
      }
      $html .= '</fieldset>';
    } elseif ($type === 'radio') {
      $html .= '<fieldset>';
      $html .= '<legend' . $label_class . '>' . $label_text . '</legend>';
      foreach ($options as $opt) {
        $opt_value = isset($opt['value']) ? sanitize_text_field($opt['value']) : '';
        $opt_label = isset($opt['label']) ? sanitize_text_field($opt['label']) : '';
        $opt_id    = $input_id . '_' . sanitize_key($opt_value);
        $html .= '<div class="krefrm-radio-option">';
        $html .= '<input type="radio" id="' . esc_attr($opt_id) . '" name="krefrm_fields[' . esc_attr($key) . ']" value="' . esc_attr($opt_value) . '"' . $input_class;
        if ($required) {
          $html .= ' required';
        }
        $html .= ' />';
        $html .= '<label for="' . esc_attr($opt_id) . '" style="display: inline; margin-left: 6px;">' . esc_html($opt_label) . '</label>';
        $html .= '</div>';
      }
      $html .= '</fieldset>';
    } elseif ($type === 'dropdown') {
      $html .= '<label for="' . esc_attr($input_id) . '"' . $label_class . '>' . $label_text . '</label>';
      $html .= '<select id="' . esc_attr($input_id) . '" name="krefrm_fields[' . esc_attr($key) . ']"' . $input_class;
      if ($required) {
        $html .= ' required';
      }
      $html .= '>';
      $html .= '<option value="">' . esc_html(__('Select an option', 'kreebi-forms')) . '</option>';
      foreach ($options as $opt) {
        $opt_value = isset($opt['value']) ? sanitize_text_field($opt['value']) : '';
        $opt_label = isset($opt['label']) ? sanitize_text_field($opt['label']) : '';
        $html .= '<option value="' . esc_attr($opt_value) . '">' . esc_html($opt_label) . '</option>';
      }
      $html .= '</select>';
    } else {
      // Text, email, password, number fields
      $html .= '<label for="' . esc_attr($input_id) . '"' . $label_class . '>' . $label_text . '</label>';
      $html .= '<input type="' . esc_attr($type) . '" id="' . esc_attr($input_id) . '" name="krefrm_fields[' . esc_attr($key) . ']" placeholder="' . esc_attr($placeholder) . '"' . $input_class;
      if ($required) {
        $html .= ' required';
      }
      $html .= ' />';
    }

    $html .= '</div>';

    return $html;
  }

  /**
   * Normalise form data into an array of steps.
   */
  private function normalise_steps($form_data)
  {
    if (! is_array($form_data)) {
      return array();
    }

    // New steps format
    if (! empty($form_data['steps']) && is_array($form_data['steps'])) {
      return $form_data['steps'];
    }

    // Legacy flat fields array → single step
    if (! empty($form_data['fields']) && is_array($form_data['fields'])) {
      return array(
        array(
          'name'   => '',
          'fields' => $form_data['fields'],
        ),
      );
    }

    return array();
  }

  /**
   * Inline JS for multi-step navigation (printed once per page).
   */
  private function get_multistep_script()
  {
    static $added = false;
    if ($added) {
      return '';
    }
    $added = true;

    return '<script>
(function(){
  document.addEventListener("click",function(e){
    var btn=e.target;
    if(!btn.classList.contains("krefrm-next-btn")&&!btn.classList.contains("krefrm-prev-btn"))return;
    var step=btn.closest(".krefrm-step");
    if(!step)return;
    var form=step.closest(".krefrm-multistep-form");
    if(!form)return;
    if(btn.classList.contains("krefrm-next-btn")){
      var inputs=step.querySelectorAll("input[required], select[required], textarea[required]");
      for(var i=0;i<inputs.length;i++){
        if(!inputs[i].checkValidity()){inputs[i].reportValidity();return;}
      }
    }
    var steps=form.querySelectorAll(".krefrm-step");
    var cur=parseInt(step.getAttribute("data-krefrm-step"),10);
    var nxt=btn.classList.contains("krefrm-next-btn")?cur+1:cur-1;
    if(nxt<0||nxt>=steps.length)return;
    step.style.display="none";
    step.classList.remove("krefrm-step-active");
    steps[nxt].style.display="";
    steps[nxt].classList.add("krefrm-step-active");
  });
})();
</script>';
  }
}
