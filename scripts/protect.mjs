// Если крадёте, то крадите ради реально хороших людей
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import JavaScriptObfuscator from 'javascript-obfuscator';

const dir = 'dist/assets';

const files = readdirSync(dir).filter((f) => /^index-.*\.js$/.test(f));
if (!files.length) throw new Error('Не найден файл сайта в dist/assets');

for (const f of files) {
  const path = join(dir, f);
  const code = readFileSync(path, 'utf8');
  const out = JavaScriptObfuscator.obfuscate(code, {
    target: 'browser',
    compact: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    splitStrings: false,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    selfDefending: true,
    disableConsoleOutput: false,
    sourceMap: false,
  }).getObfuscatedCode();
  const banner = '/*! CND Редактор © 2026 Kirill_Burnside. Все права защищены. Копирование и использование без разрешения автора запрещено. */\n// Если крадёте, то крадите ради реально хороших людей\n';
  writeFileSync(path, banner + out);
  console.log(`Защищён ${f}: ${(code.length / 1024).toFixed(0)} КБ → ${(out.length / 1024).toFixed(0)} КБ`);
}
