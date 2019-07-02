const tenantName = "somename";
const tenantID = "someguid";
const clientID = "someguid";

export const authcreds = {
    identityMetadata: "https://login.microsoftonline.com/" + tenantID + "/v2.0/.well-known/openid-configuration", // Required
    clientID: clientID, // Required
    //validateIssuer: config.creds.validateIssuer, // Conditional
    issuer: "https://sts.windows.net/" + tenantID + "/", // Conditional
    passReqToCallback: false, // Required
    //isB2C: config.creds.isB2C, // Conditional
    //policyName: config.creds.policyName, // Conditional
    //allowMultiAudiencesInToken: config.creds.allowMultiAudiencesInToken, // Conditional
    audience: "<audience>", // Optional
    loggingLevel: "info", // Optional
    //loggingNoPII: config.creds.loggingNoPII, // Optional
    //clockSkew: config.creds.clockSkew, // Optional
    //scope: config.creds.scope // Optional
}