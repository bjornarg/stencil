import { BuildConfig, SourceTarget } from '../../util/interfaces';
import * as ts from 'typescript';


export function getUserTsConfig(config: BuildConfig, sourceTarget: SourceTarget): ts.CompilerOptions {
  // force defaults
  const options: ts.CompilerOptions = {
    // to allow jsx to work
    jsx: ts.JsxEmit.React,

    // the factory function to use
    jsxFactory: 'h',

    // transpileModule does not write anything to disk so there is no need
    // to verify that there are no conflicts between input and output paths.
    suppressOutputPathCheck: true,

    // Clear out other settings that would not be used in transpiling this module
    lib: [
      'lib.dom.d.ts',
      'lib.es5.d.ts',
      'lib.es2015.d.ts',
      'lib.es2016.d.ts',
      'lib.es2017.d.ts'
    ],

    allowSyntheticDefaultImports: true,

    // must always allow decorators
    experimentalDecorators: true,

    // create es2015 modules
    module: ts.ModuleKind.ES2015,

    // resolve using NodeJs style
    moduleResolution: ts.ModuleResolutionKind.NodeJs
  };

  if (sourceTarget === 'es5') {
    options.target = ts.ScriptTarget.ES5;

  } else {
    options.target = ts.ScriptTarget.ES2015;
  }

  if (config._isTesting) {
    options.module = ts.ModuleKind.CommonJS;
  }

  // apply user config to tsconfig
  options.outDir = config.collectionDir;
  options.rootDir = config.srcDir;

  // generate .d.ts files when generating a distribution and in prod mode
  options.declaration = config.generateDistribution;

  return options;
}


export const DEFAULT_COMPILER_OPTIONS: ts.CompilerOptions = {

  // to allow jsx to work
  jsx: ts.JsxEmit.React,

  // the factory function to use
  jsxFactory: 'h',

  // transpileModule does not write anything to disk so there is no need
  // to verify that there are no conflicts between input and output paths.
  suppressOutputPathCheck: true,

  // // Clear out other settings that would not be used in transpiling this module
  lib: [
    'lib.dom.d.ts',
    'lib.es5.d.ts',
    'lib.es2015.d.ts',
    'lib.es2016.d.ts',
    'lib.es2017.d.ts'
  ],

  // We are not doing a full typecheck, we are not resolving the whole context,
  // so pass --noResolve to avoid reporting missing file errors.
  // noResolve: true,

  allowSyntheticDefaultImports: true,

  // must always allow decorators
  experimentalDecorators: true,

  // transpile down to es5
  target: ts.ScriptTarget.ES5,

  // create es2015 modules
  module: ts.ModuleKind.ES2015,

  // resolve using NodeJs style
  moduleResolution: ts.ModuleResolutionKind.NodeJs
};
