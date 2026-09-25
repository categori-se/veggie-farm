// SPDX-License-Identifier: GPL-3.0-only
// Viewer-request function. URI rewrites keep host-specific documents in distinct cache keys.
// Shared assets and the main gardening homepage retain their existing paths.
function handler(event) {
  var request = event.request;
  var host = request.headers.host && request.headers.host.value.toLowerCase();
  if (host !== 'studio.example.org') return request;
  if (request.uri === '/' || request.uri === '/index.html' || request.uri === '/studio' || request.uri === '/studio.html' || request.uri === '/studio/') {
    request.uri = '/studio.html';
  } else if (request.uri === '/auth-config.json') {
    request.uri = '/studio-auth-config.json';
  } else if (request.uri === '/login' || request.uri === '/login/') {
    request.uri = '/login.html';
  }
  return request;
}
