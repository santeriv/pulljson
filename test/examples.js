var should = require('chai').should(),
    supertest = require('supertest'),
    server = require('../app.js'),
    api = supertest('http://localhost:3000');


describe('Examples', function() {

  it('error for missing selector param', function(done) {
    api.get("/jquery?site=http://www.jquery.com&selector=find('a img')&forceText=false")
    .expect(200)
    .expect('Content-Type', /json/)
    .end(function(err, res) {
      if (err) return done(err);
      res.body.should.have.property('results').and.be.instanceof(Array);
      done();
    });
  });

});
