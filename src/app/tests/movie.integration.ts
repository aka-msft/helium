import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";
import { integrationServer } from "../../config/constants";
import { StringUtilities } from "../../utilities/stringUtilities";

const stringUtil = new StringUtilities();

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

  const randomString = stringUtil.getRandomString();

  const testMovie = {
    genres: [],
    id: randomString,
    movieId: randomString,
    roles: [],
    runtime: 120,
    title: randomString,
    type: "Movie",
    year: 1994,
  };

  it("Testing POST + GET /api/movies/:id", async () => {
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
});
