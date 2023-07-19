import { reactive }from 'vue'

export const env = reactive(
{      
    apiUrl: import.meta.env.VITE_API_URL,
    authUrl: import.meta.env.VITE_AUTH_URL,
    storageUrl: import.meta.env.VITE_STORAGE_URL,
    redirectUrl: import.meta.env.VITE_CNAME,
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    oauth2ProxyPkceUrl: import.meta.env.VITE_OAUTH2_PROXY_PKCE_URL,
    oauth2ProxyUrl: import.meta.env.VITE_OAUTH2_PROXY_URL

})