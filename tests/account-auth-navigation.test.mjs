import assert from "node:assert/strict";
import {describe, it} from "node:test";

import {
  currentProtectedReturnTo,
  loginHrefForReturnTo,
  normalizeAuthReturnTo,
  requestedAuthReturnTo
} from "../src/lib/account/authNavigation.js";

const ORIGIN = "https://veggie.farm";

describe("authentication return navigation", () => {
  it("retains a protected project, map, panel, and fragment exactly", () => {
    const href = `${ORIGIN}/studio?project=6ea563fe-920a-480f-8cab-9ac481de3a88&map=a6d1d11d-0cda-4b49-ac36-9be25be9a36d&panel=data#connections`;
    assert.equal(
      currentProtectedReturnTo(location(href)),
      "/studio?project=6ea563fe-920a-480f-8cab-9ac481de3a88&map=a6d1d11d-0cda-4b49-ac36-9be25be9a36d&panel=data#connections"
    );
  });

  it("round-trips a selected destination through the login URL", () => {
    const returnTo = "/studio?new=1#teams";
    const href = loginHrefForReturnTo(returnTo, location(`${ORIGIN}/studio`));
    assert.equal(href, "/login?returnTo=%2Fstudio%3Fnew%3D1%23teams");
    assert.equal(requestedAuthReturnTo(location(`${ORIGIN}${href}`)), returnTo);
  });

  it("rejects cross-origin, login-loop, protocol-relative, control, and oversized targets", () => {
    for (const value of [
      "https://attacker.example/studio",
      "/login",
      "//attacker.example/studio",
      "/studio\nnext",
      `/${"x".repeat(2048)}`
    ]) {
      assert.throws(() => normalizeAuthReturnTo(value, ORIGIN), /Return location is invalid/);
    }
  });

  it("falls back to Projects for invalid or missing requested destinations", () => {
    assert.equal(
      requestedAuthReturnTo(location(`${ORIGIN}/login?returnTo=https%3A%2F%2Fattacker.example%2F`)),
      "/studio"
    );
    assert.equal(requestedAuthReturnTo(location(`${ORIGIN}/login`)), "/studio");
    assert.equal(
      currentProtectedReturnTo(location("https://attacker.example/studio")),
      "/studio"
    );
  });
});

function location(href) {
  return {href, origin: ORIGIN};
}
