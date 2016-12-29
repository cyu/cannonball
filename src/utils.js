'use strict';

export class StopWatch {

  constructor() {
    this.startTime = new Date();
  }

  stop() {
    this.endTime = new Date();
    return this.elapsedTimeInMillis();
  }

  elapsedTimeInMillis() {
    return this.endTime.getTime() - this.startTime.getTime();
  }
}

export function extractOptionsAndFunction(args, startIndex = 0) {
  let call = {
    options: {},
    fn: null
  };
  if (args.length == startIndex + 1) {
    if (typeof(args[startIndex]) == 'function') {
      call.fn = args[startIndex];
    } else {
      call.options = args[startIndex];
    }
  } else if (args.length == startIndex + 2) {
    call.options = args[startIndex];
    call.fn = args[startIndex + 1];
  }
  return call;
}
