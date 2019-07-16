import * as chai from "chai";
import chaiHttp = require("chai-http");
import "mocha";
import { integrationServer } from "../../config/constants";
import { StringUtilities } from "../../utilities/stringUtilities";

chai.use(chaiHttp);

describe("Testing Movie Controller Methods", function() {

  describe("GET /api/movies", () => {
    it("Should return a list ", async () => {
      chai.request(integrationServer)
        .get(`/api/movies`)
        .then((res) => {
          chai.expect(res).to.have.status(200);
          const body = res.body;
          chai.assert.isArray(body);
        });
    });
  });

  describe("Test the ability to create and get movies", function() {
      const randomString = "z" + StringUtilities.getRandomString();

      const testMovie = {
        genres: [],
        id: randomString,
        key: "0",
        movieId: randomString,
        roles: [],
        runtime: 120,
        textSearch: randomString.toLowerCase(),
        title: randomString,
        type: "Movie",
        year: 1994,
      };

      describe("POST /api/movies", () => {
        it("Should create a movie", () => {
          chai.request(integrationServer)
          .post("/api/movies")
          .set("content-type", "application/json")
          .send(testMovie)
          .end((err, res) => {
            chai.expect(res).to.have.status(201);
          });
        });
      });

      describe("GET /api/movies/" + testMovie.id, function() {
        it("Should return the movie", function() {
          chai.request(integrationServer)
            .get(`/api/movies/${randomString}`)
            .end((err, getResponse) => {
              chai.expect(getResponse).to.have.status(200);
              const getRespBody = getResponse.body;
              chai.assert.isNotArray(getRespBody);
              chai.assert.equal(randomString, getRespBody.movieId);
              chai.assert.equal(randomString, getRespBody.title);
            });
        });
      });

      describe("DELETE /api/movies/" + testMovie.id, () => {
        it("Should remove the movie", async () => {
          chai.request(integrationServer)
            .del(`/api/movies/${randomString}`)
            .set("content-type", "application/json")
            .end((err, getResponse) => {
              chai.expect(getResponse).to.have.status(204);
            });
        });
      });

  });

  describe("Test the abiilty to filter movies by title", () => {
      const randomString = "z" + StringUtilities.getRandomString();

      const testMovie = {
        genres: [],
        id: randomString,
        key: "0",
        movieId: randomString,
        roles: [],
        runtime: 120,
        textSearch: randomString.toLowerCase(),
        title: randomString,
        type: "Movie",
        year: 1994,
      };

      describe("POST /api/movies", () => {
        it("Should create a movie", async () => {
          chai.request(integrationServer)
          .post("/api/movies")
          .set("content-type", "application/json")
          .send(testMovie)
          .end((err, res) => {
            chai.expect(res).to.have.status(201);
          });
        });
      });

      describe("GET /api/movies?q=" + randomString, () => {
        it("Should return the movie", async () => {
          chai.request(integrationServer)
            .get(`/api/movies`)
            .query({ q: randomString })
            .end((err, getResponse) => {
              chai.expect(getResponse).to.have.status(200);
              const getRespBody = getResponse.body;
              chai.assert.isArray(getRespBody);
              chai.assert.isAtLeast(getRespBody.length, 1);
              chai.assert.equal(randomString, getRespBody[0].movieId);
              chai.assert.equal(randomString, getRespBody[0].title);
            });
        });
      });

      describe("DELETE /api/movies/" + testMovie.id, () => {
        it("Should remove the movie", async () => {
          chai.request(integrationServer)
            .del(`/api/movies/${randomString}`)
            .set("content-type", "application/json")
            .end((err, getResponse) => {
              chai.expect(getResponse).to.have.status(204);
            });
        });
      });

  });

  describe("Test ability to delete a movie", () => {
      const randomString = "z" + StringUtilities.getRandomString();

      const testMovie = {
        genres: [],
        id: randomString,
        key: "0",
        movieId: randomString,
        roles: [],
        runtime: 120,
        textSearch: randomString.toLowerCase(),
        title: randomString,
        type: "Movie",
        year: 1994,
      };

      describe("POST /api/movies", () => {
        it("Should create a movie", async () => {
          chai.request(integrationServer)
          .post("/api/movies")
          .set("content-type", "application/json")
          .send(testMovie)
          .end((err, res) => {
            chai.expect(res).to.have.status(201);
          });
        });
      });

      describe("DELETE /api/movies/" + testMovie.id, () => {
        it("Should remove the movie", async () => {
          chai.request(integrationServer)
            .del(`/api/movies/${randomString}`)
            .set("content-type", "application/json")
            .end((err, getResponse) => {
              chai.expect(getResponse).to.have.status(204);
            });
        });
      });

      describe("GET /api/movies/" + randomString, () => {
        it("Should not return the movie", async () => {
          chai.request(integrationServer)
            .get(`/api/movies`)
            .query({ q: randomString })
            .end((err, getResponse) => {
              chai.expect(getResponse).to.have.status(404);
            });
        });
      });

  });

  describe("POST + PUT + GET + DELETE /api/movies", () => {
      const randomString = "zzz" + StringUtilities.getRandomString();

      const testMovie = {
        genres: [],
        id: randomString,
        key: "0",
        movieId: randomString,
        roles: [],
        runtime: 120,
        textSearch: randomString.toLowerCase(),
        title: randomString,
        type: "Movie",
        year: 1994,
      };

      describe("POST /api/movies", () => {
        it("Should create a movie", async () => {
          chai.request(integrationServer)
          .post("/api/movies")
          .set("content-type", "application/json")
          .send(testMovie)
          .end((err, res) => {
            chai.expect(res).to.have.status(201);
          });
        });
      });

      describe("PUT /api/movies/" + testMovie.id, () => {
        it("Should update a movie", async () => {
          testMovie.title = randomString + "1";
          testMovie.textSearch = randomString + "1";
          chai.request(integrationServer)
          .put(`/api/movies/${randomString}`)
          .set("content-type", "application/json")
          .send(testMovie)
          .end((err, res) => {
            chai.expect(res).to.have.status(201);
          });
        });
      });

      describe("GET /api/movies/" + testMovie.id, () => {
        it("Should return the movie", async () => {
          chai.request(integrationServer)
            .get(`/api/movies/${randomString}`)
            .end((err, getResponse) => {
              chai.expect(getResponse).to.have.status(200);
              chai.expect(getResponse.body.title).to.equal(`${randomString}1`);
            });
        });
      });

      describe("DELETE /api/movies/" + testMovie.id, () => {
        it("Should remove the movie", async () => {
          chai.request(integrationServer)
            .del(`/api/movies/${randomString}`)
            .set("content-type", "application/json")
            .end((err, getResponse) => {
              chai.expect(getResponse).to.have.status(204);
            });
        });
      });

  });

  describe("POST /api/movies", () => {
    it("should test POST Bad Request Response Code", async () => {
      chai.request(integrationServer)
        .post("/api/movies")
        .set("content-type", "application/json")
        .send({})
        .catch((err) => {
          chai.expect(err.response).to.have.status(400);
        });
    });
  });
});
