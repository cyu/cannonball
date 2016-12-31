'use strict';

import {
  CommandBuilder
}
from '../builder';

var helpers = {
  notFound: function() {
    this.sendStatus(404);
  }
};

['sendStatus', 'redirect', 'send', 'render'].forEach(m => {
  helpers[m] = function() {
    this.response[m].apply(this.response, arguments);
  }
});

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
        response: res,
        params: req.params
      }).catch(err => {
        res.sendStatus(500);
      }).finally(() => {
        res.end();
      });
    }
  }

}

RequestCommandBuilder.createFactoryMethods(exports);
