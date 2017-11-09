import { AppRegistry, BuildConfig, BuildContext } from '../../util/interfaces';
import { formatComponentRegistry } from '../../util/data-serialize';
import { generateCore } from './app-core';
import { generateAppGlobal, generateAppGlobalEs5 } from './app-global';
import { generateAppRegistry } from './app-registry';
import { generateEs5DisabledMessage } from './app-es5-disabled';
import { generateLoader } from './app-loader';
import { hasError } from '../util';
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

  const coreFilename = await generateCore(config, ctx, globalJsContents, buildConditionals);
  appRegistry.core = coreFilename;


  if (config.es5Fallback) {
    // es5 build (if needed)
    const globalJsContentsEs5 = await generateAppGlobalEs5(config, ctx, appRegistry);

    const buildConditionalsEs5 = setBuildConditionals(ctx, ctx.manifestBundles);
    buildConditionalsEs5.coreId = 'core.pf';
    buildConditionalsEs5.es5 = true;
    buildConditionalsEs5.polyfills = true;
    buildConditionalsEs5.customSlot = true;

    const coreFilenameEs5 = await generateCore(config, ctx, globalJsContentsEs5, buildConditionalsEs5);
    appRegistry.corePolyfilled = coreFilenameEs5;

  } else {
    // not doing an es5 right now
    appRegistry.corePolyfilled = generateEs5DisabledMessage(config, ctx);
  }

  // create a json file for the app registry
  await generateAppRegistry(config, ctx, appRegistry);

  // create the loader after creating the loader file name
  await generateLoader(config, ctx, appRegistry);

  timespan.finish(`generateAppFiles: ${config.namespace} finished`);
}
