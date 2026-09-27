// General site-selection guidance, not a species minimum or a yield forecast.
export const LIGHT_GUIDANCE_SOURCE = 'https://www.extension.umd.edu/resource/how-start-vegetable-garden';
export function lightGuidance(value) {
 const hours=typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=24?value:null;
 if(hours===null)return {state:'unknown',label:'? Light unknown',detail:'Record direct sun hours for this bed on a representative growing-season day. No light match has been established.',hours:null,source:LIGHT_GUIDANCE_SOURCE};
 return {state:hours>=6?'match':'check',label:hours>=6?'✓ General sun guidance met':'! Check light',hours,source:LIGHT_GUIDANCE_SOURCE,
  detail:`${hours} recorded hours; the general vegetable-site benchmark is at least 6. This is not a crop-specific minimum. Shade-tolerant crops may still be useful below it. Seasonal shade, heat and crop response need checking.`};
}
