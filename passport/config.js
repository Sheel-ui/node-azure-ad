const dotenv = require("dotenv").config({ path: '.env' });
module.exports = {
    appID: process.env.APPID,
    appSecret: process.env.SECRET,
    graphUrl: 'https://graph.windows.net',
    metadataUrl: `https://login.microsoftonline.com/${process.env.TENANTID}/.well-known/openid-configuration`,
    redirectUrl: `${process.env.URL}/signin`,
    logoutUrl: `https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=${process.env.URL}`
};