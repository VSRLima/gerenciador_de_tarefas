import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let loaded = false;

export const loadEnvironment = (): void => {
  if (loaded) {
    return;
  }

  const candidateEnvPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', '..', '.env'),
  ];

  const envPath = candidateEnvPaths.find((candidate) =>
    fs.existsSync(candidate),
  );

  if (envPath) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }

  loaded = true;
};
