import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const root = new URL('.', import.meta.url).pathname;
const output = process.env.MAKEFUN_OUTPUT_DIR || join(root, 'out');
const gameOut = join(output, 'game');
const shotsOut = join(output, 'screenshots');
await mkdir(output, { recursive: true });
await rm(gameOut, { recursive: true, force: true });
await rm(shotsOut, { recursive: true, force: true });
await rm(join(output, 'dossier.json'), { force: true });
await cp(join(root, 'game'), gameOut, { recursive: true });
await cp(join(root, 'screenshots'), shotsOut, { recursive: true });
const dossier = buildDossier(output, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, game_max_files: 993, game_max_bytes: 50331648, game_path_max_bytes: 1000 });
await writeFile(join(output, 'dossier.json'), dossier);
