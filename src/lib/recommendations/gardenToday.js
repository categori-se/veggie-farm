import {evidenceByCrop, summarizeCropEvidence} from "../evidence/horticulturalEvidence.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const RULE_VERSION = "garden-today/1.2.0";

function toDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid date: ${value}`);
  return date;
}

function daysBetween(later, earlier) {
  return Math.round((toDate(later) - toDate(earlier)) / DAY_MS);
}

function addDays(value, days) {
  const date = toDate(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseMaturity(value) {
  // Legacy catalog estimate: the text does not encode a reliable start/end stage.
  // Do not feed broader species assertions into this parser. A future stage-aware
  // model must match cultivar, method and timing basis before estimating harvest.
  const numbers = String(value ?? "").match(/\d+/g)?.map(Number) ?? [];
  if (!numbers.length) return {min: null, max: null};
  if (/month/i.test(String(value))) return {min: numbers[0] * 30, max: numbers.at(-1) * 30};
  return {min: numbers[0], max: numbers.at(-1)};
}

function isWarmSeason(crop) {
  return crop.season === "Warm season";
}

function isGarlic(crop) {
  return crop.slug === "garlic";
}

function isFrostTolerant(crop) {
  return /frost tolerant|winter hardy/i.test(crop.frostTolerance);
}

function plantingAction(crop) {
  if (/not (usually )?recommended/i.test(crop.directSow)) return `Transplant: ${crop.transplant}.`;
  if (/not applicable/i.test(crop.directSow)) return crop.transplant;
  return `Direct sow: ${crop.directSow}.`;
}

function compareInputs(crop, rule, context, fields) {
  const runway=daysBetween(context.firstFrostDate,context.date),after=daysBetween(context.date,context.lastFrostDate);
  const maturity=parseMaturity(crop.daysToMaturity),buffer=context.riskPreference==='conservative'?14:context.riskPreference==='experimental'?0:7;
  const soil=context.soilTemperatureF,window=context.forecast?.next48Hours;
  const soilLabel=soil==null?'Not entered':rule.soilTempMinF!=null&&soil<rule.soilTempMinF?'Below starting estimate':rule.heatRiskAboveF!=null&&soil>rule.heatRiskAboveF&&!isWarmSeason(crop)?'Above heat caution':rule.soilTempMinF==null?'No threshold':'Within modeled range';
  const forecastChanged=fields.reasonCodes.some(code=>code.startsWith('NWS_'));
  return {
    timing:{label:isGarlic(crop)?'Fall garlic rule':after<0?`${-after} d before spring frost`:`${after} d after spring frost`,detail:crop.frostTolerance},
    soil:{label:soilLabel,detail:`${soil==null?'Unknown':`${soil}°F entered`}${rule.soilTempMinF==null?'':` · starts near ${rule.soilTempMinF}°F`}${rule.heatRiskAboveF==null?'':` · heat caution ${rule.heatRiskAboveF}°F`}`},
    runway:{label:isGarlic(crop)?'Overwintering crop':runway<0?'Past assumed frost':maturity.min==null?'Maturity unknown':runway<maturity.min+buffer?'Short runway':'Runway fits estimate',detail:`${runway>=0?`${runway} d to fall frost`:`${-runway} d past fall frost`}${isGarlic(crop)||maturity.min==null?'':` · ${maturity.min} d earliest + ${buffer} d buffer`}`},
    forecast:{label:context.forecastExcluded?'Outside forecast dates':!window?'Not loaded':window.minimumTemperatureF==null?'Temperature missing':forecastChanged?'Result reduced':!isWarmSeason(crop)?'Not modeled for this crop':'No further adjustment',detail:window?`${window.minimumTemperatureF==null?'Unknown low':`${Math.round(window.minimumTemperatureF)}°F low`} · ${window.hoursAvailable??'Unrecorded'} forecast hours`:context.forecastExcluded?'Loaded forecast not applied to this planting date':'Optional NWS input'}
  };
}

function applyForecastRisk(crop, context, fields) {
  const window = context.forecast?.next48Hours;
  if (!window || !isWarmSeason(crop) || ["too_early", "too_late"].includes(fields.status)) return fields;

  const next = {
    ...fields,
    reasonCodes: [...fields.reasonCodes],
    explanation: [...fields.explanation]
  };

  if (window.freezeRisk) {
    next.status = "possible_with_protection";
    next.score = Math.min(next.score, 58);
    next.reasonCodes.unshift("NWS_FREEZE_FORECAST");
    next.explanation.unshift(`The National Weather Service forecast includes ${window.freezeHours} hour${window.freezeHours === 1 ? "" : "s"} at or below 32°F in the next 48 hours.`);
    next.risk = "Delay planting tender crops, or protect them from the forecast freeze.";
  } else if (window.frostRisk) {
    if (next.status === "recommended") next.status = "caution";
    next.score = Math.min(next.score, 70);
    next.reasonCodes.unshift("NWS_NEAR_FROST_FORECAST");
    next.explanation.unshift(`The National Weather Service forecast falls to ${Math.round(window.minimumTemperatureF)}°F in the next 48 hours.`);
    next.risk = "A cold pocket may run below the gridded forecast; delay or protect tender plants.";
  }

  return next;
}

function result(crop, rule, context, fields) {
  const withSoil = context.soilTemperatureF == null && rule.soilTempMinF != null && fields.status === "recommended"
    ? {...fields,status:"caution",score:Math.min(fields.score,64),reasonCodes:["SOIL_NOT_RECORDED",...fields.reasonCodes],explanation:["Timing may fit, but no soil temperature is entered. Measure the seedbed before using this result."],risk:"Soil temperature has not been checked."}
    : fields;
  const adjustedFields = applyForecastRisk(crop, context, withSoil);
  const maturity = parseMaturity(crop.daysToMaturity);
  const harvestWindow = maturity.min == null ? null : {
    earliest: addDays(context.date, maturity.min),
    latest: addDays(context.date, maturity.max)
  };

  return {
    crop,
    comparisons: compareInputs(crop, rule, context, adjustedFields),
    status: adjustedFields.status,
    score: adjustedFields.score,
    reasonCodes: adjustedFields.reasonCodes,
    explanation: adjustedFields.explanation,
    risk: adjustedFields.risk,
    action: adjustedFields.action ?? plantingAction(crop),
    harvestWindow,
    ruleVersion: RULE_VERSION,
    confidenceClass: context.cropEvidence?.length ? "reviewed_extension_plus_estimate" : "editorial_plus_catalog_estimate",
    inputs: {
      date: context.date,
      lastFrostDate: context.lastFrostDate,
      firstFrostDate: context.firstFrostDate,
      soilTemperatureF: context.soilTemperatureF,
      riskPreference: context.riskPreference,
      forecast: context.forecast ? {
        provider: context.forecast.provider,
        generatedAt: context.forecast.generatedAt,
        next48Hours: context.forecast.next48Hours
      } : null
    },
    sources: [...new Set([
      ...rule.sourceIds,
      ...(context.cropEvidence ?? []).map((record) => record.sourceId),
      ...(context.forecast ? [context.forecast.sourceId] : [])
    ])],
    evidenceIds: (context.cropEvidence ?? []).map((record) => record.id),
    evidenceSummary: summarizeCropEvidence(context.cropEvidence ?? []),
    evidenceNote: context.cropEvidence?.length
      ? "Available regional benchmarks are retained as individual Extension facts. Soil-temperature guidance remains a cultivar-catalog estimate; confirm it with the seed packet."
      : rule.soilTempMinF == null
        ? "Timing uses veggie.farm editorial guidance."
        : "Soil-temperature guidance is a cultivar-catalog estimate; confirm it with the seed packet."
  };
}

function garlicRecommendation(crop, rule, context, frostRunway) {
  if (frostRunway >= 14 && frostRunway <= 42) {
    return result(crop, rule, context, {
      status: "recommended",
      score: 94,
      reasonCodes: ["FALL_GARLIC_WINDOW"],
      explanation: [`The first fall frost is ${frostRunway} days away, within the working fall garlic window used by this planner.`],
      risk: "Planting dates vary with winter severity and soil drainage.",
      action: crop.directSow
    });
  }
  if (frostRunway > 42 && frostRunway <= 70) {
    return result(crop, rule, context, {
      status: "caution",
      score: 64,
      reasonCodes: ["GARLIC_WINDOW_APPROACHING"],
      explanation: [`The first fall frost is still ${frostRunway} days away; bed preparation is timely, but planting can usually wait.`],
      risk: "Planting very early can produce excess top growth before winter.",
      action: "Prepare the bed now; hold cloves for the fall planting window."
    });
  }
  if (frostRunway < 14 && frostRunway >= -21) {
    return result(crop, rule, context, {
      status: "possible_with_protection",
      score: 70,
      reasonCodes: ["LATE_GARLIC_WINDOW"],
      explanation: [frostRunway >= 0 ? `The first frost is only ${frostRunway} days away.` : "The first frost date has passed, but garlic may still establish while soil is workable."],
      risk: "Late cloves have less time to establish roots before deep cold.",
      action: "Plant into well-drained soil and mulch after the ground begins to cool."
    });
  }
  return result(crop, rule, context, {
    status: "too_early",
    score: 28,
    reasonCodes: ["OUTSIDE_GARLIC_WINDOW"],
    explanation: ["This is outside the fall garlic window used by this planner."],
    risk: "Use local extension guidance in climates without a conventional winter cycle.",
    action: "Plan the bed and wait for fall."
  });
}

export function recommendCropToday(crop, rule, rawContext) {
  const context = {
    ...rawContext,
    date: toDate(rawContext.date).toISOString().slice(0, 10),
    lastFrostDate: toDate(rawContext.lastFrostDate).toISOString().slice(0, 10),
    firstFrostDate: toDate(rawContext.firstFrostDate).toISOString().slice(0, 10),
    soilTemperatureF: rawContext.soilTemperatureF == null || rawContext.soilTemperatureF === "" ? null : Number(rawContext.soilTemperatureF),
    riskPreference: rawContext.riskPreference ?? "typical"
  };
  if(context.forecast){
    const window=context.forecast.next48Hours;
    const start=(window?.startsAt||context.forecast.generatedAt||'').slice(0,10);
    const end=(window?.endsAt||context.forecast.generatedAt||'').slice(0,10);
    if(!start||context.date<start||context.date>end){context.forecast=null;context.forecastExcluded=true;}
  }
  if (context.soilTemperatureF != null && (!Number.isFinite(context.soilTemperatureF) || context.soilTemperatureF < 20 || context.soilTemperatureF > 110)) {
    throw new RangeError("soilTemperatureF must be between 20 and 110");
  }

  const afterLastFrost = daysBetween(context.date, context.lastFrostDate);
  const frostRunway = daysBetween(context.firstFrostDate, context.date);
  const maturity = parseMaturity(crop.daysToMaturity);
  const preferenceAdjustment = context.riskPreference === "conservative" ? 7 : context.riskPreference === "experimental" ? -7 : 0;
  const harvestBuffer = 7 + preferenceAdjustment;

  if (isGarlic(crop)) return garlicRecommendation(crop, rule, context, frostRunway);

  if (frostRunway < 0) return result(crop, rule, context, {
    status:isWarmSeason(crop)?"too_late":"caution", score:isWarmSeason(crop)?12:38,
    reasonCodes:["PAST_ASSUMED_FALL_FROST"],
    explanation:[`The assumed first fall frost is ${Math.abs(frostRunway)} days past. This model cannot establish a new planting window from frost tolerance alone.`],
    risk:"Check actual conditions, crop stage and protection before planting.",
    action:"Use local seasonal guidance and current measurements."
  });

  if (isWarmSeason(crop)) {
    if (afterLastFrost < preferenceAdjustment) {
      return result(crop, rule, context, {
        status: "too_early",
        score: 20,
        reasonCodes: ["FROST_RISK", "WARM_SEASON_CROP"],
        explanation: [`This tender crop is being evaluated ${Math.abs(afterLastFrost)} days before the last spring frost date.`],
        risk: "Cold soil or frost can stall or kill young plants.",
        action: crop.startIndoors === "Usually unnecessary" ? "Wait to sow outdoors." : `${crop.startIndoors}; do not plant outdoors yet.`
      });
    }
    if (maturity.min != null && frostRunway < maturity.min + harvestBuffer) {
      return result(crop, rule, context, {
        status: "too_late",
        score: 18,
        reasonCodes: ["INSUFFICIENT_FROST_FREE_DAYS"],
        explanation: [`About ${frostRunway} frost-free days remain, while this crop lists ${crop.daysToMaturity} days to maturity.`],
        risk: "A new planting is unlikely to mature before frost.",
        action: "Use the space for a quicker, cool-season crop."
      });
    }
    if (context.soilTemperatureF != null && rule.soilTempMinF != null && context.soilTemperatureF < rule.soilTempMinF) {
      return result(crop, rule, context, {
        status: "caution",
        score: 52,
        reasonCodes: ["SOIL_BELOW_PREFERRED_RANGE"],
        explanation: [`The entered soil temperature is ${context.soilTemperatureF}°F; catalog guidance for this crop commonly begins near ${rule.soilTempMinF}°F.`],
        risk: "Cool soil can slow emergence and early growth.",
        action: "Wait for warmer soil, or use a healthy transplant if the crop guide supports it."
      });
    }
    const nearFrostBoundary = afterLastFrost < 7 + preferenceAdjustment;
    return result(crop, rule, context, {
      status: nearFrostBoundary ? "caution" : "recommended",
      score: nearFrostBoundary ? 68 : 90,
      reasonCodes: nearFrostBoundary ? ["RECENT_FROST_BOUNDARY"] : ["FROST_AND_SOIL_FIT"],
      explanation: nearFrostBoundary
        ? [`Only ${afterLastFrost} days have passed since the last frost date; conditions are close to the risk boundary.`]
        : [`Frost timing, soil temperature, and the remaining season fit this crop's broad requirements.`],
      risk: nearFrostBoundary ? "A cold night can still set back tender plants." : context.forecast ? "Check the loaded forecast against conditions in your garden." : "Watch the forecast; no forecast is loaded.",
      action: crop.directSow
    });
  }

  const earliestSpringDay = -(Number(rule.springLeadWeeks ?? 0) * 7);
  if (afterLastFrost < earliestSpringDay - preferenceAdjustment) {
    return result(crop, rule, context, {
      status: "too_early",
      score: 30,
      reasonCodes: ["BEFORE_COOL_SEASON_WINDOW"],
      explanation: [`This date is earlier than the broad spring window used for ${crop.name.toLowerCase()}.`],
      risk: "Cold, saturated, or unworkable soil can prevent establishment.",
      action: crop.startIndoors
    });
  }
  if (maturity.min != null && frostRunway >= 0 && frostRunway < maturity.min + harvestBuffer && !isFrostTolerant(crop)) {
    return result(crop, rule, context, {
      status: "too_late",
      score: 28,
      reasonCodes: ["INSUFFICIENT_FALL_RUNWAY"],
      explanation: [`About ${frostRunway} days remain before first frost, less than the listed ${crop.daysToMaturity}-day maturity range.`],
      risk: "The crop may not reach a useful harvest before frost.",
      action: "Choose a quicker crop or add season protection."
    });
  }
  if (context.soilTemperatureF != null && rule.heatRiskAboveF != null && context.soilTemperatureF > rule.heatRiskAboveF) {
    return result(crop, rule, context, {
      status: "caution",
      score: 55,
      reasonCodes: ["HEAT_RISK"],
      explanation: [`The entered soil temperature is ${context.soilTemperatureF}°F, above this planner's broad cool-crop range.`],
      risk: "Warm conditions can reduce germination, quality, or time before bolting.",
      action: "Wait for cooling conditions, or sow a small trial with shade and steady moisture."
    });
  }
  if (context.soilTemperatureF != null && rule.soilTempMinF != null && context.soilTemperatureF < rule.soilTempMinF) {
    return result(crop, rule, context, {
      status: "possible_with_protection",
      score: 62,
      reasonCodes: ["COOL_SOIL"],
      explanation: [`The entered soil temperature is ${context.soilTemperatureF}°F, below the working germination estimate of ${rule.soilTempMinF}°F.`],
      risk: "Emergence may be slow or uneven.",
      action: "Use row cover or wait for a warmer seedbed."
    });
  }

  const canReachEarlyHarvest = maturity.min == null || frostRunway < 0 || frostRunway >= maturity.min + harvestBuffer;
  return result(crop, rule, context, {
    status: canReachEarlyHarvest ? "recommended" : "possible_with_protection",
    score: canReachEarlyHarvest ? 92 : 66,
    reasonCodes: canReachEarlyHarvest ? ["SEASONAL_WINDOW_FITS"] : ["TIGHT_FALL_WINDOW", "FROST_TOLERANT"],
    explanation: canReachEarlyHarvest
      ? [`The crop's season, entered soil temperature, and frost runway support planting now.`]
      : [`The fall window is tight, but this crop has some frost tolerance.`],
    risk: canReachEarlyHarvest ? "Keep the seedbed evenly moist and watch the forecast." : "Growth slows as days shorten; protection may be needed.",
    action: crop.directSow
  });
}

export function recommendGardenToday(crops, rules, context, evidenceDataset = []) {
  const ruleBySlug = new Map(rules.map((rule) => [rule.slug, rule]));
  const evidenceIndex = evidenceByCrop(evidenceDataset);
  return crops
    .filter((crop) => ruleBySlug.has(crop.slug))
    .map((crop) => recommendCropToday(crop, ruleBySlug.get(crop.slug), {
      ...context,
      cropEvidence: evidenceIndex.get(crop.slug) ?? []
    }))
    .sort((a, b) => b.score - a.score || a.crop.name.localeCompare(b.crop.name));
}

export function summarizeGardenContext(context) {
  const frostRunway = daysBetween(context.firstFrostDate, context.date);
  const afterLastFrost = daysBetween(context.date, context.lastFrostDate);
  return {frostRunway, afterLastFrost};
}
