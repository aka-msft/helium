import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";

const server =  process.env.integration_server_url;

chai.use(chaiHttp);

describe("Testing Genre Controller Methods", () => {

  it("Testing GET /api/genres", async () => {
    const queryGenre = "Fantasy";
    return chai.request(server)
    .get(`/api/genres`)
    .then((res) => {
      chai.expect(res).to.have.status(200);
      const id = res.body[0].genre;
      chai.assert.equal(queryGenre, id);
    });
  });

});
