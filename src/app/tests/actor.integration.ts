import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";
import { integrationServer } from "../../config/constants";
import { NumberUtilities } from "../../utilities/numberUtilities";
import { StringUtilities } from "../../utilities/stringUtilities";

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
            chai.assert.isNotArray(body);
            const id = body.actorId;
            chai.assert.equal(randomNumber, id);
          });
      });
  });

  it("Testing POST + GET /api/actors?q=<name>", async () => {
    const randomStringId = StringUtilities.getRandomString();
    const randomStringName = StringUtilities.getRandomString();

    const testActor = {
      actorId: randomStringId,
      birthYear: 1980,
      id: randomStringId,
      key: "0",
      movies: [],
      name: randomStringName,
      profession: [],
      textSearch: randomStringName.toLowerCase(),
      type: "Actor",
    };

    return chai.request(integrationServer)
      .post("/api/actors")
      .set("content-type", "application/json")
      .send(testActor)
      .then((res) => {

        chai.expect(res).to.have.status(201);
        chai.request(integrationServer)
          .get(`/api/actors`)
          .query({ q: randomStringName })
          .then((getResponse) => {
            chai.expect(getResponse).to.have.status(200);
            const getRespBody = getResponse.body;
            chai.assert.isArray(getRespBody);
            chai.assert.isAtLeast(getRespBody.length, 1);
            chai.assert.equal(randomStringName, getRespBody[0].name);
          });
      });
  });

  it("Testing POST Bad Request Response Code", async () => {
    return chai.request(integrationServer)
      .post("/api/actors")
      .set("content-type", "application/json")
      .send({})
      .catch((err) => {
        chai.expect(err.response).to.have.status(400);
      });
  });
});
