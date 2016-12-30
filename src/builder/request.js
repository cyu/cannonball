'use strict';

import {
  CommandBuilder
}
from '../builder';

var helpers = {
  notFound: function() {
    this.sendStatus(404);
  },
  sendStatus: function() {
    this.response.sendStatus.apply(this.response, arguments);
  },
  redirect: function() {
    this.response.redirect.apply(this.response, arguments);
  },
  send: function() {
    this.response.send.apply(this.response, arguments);
  }
};

export class RequestCommandBuilder extends CommandBuilder {

  constructor() {
    super();
    this.helpers(helpers);
  }

  buildFunction(name) {
    let command = this.build(name);
    return function(req, res) {
      command.run({
        request: req,
        response: res
      }).catch(err => {
        res.sendStatus(500);
      }).finally(() => {
        res.end();
      });
    }
  }

}

RequestCommandBuilder.createFactoryMethods(exports);
