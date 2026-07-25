const APP_LOGO_KEY = 'unionpro_tontine_app_logo'

export function getAppLogo() {
  return localStorage.getItem(APP_LOGO_KEY) || null
}

export function setAppLogo(dataUrl) {
  localStorage.setItem(APP_LOGO_KEY, dataUrl)
}

export function resetAppLogo() {
  localStorage.removeItem(APP_LOGO_KEY)
}
