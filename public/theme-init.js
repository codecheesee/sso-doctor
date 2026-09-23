// Applies the saved theme before first paint to avoid a light/dark flash.
(function () {
  try {
    var t = localStorage.getItem('sso-doctor:theme');
    var dark = t === '"dark"' || ((!t || t === '"system"') && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
