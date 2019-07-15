export const IDENTITY_CONFIG = {
  authority: `${window._env_.REACT_APP_OIDC_ISSUER}/.well-known/openid-configuration`,
  client_id: `${window._env_.REACT_APP_OIDC_CLIENT_ID}`,
  redirect_uri: `${window._env_.REACT_APP_PUBLIC_URL}/auth/signin-oidc`,
  silent_redirect_uri: `${window._env_.REACT_APP_PUBLIC_URL}/auth/silentrenew`,
  post_logout_redirect_uri: `${window._env_.REACT_APP_PUBLIC_URL}/auth/logout-callback`,
  response_type: 'id_token token',
  automaticSilentRenew: true,
  loadUserInfo: true,
  scope: 'openid'
};

export const METADATA_OIDC = {
  issuer: `${window._env_.REACT_APP_OIDC_ISSUER}`,
  jwks_uri: `${window._env_.REACT_APP_OIDC_ISSUER}/protocol/openid-connect/certs`,
  authorization_endpoint: `${window._env_.REACT_APP_OIDC_ISSUER}/protocol/openid-connect/auth`,
  token_endpoint: `${window._env_.REACT_APP_OIDC_ISSUER}/protocol/openid-connect/token`,
  userinfo_endpoint: `${window._env_.REACT_APP_OIDC_ISSUER}/protocol/openid-connect/userinfo`,
  end_session_endpoint: `${window._env_.REACT_APP_OIDC_ISSUER}/protocol/openid-connect/logout`,
  check_session_iframe: `${window._env_.REACT_APP_OIDC_ISSUER}/protocol/openid-connect/login-status-iframe.html`,
  revocation_endpoint: `${window._env_.REACT_APP_OIDC_ISSUER}/protocol/openid-connect/revocation`,
  introspection_endpoint: `${window._env_.REACT_APP_OIDC_ISSUER}/protocol/openid-connect/introspect`
};
