# Public judging access and AWS hosting

Verified September 26, 2026. The public application is served from an Amazon S3 website origin through Amazon CloudFront. The inspected CloudFront distribution is enabled and deployed, with no attached WAF, geographic restriction or viewer signed-URL requirement. Public DNS uses DNS Made Easy; Cloudflare was not observed in the delivery path.

- Primary judge/demo URL: https://studio.veggie.farm/
- Direct AWS HTTPS demo URL: https://d3db2n9ly8ygq2.cloudfront.net/studio.html
- AWS and coding-agent evidence: https://veggie.farm/about/build-evidence
- Public crawler policy: https://studio.veggie.farm/robots.txt

Both browser and GPTBot user-agent HTTP requests returned the Studio page without authentication. A fresh Chromium check through the direct CloudFront hostname passed practice start, planting-date edit, export, reload and reimport at 390 and 1440 pixels, without a cloud login or server writes. These checks do not impersonate AWS's private scoring infrastructure or guarantee future availability.

The source build emits a plain-text `robots.txt` allowing all public paths. This replaces the previous HTML fallback at that URL. It expresses crawling permission, not authorization to read private account data. Interactive planning requires JavaScript; descriptive content and evidence links are present in the HTML.

S3 website hosting is already enabled. Its raw HTTP endpoint, http://veggie.farm.s3-website-us-east-1.amazonaws.com/studio.html, returns HTML, but is **not a supported interactive demo URL**: the browser lacks a secure context and Studio's `crypto.randomUUID` call fails there. Use the HTTPS CloudFront URL above for the S3-backed app. [AWS documents that S3 website endpoints do not support HTTPS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteEndpoints.html).

The existing production origin is an S3 website endpoint. The community's [private S3/OAC deployment template](../../examples/aws/DEPLOYMENT.md) is an alternative hosting configuration, not a literal description of the current production origin. This verification did not alter bucket permissions, account-service authentication or DNS.

Different hostnames have separate browser storage. Use the primary Studio hostname for normal work; exported JSON backups can transfer a local sample. Cloud login on the alternate AWS hostname was not tested or enabled for this check.
