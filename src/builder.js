'use strict';

import Command from './command';
import {
  extractOptionsAndFunction
}
from './utils';

export function factoryMethod(name = null) {
  if (name == null) {
    return defaultBuilder;
  } else {
    return require(`./builder/${name}`);
  }
}

export class CommandBuilder {

  constructor() {
    this.calls = {};
    this.finders = {};
  }

  helpers(helpers) {
    if (!this._helpers) {
      this._helpers = {};
    }
    Object.assign(this._helpers, helpers);
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

function createFactoryMethod(methodName, BuilderClass) {
  return function() {
    return BuilderClass.prototype[methodName].apply(new BuilderClass(),
      arguments);
  }
}

function createFactoryMethods(target, BuilderClass, methods = ['require',
  'helpers', 'returnVar', 'define', 'start', 'find'
]) {
  methods.forEach(m => {
    target[m] = createFactoryMethod(m, BuilderClass);
  });
}

exports.createFactoryMethods = createFactoryMethods;

const defaultBuilder = new Object();
createFactoryMethods(defaultBuilder, CommandBuilder);
