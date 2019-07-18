import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";
import { integrationServer } from "../../config/constants";
import { NumberUtilities } from "../../utilities/numberUtilities";
import { StringUtilities } from "../../utilities/stringUtilities";

chai.use(chaiHttp);

describe("Testing Actor Controller Methods", function() {

  describe("GET /api/actors", async () => {
    it("Test ability tto get all actors", async () => {
      chai.request(integrationServer)
        .get(`/api/actors`)
        .then((res) => {
          chai.expect(res).to.have.status(200);
          const body = res.body;
          chai.assert.isArray(body);
        });
    });
  });

  describe("Testing POST + GET /api/actors/:id", async () => {
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

    describe("Testing POST /api/actors", () => {
      it("Should create an actor", () => {
        chai.request(integrationServer)
        .post("/api/actors")
        .set("content-type", "application/json")
        .send(actor)
        .end((err, res) => {
          chai.expect(res).to.have.status(201);
        });
      });
    });
    describe("Testing GET /api/actors/" + actor.id, function() {

      it("Should return an actor", function() {
        chai.request(integrationServer)
        .get("/api/actors/" + actor.id)
        .set("content-type", "application/json")
        .end((err, res) => {
          chai.expect(res).to.have.status(200);
          const body = res.body;
          chai.assert.isNotArray(body);
          const id = body.actorId;
          chai.assert.equal(randomNumber, id);
        });
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

    describe("Testing POST /api/actors", async () => {
      it("Should create an actor", async () => {
        chai.request(integrationServer)
        .post("/api/actors")
        .set("content-type", "application/json")
        .send(testActor)
        .end((err, res) => {
          chai.expect(res).to.have.status(201);
        });
      });
    });
    describe("Testing GET /api/actors/" + testActor.id, async () => {
      it("Should return an actor", async () => {
        chai.request(integrationServer)
        .get("/api/actors/" + testActor.id)
        .query({ q: randomStringName })
        .set("content-type", "application/json")
        .end((err, res) => {
          chai.expect(res).to.have.status(200);
          const getRespBody = res.body;
          chai.assert.isArray(getRespBody);
          chai.assert.isAtLeast(getRespBody.length, 1);
          chai.assert.equal(randomStringName, getRespBody[0].name);
        });
      });
    });
  });

  describe("POST bad payload to /api/actors", async () => {
    it("Testing POST Bad Request Response Code", async () => {
      chai.request(integrationServer)
        .post("/api/actors")
        .set("content-type", "application/json")
        .send({})
        .catch((err) => {
          chai.expect(err.response).to.have.status(400);
        });
    });
  });
});
