import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Fresh runs stay out of the versioned evidence in artifacts/qa.
const root = process.env.QA_OUTPUT_DIR
  ? resolve(process.env.QA_OUTPUT_DIR)
  : fileURLToPath(new URL('../../test-results/', import.meta.url));

export const qaPath = (relative = '') => resolve(root, relative);
export const qaDirectory = (relative = '') => pathToFileURL(qaPath(relative) + sep);
