require('dotenv').config();

const app = require('./src/app');
const { logger } = require('./lib/logger');

const port = process.env.PORT || 8000;
//This timeout is used to delay accepting connections until the server is fully loaded. 
//It could come to a crash if a request comes in before the settings cache was fully laoded.

setTimeout(() => {
  setTimeout(() => {
    if (process.env.ExtraErrorWebDelay > 0) {
      logger('info', `Webserver was delayed by ${process.env.ExtraErrorWebDelay || 500}ms beause of a error.`);
    }
    app.listen(port, () => {
      /* eslint-disable no-console */
      logger('system', `Server started on port ${port}`);
      /* eslint-enable no-console */
    });
  }, process.env.ExtraErrorWebDelay || 500);
}, process.env.GlobalWaitTime || 500);