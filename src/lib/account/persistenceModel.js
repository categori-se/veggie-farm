import {NOTEBOOK_STORAGE} from '../../data/runtime-capabilities.js';
const local = NOTEBOOK_STORAGE === 'local';
// Shared product contract, rendered at build time wherever persistence is explained.
// Match changes here to the account API and browser recovery behavior before release.
export const PERSISTENCE = Object.freeze({
  notebook: Object.freeze(local ? {mode:'browser-local',upload:'none',browserDraft:true,summary:'Garden Notebook saves only in this browser. No account is required.',detail:'Export a backup before clearing browser data or moving to another device. No notebook data is uploaded.'} : {mode: 'private-account', upload: 'automatic-after-record', browserDraft: true,
    summary: 'Garden Notebook saves privately to your individual account, with an unsent browser draft retained if saving is interrupted.',
    detail: 'Sign in to load your notebook in another browser. Recorded changes save automatically to your private account. If saving fails or another browser has saved a newer version, your unsent draft stays in this browser. Check the save status and export a backup before replacing a draft or clearing browser data.'}),
  studio: Object.freeze({mode: 'private-account-copies', upload: 'explicit', browserDraft: true,
    summary: local ? 'Studio saves in this browser. Export a planner backup to move your gardens to another device.' : 'Studio keeps a browser draft; save or update an account copy explicitly to recover your personal gardens on another browser. Public demo edits do not change the published reference.'}),
  boundary: local ? 'Notebook records and Studio plans are separate browser-local records. Export each to keep backups.' : 'Notebook records and Studio plans are separate private records. Public guides and decision tools work without an account.'
});
export const persistenceCopy = Object.freeze({
  'notebook-persistence': PERSISTENCE.notebook.summary,
  'notebook-persistence-detail': PERSISTENCE.notebook.detail,
  'studio-persistence': PERSISTENCE.studio.summary,
  'storage-boundary': PERSISTENCE.boundary
});
