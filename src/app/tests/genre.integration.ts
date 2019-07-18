import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";
import { integrationServer } from "../../config/constants";

chai.use(chaiHttp);

describe("Testing Genre Controller Methods", () => {

  describe("GET /api/genres", async () => {
    it("Test the ability to retrieve all Genres", async () => {
      chai.request(integrationServer)
      .get(`/api/genres`)
      .end((err, res) => {
        chai.expect(res).to.have.status(200);
        const body = res.body;
        chai.assert.isArray(body);
      });
    });
  });

});
