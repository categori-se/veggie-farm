# Regional map-data connections

The Map data for your garden workspace (`/tools/regional-garden-data`) adds explicit source discovery for MA, VT, CT, NJ, NC, WI, NY, MN and ME. The state selector uses approximate coverage envelopes only; it does not assert administrative boundary membership. Do not use it to infer a legal jurisdiction.

Implemented: official state catalog links; explicit, bounded USGS catalog queries (100/250/500 m radius supported by helper; UI uses 250 m, maximum 20 records); source metadata/download links; JSON discovery export; state-selected USDA mapped-soil queries. Network requests omit credentials; coordinates are sent only on explicit lookup. Responses and links are bounded/validated. Changing the location or state aborts requests and clears stale results. Results are not persisted to garden state or sent to an account.

MassGIS numeric terrain stays MA-only. Manual Studio spatial review remains the path for exported/reprojected state data. This release does not implement regional address search, automatic parcel capture, state imagery streaming or point-cloud processing. Browser CORS/service availability can affect lookup; state catalog links remain the fallback. Soil coverage can be missing. Regional planting advice is not implied by GIS coverage.

## Official sources reviewed

- MA: https://www.mass.gov/info-details/massgis-data-layers
- VT: https://vcgi.vermont.gov/data-and-programs/data-status (municipal parcel and elevation-product status)
- CT: https://geodata.ct.gov/ and https://portal.ct.gov/datapolicy/gis-office/parcel-and-cama (local completeness/accuracy varies)
- NJ: https://nj.gov/njgin/ and https://www.nj.gov/njgin/edata/elevation/ (current services, imagery and elevation)
- NC: https://www.nconemap.gov/ and https://services.nconemap.gov/secure/rest/services/NC1Map_Parcels/FeatureServer (county-derived geometry)
- WI: https://www.sco.wisc.edu/data/ and https://www.sco.wisc.edu/parcels/data/
- NY: https://data.gis.ny.gov/ (service migrations; parcel, imagery and elevation catalogs)
- MN: https://gis.data.mn.gov/ and https://mntopo.gis.data.mn.gov/help-page/site/access/ (terrain STAC and image services)
- ME: https://www.maine.gov/geolib/ (municipal parcel submissions; imagery-specific terms)

Each imported layer needs its own license, acquisition date, source ID, units and CRS. Catalog availability is not a redistribution license. Keep private source archives, imagery, models and parcel-owner attributes out of the public code repository. Source-only users supply and manage their own site information.

## Next integration stages

Add provider-specific parcel adapters with allowlisted non-personal attributes, bounded geometry queries, dated imagery and a review-before-apply step. Track connection status separately for discovery, metadata validation, successful query, spatial review and hosted browser acceptance. Normalize horizontal/vertical units before combining elevation and objects. Never treat a bare-earth DEM as a canopy model.
