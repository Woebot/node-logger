// name: logger.js
// version: 0.0.1
// http://github.com/quirkey/node-logger
/*

Copyright (c) 2010 Aaron Quint

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

'use strict';

const path = require('path');
const util = require('util');
const fs = require('fs');

var makeArray = function (nonarray) {
  return Array.prototype.slice.call(nonarray);
};

// Create a new instance of Logger, logging to the file at `log_file_path`
// if `log_file_path` is null, log to STDOUT.
var Logger = function (logFilePath) {
  // default write is STDOUT
  this.write = console.log;
  this.log_level_index = 3;

  // if a path is given, try to write to it
  if (logFilePath) {
    // Write to a file
    logFilePath = path.normalize(logFilePath);
    this.stream = fs.createWriteStream(logFilePath, {flags: 'a', encoding: 'utf8', mode: 0o666});
    this.stream.write('\n');
    this.write = function (text) { this.stream.write(text); };
  }
};

Logger.levels = ['fatal', 'error', 'warn', 'info', 'debug'];

// The default log formatting function. The default format looks something like:
//
//    [ERROR]  message
//
Logger.prototype.format = function (level, date, message) {
  return `[${level.toUpperCase()}] ${message}`;
};

// Set the maximum log level. The default level is "info".
Logger.prototype.setLevel = function (newLevel) {
  let index = Logger.levels.indexOf(newLevel);
  let wasSet = (index !== -1) ? this.log_level_index = index : false;
  return wasSet;
};

// The base logging method. If the first argument is one of the levels, it logs
// to that level, otherwise, logs to the default level. Can take `n` arguments
// and joins them by ' '. If the argument is not a string, it runs `sys.inspect()`
// to print a string representation of the object.
Logger.prototype.log = function () {
  let args = makeArray(arguments);
  let logIndex = Logger.levels.indexOf(args[0]);
  let message = '';

  // if you're just default logging
  if (logIndex === -1) {
    logIndex = this.log_level_index;
  } else {
    // the first arguement actually was the log level
    args.shift();
  }

  if (logIndex <= this.log_level_index) {
    // join the arguments into a loggable string
    args.forEach(function (arg) {
      if (typeof arg === 'string') {
        message += ' ' + arg;
      } else {
        message += ' ' + util.inspect(arg, false, null);
      }
    });

    message = this.format(Logger.levels[logIndex], new Date(), message);
    this.write(message + '\n');
    return message;
  }

  return false;
};

Logger.levels.forEach((level) => {
  Logger.prototype[level] = function () {
    var args = makeArray(arguments);
    args.unshift(level);
    return this.log.apply(this, args);
  };
});

exports.Logger = Logger;
exports.createLogger = function (logFilePath) {
  return new Logger(logFilePath);
};
