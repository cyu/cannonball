'use strict';

import debug from 'debug';
import Promise from 'bluebird';
import {
  StopWatch
}
from './utils';

module.exports = class Command {

  constructor(name, options) {
    this.name = name;
    this.finders = options.finders || {};
    this.returnKey = options.return;
    this.require = options.require;
    this.helpers = options.helpers || {};

    this.debug = debug(`${name}:debug`);
    this.info = debug(`${name}:info`);
    this.error = debug(`${name}:error`);

    this.start = this.defineCall('start', options.calls['start']);
    this.calls = {};
    this.buildCalls(options.calls);
  }

  asFunction() {
    const cmd = this;
    return function() { return cmd.run.apply(cmd, arguments); }
  }

  run(env = {}) {
    const stopWatch = new StopWatch();
    this.info("running...");
    this.requireVars(env);
    Object.assign(env,
      {log: {debug: this.debug, info: this.info, error: this.error}},
      this.calls,
      this.helpers);
    return this.start(env).then((val) => {
      if (this.returnKey) {
        this.debug('returning value of %s', this.returnKey);
        return this.find(this.returnKey, env);
      } else {
        return val;
      }
    }).catch(err => {
      const errorData = env.__errors.find(e => e.error == err);
      if (errorData) {
        this.error('command failed with error in %s: %s', errorData.call,
          err);
      } else {
        this.error('command failed with error: %s', err);
      }
      throw err;
    }).finally(() => {
      this.info('completed in %sms', stopWatch.stop());
    });
  }

  buildCalls(callDefs) {
    for (let name in callDefs) {
      if (name != 'start') {
        this.bindCall(name, this.defineCall(name, callDefs[name]));
      }
    }
  }

  bindCall(name, fn) {
    const cmd = this;
    this.calls[name] = function() {
      const stopWatch = new StopWatch();
      return fn(this).finally(() => {
        cmd.debug('called %s (%sms)', name, stopWatch.stop());
      });
    }
  }

  defineCall(name, callDef) {
    if (callDef) {
      const options = callDef.options || {};
      const find = options.find;
      const ignoreError = (options.ignoreError == true);
      const fn = Promise.method(callDef.fn);
      const cmd = this;
      return function(env) {
        return cmd.find(find, env).then(() => {
          cmd.debug('calling %s...', name);
          return fn(env).catch(err => {
            if (!env.__errors) env.__errors = [];
            if (!env.__errors.find(e => e.error === err)) {
              env.__errors.push({
                error: err,
                call: name
              });
              cmd.error('error in %s: %s', name, err);
              cmd.debug('%O', err.stack || err);
            }
            if (ignoreError) {
              cmd.info('ignoring error in %s', name);
            } else {
              throw err;
            }
          });
        });
      }
    } else {
      throw TypeError(`${name} is not a function in ${this.name} command`);
    }
  }

  find(findDef, env) {
    if (!findDef) {
      return Promise.resolve();
    }
    if (Array.isArray(findDef)) {
      return Promise.all(findDef.map(f => this.find(f, env)));
    }
    return this.getFindPromise(findDef, env);
  }

  getFindPromise(name, env) {
    if (!('__finds' in env)) {
      env.__finds = {};
    }
    let findPromise = env.__finds[name];
    if (!findPromise) {
      findPromise = this.buildFindPromise(name, env);
      env.__finds[name] = findPromise;
    }
    return findPromise;
  }

  buildFindPromise(name, env) {
    const finder = this.finders[name];
    if (finder) {
      return this.defineCall(`find:${name}`, finder)(env).
      then(result => env[name] = result);
    } else {
      throw TypeError(
        `finder function ${name} is not in ${this.name} command`);
    }
  }

  requireVars(env) {
    if (this.require) {
      this.debug('require: %o', this.require);
      this.require.forEach(req => {
        const val = env[req];
        if (val == null || typeof val == 'undefined') {
          throw new Error(`${k} not set in environment`);
        }
      });
    }
  }

}
