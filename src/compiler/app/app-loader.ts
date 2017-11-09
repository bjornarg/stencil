import { AppRegistry, BuildConfig, BuildContext, LoadComponentRegistry } from '../../util/interfaces';
import { LOADER_NAME, APP_NAMESPACE_REGEX } from '../../util/constants';
import { generatePreamble, normalizePath } from '../util';
import { getAppFileName } from './app-file-naming';
import { getAppPublicPath } from './app-core';


export async function generateLoader(
  config: BuildConfig,
  ctx: BuildContext,
  appRegistry: AppRegistry
) {
  const appFileName = getAppFileName(config);
  const appLoader = `${appFileName}.js`;
  appRegistry.loader = `../${appLoader}`;


  let loaderContent = await config.sys.getClientCoreFile({ staticName: `${LOADER_NAME}.js` });

  loaderContent = injectAppIntoLoader(
    config,
    appRegistry.core,
    appRegistry.corePolyfilled,
    appRegistry.components,
    loaderContent
  );

  if (config.minifyJs) {
    // minify the loader
    const minifyJsResults = config.sys.minifyJs(loaderContent);
    minifyJsResults.diagnostics.forEach(d => {
      config.logger[d.level](d.messageText);
    });
    if (!minifyJsResults.diagnostics.length) {
      loaderContent = minifyJsResults.output;
    }
  }

  // concat the app's loader code
  const appCode: string[] = [
    generatePreamble(config),
    loaderContent
  ];

  loaderContent = appCode.join('').trim();

  // write the app loader file
  if (ctx.appFiles.loader !== loaderContent) {
    // app loader file is actually different from our last saved version
    config.logger.debug(`build, app loader: ${appLoader}`);
    ctx.appFiles.loader = loaderContent;

    if (config.generateWWW) {
      const appLoaderWWW = normalizePath(config.sys.path.join(config.buildDir, appLoader));
      ctx.filesToWrite[appLoaderWWW] = loaderContent;
    }

    if (config.generateDistribution) {
      const appLoaderDist = normalizePath(config.sys.path.join(config.distDir, appLoader));
      ctx.filesToWrite[appLoaderDist] = loaderContent;
    }

    ctx.appFileBuildCount++;
  }

  return loaderContent;
}


export function injectAppIntoLoader(
  config: BuildConfig,
  appCoreFileName: string,
  appCorePolyfilledFileName: string,
  componentRegistry: LoadComponentRegistry[],
  loaderContent: string
) {
  const componentRegistryStr = JSON.stringify(componentRegistry);

  const publicPath = getAppPublicPath(config);

  loaderContent = loaderContent.replace(
    APP_NAMESPACE_REGEX,
    `"${config.namespace}","${publicPath}","${appCoreFileName}","${appCorePolyfilledFileName}",${componentRegistryStr}`
  );

  return loaderContent;
}
