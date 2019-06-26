export const apiPrefix: string = "/api";
export const integrationServer: string =  process.env.integration_server_url;

// Used in controllers - Note: Must be type Any so we can return the string in GET API calls.
export const actorDoesNotExistError: any = "An Actor with that ID does not exist";
export const movieDoesNotExistError: any = "A Movie with that ID does not exist";
