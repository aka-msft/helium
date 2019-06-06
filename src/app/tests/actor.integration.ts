import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";
import { integrationServer } from "../../config/constants";
import { NumberUtilities } from "../../utilities/numberUtilities";

chai.use(chaiHttp);

describe("Testing Actor Controller Methods", () => {

  it("Testing GET /api/actors", async () => {
    return chai.request(integrationServer)
      .get(`/api/actors`)
      .then((res) => {
        chai.expect(res).to.have.status(200);
        const body = res.body;
        chai.assert.isArray(body);
      });
  });

  it("Testing POST + GET /api/actors/:id", async () => {
    const randomNumber = NumberUtilities.getRandomNumber();
    const actor = {
      actorId: `${randomNumber}`,
      birthYear: 1997,
      id: `${randomNumber}`,
      key: "0",
      movies: [],
      name: "someName",
      profession: ["actor"],
      textSearch: "somename",
      type: "Actor",
    };

    return chai.request(integrationServer)
      .post("/api/actors")
      .set("content-type", "application/json")
      .send(actor)
      .then((res) => {
        chai.expect(res).to.have.status(201);
        return chai.request(integrationServer)
        .get(`/api/actors/${randomNumber}`)
          .then((getResponse) => {
            chai.expect(getResponse).to.have.status(200);
            const body = getResponse.body;
            chai.assert.isArray(body);
            chai.assert.isAtLeast(body.length, 1);
            const id = body[0].actorId;
            chai.assert.equal(randomNumber, id);
          });
      });
  });

});
