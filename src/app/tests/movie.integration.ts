import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";

const server = process.env.integration_server_url;

chai.use(chaiHttp);

describe("Testing Movie Controller Methods", () => {

  it("Testing /api/movies", async () => {
    const movieId = "tt0347779";
    return chai.request(server)
    .get(`/api/movies`)
    .then((res) => {
      chai.expect(res).to.have.status(200);
      const id = res.body[0].movieId;
      // chai.assert.include(res.body[0], movieId );
      chai.assert.equal(id, movieId);
    });
  });

  it("Testing /api/movies/:id", async () => {
    const queryId = "tt0120737";
    return chai.request(server)
    .get(`/api/movies/${queryId}`)
    .then((res) => {
      chai.expect(res).to.have.status(200);
      const id = res.body[0].movieId;
      chai.assert.equal(queryId, id);
    });
  });

});
