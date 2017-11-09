import { BuildConfig, SourceTarget } from '../../util/interfaces';
import { GLOBAL_NAME } from '../../util/constants';
import { normalizePath } from '../util';


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


export function getGlobalFileName(config: BuildConfig, sourceTarget: SourceTarget) {
  const appFileName = getAppFileName(config);
  return `${appFileName}.${GLOBAL_NAME}${sourceTarget === 'es5' ? '.es5' : ''}.js`;
}


export function getGlobalWWW(config: BuildConfig, sourceTarget: SourceTarget) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.buildDir, appFileName, getGlobalFileName(config, sourceTarget)));
}


export function getGlobalDist(config: BuildConfig, sourceTarget: SourceTarget) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.distDir, appFileName, getGlobalFileName(config, sourceTarget)));
}


export function getAppWWWBuildDir(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.buildDir, appFileName));
}


export function getAppDistDir(config: BuildConfig) {
  const appFileName = getAppFileName(config);
  return normalizePath(config.sys.path.join(config.distDir, appFileName));
}
