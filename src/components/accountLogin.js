import {createCognitoBrowserAuth} from '../lib/account/cognitoAuth.js';
import {requestedAuthReturnTo} from '../lib/account/authNavigation.js';

export function accountLogin() {
  const root = document.createElement('section');
  root.innerHTML = `<p role="status" aria-live="polite">Checking account sign-in…</p>
    <button type="button" data-sign-in hidden>Sign in</button>
    <button type="button" data-sign-out hidden>Sign out</button>
    <p><a href="/tools/my-garden">Open your private notebook</a> · <a href="https://studio.veggie.farm/">Open Garden Planning Studio</a></p>`;
  const status = root.querySelector('[role="status"]');
  const signIn = root.querySelector('[data-sign-in]');
  const signOut = root.querySelector('[data-sign-out]');
  let auth;
  const update = async () => {
    try {
      auth = createCognitoBrowserAuth();
      const session = await auth.initialize();
      if (session.status === 'callback_complete') {
        location.replace(session.returnTo);
        return;
      }
      if (session.status === 'configuration_error') {
        status.textContent = 'Account sign-in is not available yet. You can use the planner and download JSON backups without an account.';
        return;
      }
      const signedIn = session.status === 'signed_in';
      // Direct links can start authentication without another intermediary click.
      // Callback failures never auto-retry, avoiding redirect loops.
      if (!signedIn && new URL(location.href).searchParams.get('start') === '1' && ['signed_out','expired'].includes(session.status)) {
        status.textContent = 'Opening sign-in…';
        await auth.beginSignIn(requestedAuthReturnTo(globalThis.location, '/'));
        return;
      }
      signIn.hidden = signedIn;
      signOut.hidden = !signedIn;
      status.textContent = signedIn
        ? 'You are signed in. Signing in does not upload your browser’s garden plans.'
        : session.status === 'callback_error'
          ? 'Sign-in did not finish. Your local garden plans are unchanged. You can try again.'
          : session.status === 'expired'
            ? 'Your sign-in expired. Sign in again to use your account.'
            : 'Sign in to your account. Your existing local garden plans stay in this browser.';
    } catch {
      status.textContent = 'Sign-in needs browser session storage. You can still use the planner and download backups.';
    }
  };
  signIn.addEventListener('click', async () => {
    signIn.disabled = true;
    try { await auth.beginSignIn(requestedAuthReturnTo()); }
    catch { status.textContent = 'Could not start sign-in. Please try again.'; signIn.disabled = false; }
  });
  signOut.addEventListener('click', async () => {
    signOut.disabled = true;
    try { await auth.signOut(); }
    catch { status.textContent = 'Could not finish sign-out. Please try again.'; signOut.disabled = false; }
  });
  void update();
  return root;
}
