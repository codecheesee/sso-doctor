// Applies the saved theme before first paint to avoid a light/dark flash.
(function () {
  try {
    var t = localStorage.getItem('sso-doctor:theme');
    var dark = t === '"dark"' || ((!t || t === '"system"') && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#09090b' : '#ffffff');
  } catch (e) {}
})();
