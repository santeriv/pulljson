var should = require('chai').should(),
    supertest = require('supertest'),
    server = require('../app.js'),
    api = supertest('http://localhost:3000');


describe('Missing query params', function() {

  it('missing site param', function(done) {
    api.get('/jquery')
    .expect(302)
    .expect({},done)
  });
  it('error for missing selector param', function(done) {
    api.get('/jquery?site=http://www.jquery.com')
    .expect(200)
    .expect({"results": "no selector was given eg. &selector=find('a').children()","size": -1},done)
  });

});
