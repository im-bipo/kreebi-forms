jQuery(document).ready(function ($) {
  "use strict";

  var deactivateLink = null;

  // Store reference to the deactivation link for later use, handling encoded and plain plugin slugs
  var pluginSlug = 'kreebi-forms/kreebi-forms.php';
  var encodedPluginSlug = encodeURIComponent(pluginSlug);

  var $deactivateLink = $('a[href*="action=deactivate"]').filter(function () {
    var href = this.href || '';
    try {
      href = decodeURIComponent(href);
    } catch (e) {
      // ignore malformed URI
    }

    return href.indexOf(pluginSlug) !== -1 || href.indexOf(encodedPluginSlug) !== -1;
  });

  if ($deactivateLink.length) {
    deactivateLink = $deactivateLink[0];
  }

  // Handle cancel button (close modal without deactivating)
  $(document).on("click", '[data-action="continue"]', function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Close the modal and leave the plugin active
    $("#krefrm-deactivation-modal").removeClass("show");
  });

  // Handle form submission
  $("#krefrm-deactivation-form").on("submit", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const form = this;
    const $submitBtn = $(form).find('button[type="submit"]');
    const originalText = $submitBtn.text();

    // Validate required field
    if (!$("#krefrm-reason").val()) {
      alert("Please select a reason for deactivation.");
      return;
    }

    // Show loading state
    $submitBtn.prop("disabled", true).text("Processing...");

    // Collect form data
    const formData = {
      action: "krefrm_submit_deactivation_survey",
      nonce: krefrmDeactivation.nonce,
      reason: $("#krefrm-reason").val(),
      feedback: $("#krefrm-feedback").val(),
      email: $("#krefrm-email").val(),
      delete_data: $("#krefrm-delete-data").is(":checked") ? "true" : "false",
    };

    // Submit survey
    $.ajax({
      type: "POST",
      url: krefrmDeactivation.ajaxUrl,
      data: formData,
      timeout: 30000,
      success: function (response) {
        // Close modal
        $("#krefrm-deactivation-modal").removeClass("show");

        // Proceed with deactivation
        if (deactivateLink) {
          deactivateLink.setAttribute("data-krefrm-approved", "true");
          window.location.href = deactivateLink.href;
        }
      },
      error: function (xhr, status, error) {
        console.error("Survey submission error:", error);

        if (
          confirm(
            "There was an error submitting your feedback. Would you still like to deactivate?",
          )
        ) {
          $("#krefrm-deactivation-modal").removeClass("show");

          if (deactivateLink) {
            deactivateLink.setAttribute("data-krefrm-approved", "true");
            window.location.href = deactivateLink.href;
          }
        } else {
          $submitBtn.prop("disabled", false).text(originalText);
        }
      },
    });
  });

  // Close modal when close button is clicked
  $(document).on("click", ".krefrm-modal-close", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $("#krefrm-deactivation-modal").removeClass("show");
  });

  // Close modal when clicking outside of it
  $(window).on("click", function (event) {
    const modal = $("#krefrm-deactivation-modal");
    if (event.target === modal[0]) {
      modal.removeClass("show");
    }
  });

  // Escape key closes modal (but continue with deactivation)
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") {
      const modal = $("#krefrm-deactivation-modal");
      if (modal.hasClass("show")) {
        modal.removeClass("show");
      }
    }
  });
});
