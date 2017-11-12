import { BuildConfig, BuildContext, BuildConditionals } from '../../util/interfaces';
import { buildCoreContent } from './build-core-content';
import { generatePreamble, pathJoin } from '../util';
import { getAppPublicPath, getAppDistDir, getAppWWWBuildDir, getCoreFilename } from './app-file-naming';


export async function generateCore(config: BuildConfig, ctx: BuildContext, globalJsContent: string, buildConditionals: BuildConditionals) {
  // mega-minify the core w/ property renaming, but not the user's globals
  // hardcode which features should and should not go in the core builds
  // process the transpiled code by removing unused code and minify when configured to do so
  let jsContent = await config.sys.getClientCoreFile({ staticName: 'core.build.js' });

  if (globalJsContent) {
    // we've got global js to put in the core build too
    // concat the global js and transpiled code together
    jsContent = `${globalJsContent}\n${jsContent}`;
  }

  jsContent = buildCoreContent(config, ctx, buildConditionals, jsContent);

  // wrap the core js code together
  jsContent = wrapCoreJs(config, jsContent);

  if (buildConditionals.polyfills) {
    // this build wants polyfills so let's
    // add the polyfills to the top of the core content
    // the polyfilled code is already es5/minified ready to go
    const polyfillsContent = await getCorePolyfills(config);
    jsContent = polyfillsContent + '\n' + jsContent;
  }

  const coreFilename = getCoreFilename(config, buildConditionals.coreId, jsContent);

  if (ctx.appFiles[buildConditionals.coreId] === jsContent) {
    // build is identical from last, no need to resave
    return coreFilename;
  }
  ctx.appFiles[buildConditionals.coreId] = jsContent;

  // update the app core filename within the content
  jsContent = jsContent.replace(APP_CORE_FILENAME_PLACEHOLDER, coreFilename);

  if (config.generateWWW) {
    // write the www/build/ app core file
    const appCoreWWW = pathJoin(config, getAppWWWBuildDir(config), coreFilename);
    ctx.filesToWrite[appCoreWWW] = jsContent;
  }

  if (config.generateDistribution) {
    // write the dist/ app core file
    const appCoreDist = pathJoin(config, getAppDistDir(config), coreFilename);
    ctx.filesToWrite[appCoreDist] = jsContent;
  }

  return coreFilename;
}


export function wrapCoreJs(config: BuildConfig, jsContent: string) {
  const publicPath = getAppPublicPath(config);

  const output = [
    generatePreamble(config),
    `(function(Context,appNamespace,hydratedCssClass,publicPath,bundleIds){`,
    `"use strict";\n`,
    `var s=document.querySelector("script[data-core='${APP_CORE_FILENAME_PLACEHOLDER}'][data-path]");`,
    `if(s){publicPath=s.getAttribute('data-path');}\n`,
    jsContent.trim(),
    `\n})({},"${config.namespace}","${config.hydratedCssClass}","${publicPath}");`
  ].join('');

  return output;
}


export function getCorePolyfills(config: BuildConfig) {
  // first load up all of the polyfill content
  const readFilePromises = [
    'document-register-element.js',
    'object-assign.js',
    'promise.js',
    'fetch.js',
    'request-animation-frame.js',
    'closest.js',
    'performance-now.js'
  ].map(polyfillFile => {
    const staticName = config.sys.path.join('polyfills', polyfillFile);
    return config.sys.getClientCoreFile({ staticName: staticName });
  });

  return Promise.all(readFilePromises).then(results => {
    // concat the polyfills
    return results.join('\n').trim();
  });
}


export const APP_CORE_FILENAME_PLACEHOLDER = '__APP_CORE_FILENAME__';
