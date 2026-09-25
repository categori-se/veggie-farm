# Community source and publication gate

The mixed development workspace is not the public repository. Its index and Git object store retain private operational history even when its main branch has no commits. Never push it, mirror its refs, or upload its historical source ZIP.

Prepare a new local candidate with:

```sh
python3 scripts/prepare-community-source.py --destination /tmp/veggie-farm-community-review
```

The destination must not exist and must be outside the mixed source tree. Selection includes both app interfaces, domain code, community tests and independent data. It excludes private services, deployment infrastructure, partner harvesting implementations, all media files, partner catalog descriptions, raw downloads, operational history, credentials, caches and Git history. No remote is created. Source hashes record the exact captured inputs; generated profile outputs have their own manifest hashes. This is a review candidate, not an approval.

In the candidate, run locked installation, `npm test`, `npm run validate:data`, `npm run validate:plants`, `npm run build`, and browser acceptance of both `/` and `/studio`. `npm run check:public` checks the source boundary; the build checks emitted output too. Keep external acquisition and private provenance checks separate. `npm run build` does not deploy or contact account services, but Observable may resolve browser dependencies from public registries.

## Rights and remaining review

The code license is GPL-3.0-only. All photographs, illustrations, fonts and model files are excluded, including derivatives. Their private rights records stay with the separately operated media service. Partner media must not receive direct source attribution contrary to the owner's agreements. Original articles and documentation use GPL-3.0-only, as authorized by the owner. Public-estate geometry/reconstructions remain incomplete and retain source lineage; MassGIS allows redistribution and derivative works under its [data-use policy](https://www.mass.gov/info-details/learn-about-massgis-data). Source maps, imagery and private comparison layers are not included. Browser and build-tool dependency notices have their own inventories and unresolved entries; a passing build does not establish notice completeness.

An allowlist and a secret-pattern scan do not prove copyright clearance or absence of every private value. Before publication, freeze the candidate, review the manifest, confirm content rights, scan image/binary metadata, validate licenses and browser dependencies, and record the exact checks. Keep private review evidence outside the public tree. A clean candidate may be initialized as a new local repository; never import mixed-workspace history.

Publication requires an explicit instruction for the reviewed candidate, destination and visibility. No push, remote creation, package publication, cloud upload or deployment is authorized by preparing it.
