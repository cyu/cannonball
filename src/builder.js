'use strict';

import Command from './command';
import {
  extractOptionsAndFunction
}
from './utils';

export class CommandBuilder {

  constructor() {
    this.calls = {};
    this.finders = {};
  }

  helpers(helpers) {
    this._helpers = helpers;
    return this;
  }

  require(...requiredVars) {
    this._require = requiredVars;
    return this;
  }

  returnVar(key) {
    this._returnVar = key;
    return this;
  }

  define(name) {
    this.calls[name] = extractOptionsAndFunction(arguments, 1);
    return this;
  }

  start() {
    return this.define('start', ...arguments);
  }

  find(name) {
    this.finders[name] = extractOptionsAndFunction(arguments, 1);
    return this;
  }

  build(commandName) {
    return new Command(commandName, {
      require: this._require,
      return: this._returnVar,
      calls: this.calls,
      finders: this.finders,
      helpers: this._helpers,
    });
  }

}

CommandBuilder.createFactoryMethods = function(target, methods = ['require',
  'helpers', 'returnVar', 'define', 'start', 'find'
]) {
  methods.forEach(m => {
    target[m] = CommandBuilder.prototype[m].bind(new this());
  });
}

CommandBuilder.createFactoryMethods(exports);
