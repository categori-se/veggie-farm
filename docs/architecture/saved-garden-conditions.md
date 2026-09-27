# Selected garden conditions in Today

The account garden selector emits the selected workspace through an injected callback. Today binds that value to its existing Observable inputs. Selecting a garden replaces the guidance inputs with its linked garden profile; selecting a garden with missing conditions does not borrow values from a different Notebook.

Valid frost month/day settings are expanded for the current year. Missing or impossible dates stay blank. Planting guidance and scenario comparisons wait for a valid planting date and ordered spring/fall frost dates. Without a selected garden, initial Notebook settings remain available; clearing or switching owners resets to labeled starter assumptions without retaining the previous account's conditions.

A saved soil temperature is enabled only when measured today and within the existing input range. Old, undated, future and out-of-range measurements remain excluded. A different planning date excludes the saved same-day measurement. Editing these controls changes a scenario, not the saved garden.

Changing gardens resets the optional weather-request button. It does not initiate a location lookup or weather fetch, or carry the previous forecast into the newly selected garden.

Pure tests cover selected-garden precedence, missing values, strict dates, soil reading age/range and clearing. Desktop/mobile compiled-page acceptance uses a simulated account client and three synthetic gardens, verifies the existing guidance controls and unknown states, and checks account clearing and explicit-only weather behavior. Real authenticated cross-device acceptance remains outstanding.

Remaining: per-bed light/soil context, condition editing directly from Today, forecast tied to an explicitly chosen garden location, cross-domain selection continuity and the full user-journey goal.
