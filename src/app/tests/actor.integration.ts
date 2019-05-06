import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";

const server =  process.env.integration_server_url;

chai.use(chaiHttp);

describe("Testing Actor Controller Methods", () => {

  it("Testing GET for /api/actors", async () => {
    // Create a new movie in the DB so we know what to retrieve
    const postBody = "{content: \"created\", id: \"8\", movieId: \"movie8\", title: \"My Movie 8\", type: \"Movie\",}";
    chai.request(server).post(postBody);

    return chai.request(server)
    .get(`/api/actors`)
    .then((res) => {
      chai.expect(res).to.have.status(200);
      const id = res.body[0].actorId;
      chai.assert.equal(queryId, id);
    });
  });

  // Do we need this?
  it("Testing POST for /api/actors", async () => {
    const queryId = "nm0000323";
    return chai.request(server)
    .get(`/api/actors`)
    .then((res) => {
      chai.expect(res).to.have.status(200);
      const id = res.body[0].actorId;
      chai.assert.equal(queryId, id);
    });
  });

  it("Testing GET for /api/actors/:id", async () => {
    const queryId = "nm0000323";
    return chai.request(server)
    .get(`/api/actors/${queryId}`)
    .then((res) => {
      chai.expect(res).to.have.status(200);
      const id = res.body[0].actorId;
      chai.assert.equal(queryId, id);
    });
  });

});
