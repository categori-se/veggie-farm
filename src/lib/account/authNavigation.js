// Adapted from the owner’s OpenGeo browser authentication implementation.
export const DEFAULT_AUTH_RETURN_TO = "/studio";

export function normalizeAuthReturnTo(value, origin) {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value)) {
    throw returnLocationError();
  }
  let url;
  try {
    url = new URL(value, origin);
  } catch {
    throw returnLocationError();
  }
  const returnTo = `${url.pathname}${url.search}${url.hash}`;
  if (url.origin !== origin
    || !returnTo.startsWith("/")
    || returnTo.startsWith("//")
    || /^\/login(?:\.html)?\/?$/.test(url.pathname)
    || returnTo.length > 2048) {
    throw returnLocationError();
  }
  return returnTo;
}

export function requestedAuthReturnTo(
  locationImplementation = globalThis.location,
  fallback = DEFAULT_AUTH_RETURN_TO
) {
  const origin = locationImplementation?.origin;
  if (!origin) return fallback;
  let page;
  try {
    page = new URL(locationImplementation.href, origin);
  } catch {
    return fallback;
  }
  const requested = /^\/login(?:\.html)?\/?$/.test(page.pathname)
    ? page.searchParams.get("returnTo")
    : null;
  try {
    return normalizeAuthReturnTo(requested ?? fallback, origin);
  } catch {
    return fallback;
  }
}

export function currentProtectedReturnTo(
  locationImplementation = globalThis.location,
  fallback = DEFAULT_AUTH_RETURN_TO
) {
  const origin = locationImplementation?.origin;
  if (!origin) return fallback;
  try {
    return normalizeAuthReturnTo(locationImplementation.href, origin);
  } catch {
    return fallback;
  }
}

export function loginHrefForReturnTo(
  returnTo,
  locationImplementation = globalThis.location
) {
  const origin = locationImplementation?.origin;
  if (!origin) return "/login";
  let safe;
  try {
    safe = normalizeAuthReturnTo(returnTo, origin);
  } catch {
    safe = DEFAULT_AUTH_RETURN_TO;
  }
  const login = new URL("/login", origin);
  login.searchParams.set("returnTo", safe);
  return `${login.pathname}${login.search}`;
}

function returnLocationError() {
  return Object.assign(new TypeError("Return location is invalid"), {
    code: "return_location_invalid"
  });
}
