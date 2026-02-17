/**
 * Kreebi Forms - Admin JavaScript
 */

(function () {
  "use strict";

  // Modal functionality
  document.addEventListener("DOMContentLoaded", function () {
    var openBtn = document.getElementById("krefrm-open-modal");
    var closeBtn = document.getElementById("krefrm-close-modal");
    var overlay = document.getElementById("krefrm-modal-overlay");

    if (!openBtn || !closeBtn || !overlay) {
      return;
    }

    // Open modal
    openBtn.addEventListener("click", function () {
      overlay.style.display = "flex";
    });

    // Close modal via close button
    closeBtn.addEventListener("click", function () {
      overlay.style.display = "none";
    });

    // Close modal via overlay click
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        overlay.style.display = "none";
      }
    });
  });
})();
