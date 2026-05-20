/** Barrel for API route handlers (domain modules under server/api/handlers). */
export { handleHealthGet } from './api/handlers/health';
export { handleCdrIngestPost, getCdr } from './api/handlers/cdr';
export { handleDevicesStreamGet } from './api/handlers/devices';
export { handleExtensionsGet, handleExtensionsPost } from './api/handlers/extensions';
export { handleOriginatePost } from './api/handlers/originate';
export { handlePhonebookLookupGet } from './api/handlers/phonebook';
export { handleGuidancesPost } from './api/handlers/guidance';
export { handleRecordingGet, ensureRecordingFixture } from './api/handlers/recording';
