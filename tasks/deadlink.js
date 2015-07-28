/*
  grunt-deadlink
  https://github.com/lnyarl/grunt-deadlink

  Copyright (c) +2013 choi yongjae
  Licensed under the MIT license.
*/


(function() {
  module.exports = function(grunt) {
    var Checker, Logger, util, _;
    util = (require('./util'))(grunt);
    Logger = (require('./logger'))(grunt);
    Checker = (require('./checker'))(grunt);
    _ = grunt.util._;
    return grunt.registerMultiTask('deadlink', 'check dead links in files.', function() {
      var checker, done, files, filter, logger, options;
      done = this.async();
      options = this.options({
        filter: function(content) {
          var expressions;
          expressions = [/\[[^\]]*\]\((http[s]?:\/\/[^\) ]+)/g, /\[[^\]]*\]\s*:\s*(http[s]?:\/\/.*)/g];
          return util.searchAllLink(expressions, content);
        },
        maxAttempts: 3,
        retryDelay: 60000,
        logToFile: false,
        logFilename: 'deadlink.log',
        logAll: false
      });
      files = grunt.file.expand(this.data.src);
      filter = this.data.filter || options.filter;
      logger = new Logger(options);
      checker = new Checker(options, logger);
      logger.progress();
      util.extractURL(files, filter, function(filepath, link) {
        logger.increaseLinkCount();
        return checker.checkDeadlink(filepath, link);
      });
      return logger.printResult(done);
    });
  };

}).call(this);
