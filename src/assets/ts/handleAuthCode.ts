import { access } from "./access";
import { axios, countDown } from "./axio";
import { toggleDark } from "~/composables";
import { env } from "./env";

const callbackUrl = window.location.href;
const code = new URL(callbackUrl).searchParams.get('code');
const state = new URL(callbackUrl).searchParams.get('state');

if (code != null && state != null) {
    if (code.length > 20) {
       access.grant_type = 'code';
      //  pkceCode();
    } else {
      access.grant_type = 'github';
    }
    // dialogFormVisible.value = true
}

const pkceCode = () => {
    const authOption = {
        baseURL: env.authUrl,
        url: "/oauth2/token",
        method: "POST",
        data: {
          code_verifier: access.codeVerifier,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: env.redirectUrl,
          client_id: "spring"
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },   
        withCredentials: true                  
      }
      axios(authOption).then(function (response) {
        if(response.data.access_token != "") {
          access.refresh_token = response.data.refresh_token;
          access.grant_type = "authorization_code";
          access.update(response.data.access_token, response.data.expires_in);
          // userInfo();
          toggleDark();
          countDown();
        }
      }) 
  }

  if (code != null && state == null) {
    pkceCode();
    // dialogFormVisible.value = true
}
export { code }

