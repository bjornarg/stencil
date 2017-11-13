import { AppRegistry, BuildConfig, BuildContext } from '../../util/interfaces';
import { buildExpressionReplacer } from '../build/replacer';
import { createOnWarnFn, loadRollupDiagnostics } from '../../util/logger/logger-rollup';
import { generatePreamble, hasError } from '../util';
import { getAppPublicPath, getGlobalFileName, getGlobalDist, getGlobalWWW } from './app-file-naming';
import { transpiledInMemoryPlugin } from '../bundle/component-modules';


export async function generateAppGlobal(config: BuildConfig, ctx: BuildContext, appRegistry: AppRegistry) {
  const globalJsContents = await generateAppGlobalContents(config, ctx);

  if (globalJsContents.length) {
    appRegistry.global = getGlobalFileName(config);

    const globalJsContent = generateGlobalJs(config, globalJsContents);

    ctx.appFiles.global = globalJsContent;

    if (config.generateWWW) {
      const appGlobalWWWFilePath = getGlobalWWW(config);

      config.logger.debug(`build, app global www: ${appGlobalWWWFilePath}`);
      ctx.filesToWrite[appGlobalWWWFilePath] = globalJsContent;
    }

    if (config.generateDistribution) {
      const appGlobalDistFilePath = getGlobalDist(config);

      config.logger.debug(`build, app global dist: ${appGlobalDistFilePath}`);
      ctx.filesToWrite[appGlobalDistFilePath] = globalJsContent;
    }
  }

  return globalJsContents.join('\n').trim();
}


export function generateAppGlobalContents(config: BuildConfig, ctx: BuildContext) {
  let globalJsContents: string[] = [];

  return Promise.all([
    loadDependentGlobalJsContents(config, ctx),
    bundleProjectGlobal(config, ctx, config.namespace, config.global)

  ]).then(results => {
    const dependentGlobalJsContents = results[0];
    const projectGlobalJsContent = results[1];

    globalJsContents = globalJsContents.concat(dependentGlobalJsContents);

    if (projectGlobalJsContent) {
      globalJsContents.push(projectGlobalJsContent);
    }

  }).then(() => {
    return globalJsContents;
  });
}


function loadDependentGlobalJsContents(config: BuildConfig, ctx: BuildContext): Promise<string[]> {
  if (!ctx.manifest.dependentManifests) {
    return Promise.resolve([]);
  }

  const dependentManifests = ctx.manifest.dependentManifests
                                .filter(m => m.global && m.global.jsFilePath);

  return Promise.all(dependentManifests.map(dependentManifest => {
    return bundleProjectGlobal(config, ctx, dependentManifest.manifestName, dependentManifest.global.jsFilePath);
  }));
}


function bundleProjectGlobal(config: BuildConfig, ctx: BuildContext, namespace: string, entry: string): Promise<string> {
  // stencil by itself does not have a global file
  // however, other collections can provide a global js
  // which will bundle whatever is in the global, and then
  // prepend the output content on top of the core js
  // this way external collections can provide a shared global at runtime

  if (!entry) {
    // looks like they never provided an entry file, which is fine, so let's skip this
    return Promise.resolve(null);
  }

  // ok, so the project also provided an entry file, so let's bundle it up and
  // the output from this can be tacked onto the top of the project's core file
  // start the bundler on our temporary file
  return config.sys.rollup.rollup({
    input: entry,
    plugins: [
      config.sys.rollup.plugins.nodeResolve({
        jsnext: true,
        main: true
      }),
      config.sys.rollup.plugins.commonjs({
        include: 'node_modules/**',
        sourceMap: false
      }),
      transpiledInMemoryPlugin(config, ctx, 'es2015')
    ],
    onwarn: createOnWarnFn(ctx.diagnostics)

  }).catch(err => {
    loadRollupDiagnostics(config, ctx.diagnostics, err);
  })

  .then(rollupBundle => {
    // generate the bundler results
    if (hasError(ctx.diagnostics) || !rollupBundle) {
      return '';
    }

    return rollupBundle.generate({
      format: 'es'

    }).then(results => {
      // cool, so we balled up all of the globals into one string

      // replace build time expressions, like process.env.NODE_ENV === 'production'
      // with a hard coded boolean
      results.code = buildExpressionReplacer(config, results.code);

      // wrap our globals code with our own iife
      return wrapGlobalJs(namespace, results.code);
    });

  }).then(output => {

    ctx.manifest.global = ctx.moduleFiles[config.global];

    return output;
  });
}


function wrapGlobalJs(globalJsName: string, jsContent: string) {
  jsContent = (jsContent || '').trim();

  // just format it a touch better in dev mode
  jsContent = `\n/** ${globalJsName || ''} global **/\n\n${jsContent}`;

  const lines = jsContent.split(/\r?\n/);
  jsContent = lines.map(line => {
    if (line.length) {
      return '    ' + line;
    }
    return line;
  }).join('\n');

  return `\n(function(publicPath){${jsContent}\n})(publicPath);\n`;
}


export function generateGlobalJs(config: BuildConfig, globalJsContents: string[]) {
  const publicPath = getAppPublicPath(config);

  const output = [
    generatePreamble(config, 'es2015'),
    `(function(appNamespace,publicPath){`,
    `"use strict";\n`,
    globalJsContents.join('\n').trim(),
    `\n})("${config.namespace}","${publicPath}");`
  ].join('');

  return output;
}
