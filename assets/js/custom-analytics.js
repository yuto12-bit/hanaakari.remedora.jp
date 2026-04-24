document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('[data-ga4-event]');

  targets.forEach((el) => {
    el.addEventListener('click', () => {
      const eventName = el.dataset.ga4Event;

      if (typeof gtag !== 'function' || !eventName) return;

      const params = {
        page_path: location.pathname
      };

      Object.keys(el.dataset).forEach((key) => {
        if (key === 'ga4Event') return;
        if (!key.startsWith('ga4')) return;

        const paramName = key
          .replace(/^ga4/, '')
          .replace(/^[A-Z]/, (m) => m.toLowerCase())
          .replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

        params[paramName] = el.dataset[key];
      });

      gtag('event', eventName, params);
    });
  });
});