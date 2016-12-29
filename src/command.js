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
    this.finders = options.finders;
    this.returnKey = options.return;
    this.require = options.require;

    this.debug = debug(`${name}:debug`);
    this.info = debug(`${name}:info`);
    this.error = debug(`${name}:error`);

    this.start = this.defineCall('start', options.calls['start']);
    this.calls = {};
    this.buildCalls(options.calls);
  }

  run(env = {}) {
    const stopWatch = new StopWatch();
    this.info("running...");
    this.requireVars(env);
    Object.assign(env, this.calls);
    return this.start(env).then((val) => {
      if (this.returnKey) {
        this.debug('returning value of %s', this.returnKey);
        return this.find(this.returnKey, env);
      } else {
        return val;
      }
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
      const obj = {
        [name](env) {
          cmd.debug('calling %s...', name);
          const promise = cmd.find(find, env).then(() => fn(env));
          if (ignoreError) {
            return promise.catch(err => {
              cmd.error('error in %s (ignored): %o', name, err);
              cmd.debug('%O', err.stack);
            });
          } else {
            return promise;
          }
        }
      };
      return obj[name];

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
      let stopWatch = new StopWatch();
      this.debug('finding %s...', name);
      return Promise.method(finder.fn)(env).then(result => {
        this.debug('found %s (%sms): %o', name, stopWatch.stop(),
          result);
        env[name] = result;
        return result;
      });

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
