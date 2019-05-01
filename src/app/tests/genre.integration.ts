import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";

const server = "https://heliumint.azurewebsites.net/";

chai.use(chaiHttp);

describe("Testing Genre Controller Methods", () => {

  it("Testing /api/genres", async () => {
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
