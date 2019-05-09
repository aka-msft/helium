import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";
import { integrationServer } from "../../config/constants";

chai.use(chaiHttp);

describe("Testing Genre Controller Methods", () => {

  it("Testing GET /api/genres", async () => {
    const queryGenre = "Fantasy";
    return chai.request(integrationServer)
    .get(`/api/genres`)
    .then((res) => {
      chai.expect(res).to.have.status(200);
      const body = res.body;
      chai.assert.isArray(body);
    });
  });

});
