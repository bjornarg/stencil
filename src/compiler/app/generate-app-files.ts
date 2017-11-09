import { AppRegistry, BuildConfig, BuildContext, SourceTarget } from '../../util/interfaces';
import { GLOBAL_NAME } from '../../util/constants';
import { formatComponentRegistry } from '../../util/data-serialize';
import { generateCore } from './app-core';
import { generateAppGlobal, generateAppGlobalEs5 } from './app-global';
import { generateAppRegistry } from './app-registry';
import { generateLoader } from './app-loader';
import { hasError, normalizePath } from '../util';
import { setBuildConditionals } from './build-conditionals';


export async function generateAppFiles(config: BuildConfig, ctx: BuildContext) {
  if (hasError(ctx.diagnostics)) {
    return Promise.resolve();
  }

  const timespan = config.logger.createTimeSpan(`generateAppFiles: ${config.namespace} start`, true);

  // generaete the shared app registry object
  const appRegistry: AppRegistry = {
    namespace: config.namespace,
    components: formatComponentRegistry(ctx.registry)
  };

  // normal es2015 build
  const globalJsContents = await generateAppGlobal(config, ctx, appRegistry);

  // figure out which sections should be included in the core build
  const buildConditionals = setBuildConditionals(ctx, ctx.manifestBundles);
  buildConditionals.coreId = 'core';

  await generateCore(config, ctx, globalJsContents, buildConditionals);
  appRegistry.core = buildConditionals.fileName;


  if (config.es5Fallback) {
    // es5 build (if needed)
    const globalJsContentsEs5 = await generateAppGlobalEs5(config, ctx, appRegistry);

    const buildConditionalsEs5 = setBuildConditionals(ctx, ctx.manifestBundles);
    buildConditionalsEs5.coreId = 'core.pf';
    buildConditionalsEs5.es5 = true;
    buildConditionalsEs5.polyfills = true;
    buildConditionalsEs5.customSlot = true;

    await generateCore(config, ctx, globalJsContentsEs5, buildConditionalsEs5);
    appRegistry.corePolyfilled = buildConditionalsEs5.fileName;
  }

  // create a json file for the app registry
  await generateAppRegistry(config, ctx, appRegistry);

  // create the loader after creating the loader file name
  await generateLoader(config, ctx, appRegistry, appRegistry.components);

  timespan.finish(`generateAppFiles: ${config.namespace} finished`);
}


export function getAppFileName(config: BuildConfig) {
  return config.namespace.toLowerCase();
}


export function getRegistryJsonWWW(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.buildDir, appFileName, `${appFileName}.registry.json`));
}


export function getRegistryJsonDist(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.distDir, `${appFileName}.registry.json`));
}


export function getGlobalWWW(config: BuildConfig, sourceTarget: SourceTarget) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.buildDir, appFileName, `${appFileName}.${GLOBAL_NAME}${sourceTarget === 'es5' ? '.es5' : ''}.js`));
}


export function getGlobalDist(config: BuildConfig, sourceTarget: SourceTarget) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.distDir, appFileName, `${appFileName}.${GLOBAL_NAME}${sourceTarget === 'es5' ? '.es5' : ''}.js`));
}


export function getAppWWWBuildDir(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.buildDir, appFileName));
}

export function getAppDistDir(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.distDir, appFileName));
}
