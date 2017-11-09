import { BuildConfig, BuildContext, BuildConditionals, SourceTarget } from '../../util/interfaces';
import { buildCoreContent } from './build-core-content';
import { generatePreamble, pathJoin } from '../util';
import { getAppPublicPath, getAppDistDir, getAppWWWBuildDir, getCoreFilename } from './app-file-naming';


export async function generateCore(config: BuildConfig, ctx: BuildContext, globalJsContent: string[], buildConditionals: BuildConditionals, sourceTarget: SourceTarget) {
  // mega-minify the core w/ property renaming, but not the user's globals
  // hardcode which features should and should not go in the core builds
  // process the transpiled code by removing unused code and minify when configured to do so
  const coreContent = await config.sys.getClientCoreFile({ staticName: 'core.build.js' });
  let jsContent = buildCoreContent(config, ctx, buildConditionals, coreContent);

  let globalContent = globalJsContent.join('\n').trim();
  if (globalContent.length) {
    // we've got global js to put in the core build too

    if (config.minifyJs) {
      // let's do another quick minify with
      // of just the user's globals, but not a mega minify
      const globalMinifyResults = config.sys.minifyJs(globalContent);
      if (globalMinifyResults.diagnostics) {
        ctx.diagnostics.push(...globalMinifyResults.diagnostics);

      } else {
        globalContent = globalMinifyResults.output.trim();
      }
    }

    // concat the global js and transpiled code together
    jsContent = `${globalContent}\n${jsContent}`;
  }

  // wrap the core js code together
  jsContent = wrapCoreJs(config, jsContent);

  if (buildConditionals.polyfills) {
    // this build wants polyfills so let's
    // add the polyfills to the top of the core content
    // the polyfilled code is already es5/minified ready to go
    const polyfillsContent = await getCorePolyfills(config);
    jsContent = polyfillsContent + '\n' + jsContent;
  }

  const coreFilename = getCoreFilename(config, buildConditionals.coreId, jsContent, sourceTarget);

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
    `(function(Context,appNamespace,hydratedCssClass,publicPath){`,
    `"use strict";\n`,
    `var s=document.querySelector("script[data-core='${APP_CORE_FILENAME_PLACEHOLDER}'][data-path]");`,
    `if(s){publicPath=s.getAttribute('data-path');}\n`,
    jsContent.trim(),
    `\n})({},"${config.namespace}","${config.hydratedCssClass}","${publicPath}",document);`
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
