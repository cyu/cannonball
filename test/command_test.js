var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var Promise = require('bluebird');

var Command = require('../lib/command');

var expect = chai.expect;

chai.use(chaiAsPromised);

describe('Command', function() {

  var emptyStart = {
    start: {
      fn: function() {}
    }
  };

  it('should fail if start function is not defined', function() {
    expect(function() {
      new Command('testCommand', {}).run()
    }).to.throw(TypeError);
  });

  it('should allow logging in command function', function(done) {
    var calls = {
      start: {
        fn: function(env) {
          expect(env.log.debug).to.exist;
          expect(env.log.error).to.exist;
          expect(env.log.info).to.exist;
        }
      }
    };
    var cmd = new Command('testCommand', {
      calls: calls
    });
    expect(cmd.run()).to.eventually.notify(done);
  });

  it('should call finders before executing call', function(done) {
    var object1 = new Object();
    var finders = {
      "object1": {
        fn: function(env) {
          return Promise.resolve(object1);
        }
      }
    };
    var calls = {
      start: {
        options: {
          find: "object1"
        },
        fn: function(env) {
          expect(env.object1).to.equal(object1);
        }
      }
    };
    var cmd = new Command('testCommand', {
      finders: finders,
      calls: calls
    });
    expect(cmd.run()).to.eventually.notify(done);
  });

  it('should be convertable into into a command function', function(done) {
    var calls = {
      start: {
        fn: function(env) {
          expect(env.foo).to.equal("bar");
        }
      }
    };
    var cmd = new Command('testCommand', {
      calls: calls
    });
    expect(cmd.asFunction()({foo: 'bar'})).to.eventually.notify(done);
  });

  it('should only find a value once', function(done) {
    var finders = {
      "object1": {
        fn: function(env) {
          return new Promise(function(resolve, reject) {
            resolve(new Object());
          });
        }
      }
    };
    var cmd = new Command('testCommand', {
      finders: finders,
      calls: emptyStart
    });
    var env = {};
    expect(cmd.find('object1', env).then(function() {
      var firstObject = env.object1;
      return cmd.find('object1', env).then(function() {
        expect(env.object1).to.equal(firstObject);
      });
    })).to.eventually.notify(done);
  });

  it('should be able to find an array of values', function(done) {
    var object1 = new Object();
    var object2 = new Object();
    var finders = {
      "object1": {
        fn: function(env) {
          return Promise.resolve(object1);
        }
      },
      "object2": {
        fn: function(env) {
          return Promise.resolve(object2);
        }
      }
    };
    var cmd = new Command('testCommand', {
      finders: finders,
      calls: emptyStart
    });
    var env = {};
    expect(cmd.find(['object1', 'object2'], env).then(function() {
      expect(env.object1).to.equal(object1);
      expect(env.object2).to.equal(object2);
    })).to.eventually.notify(done);
  });

  it('should handle direct value return from finder', function(done) {
    var object1 = new Object();
    var finders = {
      "object1": {
        fn: function(env) {
          return object1;
        }
      }
    };
    var cmd = new Command('testCommand', {
      finders: finders,
      calls: emptyStart
    });
    var env = {};
    expect(cmd.find('object1', env).then(function() {
      expect(env.object1).to.equal(object1);
    })).to.eventually.notify(done);
  });

  it('should call finders before executing call', function(done) {
    var object1 = new Object();
    var finders = {
      "object1": {
        fn: function(env) {
          return Promise.resolve(object1);
        }
      }
    };
    var calls = {
      start: {
        options: {
          find: "object1"
        },
        fn: function(env) {
          expect(env.object1).to.equal(object1);
        }
      }
    };
    var cmd = new Command('testCommand', {
      finders: finders,
      calls: calls
    });
    expect(cmd.run()).to.eventually.notify(done);
  });

  it('should be able to call defined calls from env', function(done) {
    var results = [];
    var calls = {
      start: {
        fn: function(env) {
          results.push("from start");
          return env.nextMethod();
        }
      },
      nextMethod: {
        fn: function(env) {
          results.push("from nextMethod");
        }
      }
    };
    var cmd = new Command('testCommand', {
      calls: calls
    });
    var promise = cmd.run().then(function() {
      expect(results[0]).to.equal("from start");
      expect(results[1]).to.equal("from nextMethod");
    });
    expect(promise).to.eventually.notify(done);
  });

  it('should be able to return a value from environment', function(done) {
    var finders = {
      object1: {
        fn: function() {
          return 'foo';
        }
      }
    };
    var cmd = new Command('testCommand', {
      finders: finders,
      calls: emptyStart,
      return: 'object1'
    });
    expect(cmd.run()).to.eventually.equal('foo').notify(done);
  });

  it('should be able to ignore errors in defined calls', function(done) {
    var calls = {
      start: {
        fn: function(env) {
          return env.failingMethod();
        }
      },
      failingMethod: {
        options: {
          ignoreError: true
        },
        fn: function(env) {
          nonExistingMethod();
        }
      }
    };
    var cmd = new Command('testCommand', {
      calls: calls
    });
    expect(cmd.run()).to.eventually.notify(done);
  });

  it('should propagate reject promise to caller', function(done) {
    var calls = {
      start: {
        fn: function(env) {
          return env.failingMethod();
        }
      },
      failingMethod: {
        fn: function(env) {
          return Promise.reject(new Error('error!'));
        }
      }
    };
    var cmd = new Command('testCommand', {
      calls: calls
    });
    expect(cmd.run()).to.be.rejected.notify(done);
  });

  it('should be able to take in initial env values', function(done) {
    var calls = {
      start: {
        fn: function(env) {
          expect(env.foo).to.equal('bar');
        }
      }
    };
    var cmd = new Command('testCommand', {
      calls: calls
    });
    expect(cmd.run({
      foo: 'bar'
    })).to.eventually.notify(done);
  });

  it('should be able to specify required env values', function() {
    var cmd = new Command('testCommand', {
      calls: emptyStart,
      require: ['arg0', 'arg1']
    });
    var promise = null;
    expect(function() {
      return cmd.run({
        arg0: 'foo'
      });
    }).to.throw();
  });

  it('should convert raised exception to reject promise', function(done) {
    var calls = {
      start: {
        fn: function(env) {
          throw new Error('error!');
        }
      }
    };
    var cmd = new Command('testCommand', {
      calls: calls
    });
    expect(cmd.run()).to.be.rejected.notify(done);
  });

  it('should be able to add helper methods onto env', function(done) {
    var calls = {
      start: {
        fn: function(env) {
          expect(env.helperMethod()).to.equal('bar');
        }
      }
    };
    var helpers = {
      helperMethod: function() {
        return 'bar';
      }
    };
    var cmd = new Command('testCommand', {
      calls: calls,
      helpers: helpers
    });
    expect(cmd.run()).to.eventually.notify(done);
  });

  it('should support find option for finders', function(done) {
    var finders = {
      object1: {
        fn: function() {
          return 'foo';
        }
      },
      object2: {
        options: {
          find: 'object1'
        },
        fn: function(env) {
          expect(env.object1).to.equal('foo');
          return 'bar';
        }
      }
    };
    var calls = {
      start: {
        options: {
          find: 'object2'
        },
        fn: function() {}
      }
    };
    var cmd = new Command('testCommand', {
      finders: finders,
      calls: calls
    });
    expect(cmd.run()).to.eventually.notify(done);
  });

  it('should let finder errors propagate', function(done) {
    var finders = {
      object1: {
        fn: function() {
          nonExistingMethod();
        }
      }
    };
    var calls = {
      start: {
        options: {
          find: 'object1'
        },
        fn: function() {}
      }
    };
    var cmd = new Command('testCommand', {
      finders: finders,
      calls: calls
    });
    expect(cmd.run()).to.be.rejected.notify(done);
  });

});
