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
      return chai.request(integrationServer)
      .get(`/api/movies/${randomString}`)
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

  it("Testing POST + GET /api/movies?q=<name>", async () => {
    const randomString = StringUtilities.getRandomString();

    const testMovie = {
      id: randomString,
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
      return chai.request(integrationServer)
      .get(`/api/movies`)
      .query({q: randomString})
        .then((getResponse) => {
          chai.expect(getResponse).to.have.status(200);
          const getRespBody = getResponse.body;
          chai.assert.isArray(getRespBody);
          console.log(`${integrationServer}/api/movies?q=${randomString}`);
          chai.assert.isAtLeast(getRespBody.length, 1);
          chai.assert.equal(randomString, getRespBody[0].movieId);
          chai.assert.equal(randomString, getRespBody[0].title);
        });
    });
  });
});
