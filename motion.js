// motion.js — one-shot scroll-reveal for cards and list items.
//
// Self-contained: no edits to any render function. A MutationObserver on
// <body> catches every SPA re-render (tab switch, checklist open, modal
// open) and hands freshly added targets to an IntersectionObserver, which
// reveals each one the first time it scrolls into the viewport, then
// forgets it. prefers-reduced-motion short-circuits to an instant reveal.
(function () {
  'use strict';

  var SELECTOR =
    '.card, .audit-item, .field-check-card, .stat-card, .template-format-card, .export-card';

  if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) {
    // Unsupported: never add motion-ready, so the hidden-state CSS
    // (scoped to body.motion-ready) never applies and everything shows.
    return;
  }

  var body = document.body;
  body.classList.add('motion-ready');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var io = new IntersectionObserver(
    function (entries) {
      var batch = 0;
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var el = entries[i].target;
        io.unobserve(el);
        el.style.transitionDelay = Math.min(batch, 6) * 80 + 'ms';
        el.classList.add('is-revealed');
        batch++;
      }
    },
    { root: null, threshold: 0.05, rootMargin: '0px 0px -6% 0px' }
  );

  function scan() {
    var targets = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      if (el.classList.contains('is-revealed') || el.dataset.revealSeen) continue;
      el.dataset.revealSeen = '1';
      if (reduce.matches) {
        el.classList.add('is-revealed');
      } else {
        io.observe(el);
      }
    }
  }

  var pending = 0;
  var mo = new MutationObserver(function () {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = 0;
      scan();
    });
  });
  mo.observe(body, { childList: true, subtree: true });

  // If the user flips the OS setting mid-session, re-evaluate.
  var onReduceChange = function () { scan(); };
  if (reduce.addEventListener) reduce.addEventListener('change', onReduceChange);
  else if (reduce.addListener) reduce.addListener(onReduceChange);

  scan();
})();
