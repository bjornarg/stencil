import { BuildConfig, SourceTarget } from '../../util/interfaces';
import { GLOBAL_NAME } from '../../util/constants';
import { pathJoin } from '../util';


export function getAppFileName(config: BuildConfig) {
  return config.namespace.toLowerCase();
}


export function getAppWWWBuildDir(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return pathJoin(config, config.buildDir, appFileName);
}


export function getAppDistDir(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return pathJoin(config, config.distDir, appFileName);
}


export function getRegistryJsonWWW(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return pathJoin(config, getAppWWWBuildDir(config), `${appFileName}.registry.json`);
}


export function getRegistryJsonDist(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return pathJoin(config, config.distDir, `${appFileName}.registry.json`);
}


export function getLoaderFileName(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return `${appFileName}.js`;
}


export function getGlobalFileName(config: BuildConfig, sourceTarget: SourceTarget) {
  const appFileName = getAppFileName(config);
  return `${appFileName}.${GLOBAL_NAME}${getSourceTargetSuffix(sourceTarget)}.js`;
}


export function getGlobalWWW(config: BuildConfig, sourceTarget: SourceTarget) {
  return pathJoin(config, getAppWWWBuildDir(config), getGlobalFileName(config, sourceTarget));
}


export function getGlobalDist(config: BuildConfig, sourceTarget: SourceTarget) {
  return pathJoin(config, getAppDistDir(config), getGlobalFileName(config, sourceTarget));
}


export function getCoreFilename(config: BuildConfig, coreId: string, jsContent: string) {
  const appFileName = getAppFileName(config);
  if (config.hashFileNames) {
    // prod mode renames the core file with its hashed content
    const contentHash = config.sys.generateContentHash(jsContent, config.hashedFileNameLength);
    return `${appFileName}.${contentHash}.js`;
  }

  // dev file name
  return `${appFileName}.${coreId}.js`;
}


export function getBundleFileName(bundleId: string, scoped: boolean, sourceTarget: SourceTarget) {
  return `${bundleId}${scoped ? '.sc' : ''}${getSourceTargetSuffix(sourceTarget)}.js`;
}


export function getSourceTargetSuffix(sourceTarget: SourceTarget) {
  return sourceTarget === 'es5' ? '.es5' : '';
}


export function getAppPublicPath(config: BuildConfig) {
  return pathJoin(config, config.publicPath, getAppFileName(config)) + '/';
}
