const redirectPage = document.body;
const redirectPath = redirectPage.dataset.redirectTo;

if (redirectPath) {
  const destination = new URL(redirectPath, window.location.href);
  if (!destination.hash && window.location.hash) destination.hash = window.location.hash;
  window.location.replace(destination);
}
