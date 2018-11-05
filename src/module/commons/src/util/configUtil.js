import config from 'config';

const getBaseUrl = () => {
  return config.baseAppPath ? `${window.location.origin}/${config.baseAppPath}` : window.location.origin;
};

const getStaticUrl = () => {
  if (config.entryscape && config.entryscape.static && config.entryscape.static.url){
    return config.entryscape.static.url
  }

  return getBaseUrl(); // TODO better return null since this is used in constructing other urls
};

const getStaticBuild = () => {
  const {app, version} = config.entryscape.static;
  return `${getStaticUrl()}/${app}/${version}/`;
}

const getThemeDefaults = () => {
  let defaults = {};
  try {
    defaults.appName = config.theme.default.appName;
    defaults.logo = config.theme.default.logo;
    defaults.themePath = config.theme.default.themePath;
  } catch (e) {
    throw Error('App theme default is not configured correctly!');
  }

  return defaults;
};
const getThemeToRender = () => {
  let { appName, themePath, logo } = getThemeDefaults();
  if (config.theme && config.theme.localTheme) {
    themePath = '/theme/'; // TODO @valentino check this
  }

  if (config.theme && (config.theme.appName ||
    (config.theme.logo && config.theme.logo.text))) {
    appName = (config.theme.appName || config.theme.logo.text);
  }

  return { appName, themePath, logo };
};

const getLogoType = () => {
  if (config.theme.logo) {
    if (config.theme.logo.icon && config.theme.logo.full) { // icon + full logo
      return 'all';
    } else if (config.theme.logo.full) { // full logo only
      return 'full';
    }
  }

  return 'icon'
};

const getLogoInfo = (defaultType = null) => {
  const { appName, themePath, logo } = defaultType ? getThemeDefaults() : getThemeToRender();
  const type = defaultType || getLogoType();

  let logoInfo = { type };
  switch (type) {
    case 'all':
      logoInfo.src = {
        icon: themePath + config.theme.logo.icon,
        full: themePath + config.theme.logo.full,
      };
      break;
    case 'full':
      logoInfo.src = {
        full: themePath + config.theme.logo.full
      };
      break;
    default: // icon
      if (defaultType) { // mainly for footer
        logoInfo.src = { icon: logo }
        logoInfo.text = appName;
      } else {
        const hasCustomIcon = 'logo' in config.theme && 'icon' && config.theme.logo;
        logoInfo.src = {
          icon: hasCustomIcon ? themePath + config.theme.logo.icon : logo,
        };
        logoInfo.text = appName;
      }
  }
  ;

  return logoInfo;
};

const getAppName = (native = true) => {
  const { appName } = native ? getThemeDefaults() : getThemeToRender();
  return appName;
};


const objToArray = (oOrArr) => {
  if (typeof oOrArr === 'object') {
    const arr = [];
    Object.keys(oOrArr).forEach((key) => {
      const o = oOrArr[key];
      o.name = o.name || key;
      arr.push(o);
    });
    return arr;
  }
  return oOrArr;
};

const getResourceBase = (scope) => {
  if (!config.entrystore || !config.entrystore.resourceBase) {
    return null;
  }
  const o = config.entrystore.resourceBase;
  return typeof o === 'object' ? o[scope] || o.default : o;
};

export default {
  getBaseUrl,
  getStaticBuild,
  getThemeDefaults,
  getThemeToRender,
  getLogoInfo,
  getAppName,
  objToArray,
  getResourceBase,
}