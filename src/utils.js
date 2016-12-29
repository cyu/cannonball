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
