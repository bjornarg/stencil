import { BuildConfig, BuildContext } from '../../util/interfaces';
import { getAppWWWBuildDir } from './app-file-naming';
import { pathJoin } from '../util';


export function generateEs5DisabledMessage(config: BuildConfig, ctx: BuildContext) {
  // not doing an es5 right now
  // but it's possible during development the user
  // tests on a browser that doesn't support es2015
  const fileName = 'es5-build-disabled.js';

  if (!ctx.isRebuild) {
    // only write this once
    const filePath = pathJoin(config, getAppWWWBuildDir(config), fileName);
    ctx.filesToWrite[filePath] = getDisabledMessageScript();
  }

  return fileName;
}


function getDisabledMessageScript() {
  let html = `
  <div style="padding: 20px; line-height:22px; font-family: sans-serif;">
    <p style="font-weight: bold; margin-bottom: 30px;">This app is disabled for this browser.</p>

    <div>Developers:</div>
    <ul>
      <li>ES5 builds are disabled <strong>during development</strong> in order to speed up build times.</li>
      <li>Please see our <a href="https://stenciljs.com/docs/stencil-config" target="_blank">config docs</a> if you would like to develop on a browser that does not fully support ES2015 and custom elements.</li>
      <li>Note that by default, ES5 builds and polyfills are enabled during production builds.</li>
      <li>When testing browsers it is recommended to always test in production mode, and ES5 builds should always be enabled during production builds.</li>
    </ul>
  </div>
  `;

  html = `document.body.innerHTML = '${html.replace(/\r\n|\r|\n/g, '').replace(/\'/g, `\\'`).trim()}'`;

  // timeout just to ensure <body> is ready
  return `setTimeout(function(){ ${html} }, 10)`;
}
