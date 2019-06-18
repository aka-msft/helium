const tenantName    = "72f988bf-86f1-41af-91ab-2d7cd011db47";
const clientId      = "55cf1208-65ad-472d-b649-f1c61d68c40c";
const serverPort    = 3000;

const _serverPort = serverPort;
export { _serverPort as serverPort };

export const credentials = {
    identityMetadata: `https://login.microsoftonline.com/${tenantName}.onmicrosoft.com/.well-known/openid-configuration`, 
    clientID: clientID
};
