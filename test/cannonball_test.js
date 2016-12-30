var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var expect = chai.expect;

chai.use(chaiAsPromised);

describe('Cannonball', function() {

  it("should be able to build a simple command", function(done) {
    var foo = "Hello, World!";
    var cmd = require('../index').builder().start(function(env) {
      foo = foo.replace('World', 'Earth');
    }).build('testCommand');
    expect(cmd.run().finally(() => expect(foo).to.equal('Hello, Earth!')))
      .to.eventually.notify(done);
  });

  it("should be able to build a request command", function() {
    var fn = require('../index').builder('request').start(function(env) {
      env.send('Hello, World!');
    }).buildFunction('testCommand');
    expect(fn).to.exist;
  });

});
