import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";
import { integrationServer } from "../../config/constants";
import { StringUtilities } from "../../utilities/stringUtilities";

chai.use(chaiHttp);

describe("Testing Movie Controller Methods", () => {

  it("Testing GET /api/movies", async () => {
    return chai.request(integrationServer)
      .get(`/api/movies`)
      .then((res) => {
        chai.expect(res).to.have.status(200);
        const body = res.body;
        chai.assert.isArray(body);
      });
  });

  it("Testing POST + GET /api/movies/:id", async () => {
    const randomString = StringUtilities.getRandomString();

    const testMovie = {
      genres: [],
      id: randomString,
      key: "0",
      movieId: randomString,
      roles: [],
      runtime: 120,
      textSearch: randomString.toLowerCase(),
      title: randomString,
      type: "Movie",
      year: 1994,
    };

    return chai.request(integrationServer)
      .post("/api/movies")
      .set("content-type", "application/json")
      .send(testMovie)
      .then((res) => {

        chai.expect(res).to.have.status(201);
        chai.request(integrationServer)
          .get(`/api/movies/${randomString}`)
          .then((getResponse) => {
            chai.expect(getResponse).to.have.status(200);
            const getRespBody = getResponse.body;
            chai.assert.isNotArray(getRespBody);
            chai.assert.equal(randomString, getRespBody.movieId);
            chai.assert.equal(randomString, getRespBody.title);
          });
      });

  });

  it("Testing POST + GET /api/movies?q=<name>", async () => {
    const randomString = StringUtilities.getRandomString();

    const testMovie = {
      genres: [],
      id: randomString,
      key: "0",
      movieId: randomString,
      roles: [],
      runtime: 120,
      textSearch: randomString.toLowerCase(),
      title: randomString,
      type: "Movie",
      year: 1994,
    };

    return chai.request(integrationServer)
      .post("/api/movies")
      .set("content-type", "application/json")
      .send(testMovie)
      .then((res) => {
        chai.expect(res).to.have.status(201);
        chai.request(integrationServer)
          .get(`/api/movies`)
          .query({ q: randomString })
          .then((getResponse) => {
            chai.expect(getResponse).to.have.status(200);
            const getRespBody = getResponse.body;
            chai.assert.isArray(getRespBody);
            chai.assert.isAtLeast(getRespBody.length, 1);
            chai.assert.equal(randomString, getRespBody[0].movieId);
            chai.assert.equal(randomString, getRespBody[0].title);
          });
      });
  });

  it("Testing POST + DELETE + GET /api/movies", async () => {
    const randomString = StringUtilities.getRandomString();

    const testMovie = {
      genres: [],
      id: randomString,
      key: "0",
      movieId: randomString,
      roles: [],
      runtime: 120,
      textSearch: randomString.toLowerCase(),
      title: randomString,
      type: "Movie",
      year: 1994,
    };

    return chai.request(integrationServer)
      .post("/api/movies")
      .set("content-type", "application/json")
      .send(testMovie)
      .then((res) => {
        chai.expect(res).to.have.status(201);
        const delReq = chai.request(integrationServer);
        delReq.del(`/api/movies/${randomString}`).set("content-type", "application/json").then((getResponse) => {
          chai.expect(getResponse).to.have.status(204);
          chai.request(integrationServer)
            .get(`/api/movies/${randomString}`)
            .then((getRes) => {
              chai.expect(getRes).to.have.status(404);
            });

        });
      });
  });

  it("Testing POST + PUT + GET /api/movies", async () => {
    const randomString = StringUtilities.getRandomString();

    const testMovie = {
      genres: [],
      id: randomString,
      key: "0",
      movieId: randomString,
      roles: [],
      runtime: 120,
      textSearch: randomString.toLowerCase(),
      title: randomString,
      type: "Movie",
      year: 1994,
    };

    return chai.request(integrationServer)
      .post("/api/movies")
      .set("content-type", "application/json")
      .send(testMovie)
      .then((res) => {
        chai.expect(res).to.have.status(201);
        testMovie.title = randomString + "1";
        testMovie.textSearch = randomString + "1";
        const putReq = chai.request(integrationServer);
        putReq.put(`/api/movies/${randomString}`).set("content-type", "application/json").send(testMovie)
          .then((getResponse) => {
            chai.expect(getResponse).to.have.status(201);

            chai.request(integrationServer)
              .get(`/api/movies/${randomString}`)
              .then((getRes) => {
                chai.expect(getRes).to.have.status(200);
                chai.expect(getRes.body.title).to.equal(`${randomString}1`);
              });

          });
      });
  });

  it("Testing POST Bad Request Response Code", async () => {
    return chai.request(integrationServer)
      .post("/api/movies")
      .set("content-type", "application/json")
      .send({})
      .catch((err) => {
        chai.expect(err.response).to.have.status(400);
      });
  });
});
