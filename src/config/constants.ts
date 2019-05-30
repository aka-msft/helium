export const apiPrefix = "/api";
export const integrationServer =  process.env.integration_server_url;

export enum httpStatus {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    NotFound = 404,
    InternalServerError = 500,
}
