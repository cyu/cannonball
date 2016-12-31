var chai = require('chai');

var Builder = require('../lib/builder').factoryMethod();

var expect = chai.expect;

describe('Builder', function() {

  it('should build simple command', function() {
    var testCommand = Builder.
    require('foo').
    start(env => {}).
    build('testCommand');

    expect(testCommand.require).to.deep.equal(['foo']);
  });

  it('should build a more robust command', function() {
    var testCommand = Builder.
    require('foo').
    returnVar('bar').
    find('bar', env => {
      return 'baz';
    }).
    define('anotherMethod', {
      ignoreError: true,
      find: 'bar'
    }, env => {
      console.log("bar: " + env.bar);
    }).
    start(env => {
      return env.anotherMethod();
    }).
    build('testCommand');

    expect(testCommand.require).to.deep.equal(['foo']);
    expect(testCommand.returnKey).to.equal('bar');
    expect(testCommand.finders['bar']).to.exist;
    expect(testCommand.calls['anotherMethod']).to.exist;
    expect(testCommand.name).to.equal('testCommand');
  });

  it('should collect helper methods', function() {
    var builder = Builder.
    helpers({
      foo: function() {}
    }).
    helpers({
      bar: function() {}
    });
    expect(builder._helpers.foo).to.exist;
    expect(builder._helpers.bar).to.exist;
  });

});
