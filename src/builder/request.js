'use strict';

import {
  CommandBuilder
}
from '../builder';

export class RequestCommandBuilder extends CommandBuilder {

  buildFunction(name) {
    let command = this.build(name);
    return function(req, res) {
      command.run({
        request: req,
        response: res
      }).finally(() => res.end());
    }
  };

}

RequestCommandBuilder.createFactoryMethods(exports);
