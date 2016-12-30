var chai = require('chai');
var chaiHttp = require('chai-http');
var express = require('express');
var RequestCommand = require('../../lib/builder/request');
var expect = chai.expect;

chai.use(chaiHttp);

describe('RequestCommand', function() {

  var commandFn = RequestCommand
    .start(function(env) {
      env.send('Hello world');
    })
    .buildFunction('testCommand');

  var routes = express.Router();
  routes.get('/', commandFn);

  var app = express();
  app.use('/', routes);

  it('should handle request via command', function(done) {
    chai.request(app)
      .get('/')
      .end(function(err, res) {
        expect(res.status).to.equal(200);
        done();
      });
  });

});
