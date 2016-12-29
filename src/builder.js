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

  require(...requiredVars) {
    this.require = requiredVars;
    return this;
  }

  returnVar(key) {
    this.return = key;
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
      require: this.require,
      return: this.return,
      calls: this.calls,
      finders: this.finders,
    });
  }
}

[
  'require',
  'returnVar',
  'define',
  'start',
  'find',
].forEach(m => {
  exports[m] = CommandBuilder.prototype[m].bind(new CommandBuilder());
});
