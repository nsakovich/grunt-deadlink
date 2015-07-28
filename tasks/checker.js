(function() {
  module.exports = function(grunt) {
    var Checker, fs, parseURL, request;
    parseURL = (require('url')).parse;
    request = require('request');
    fs = require('fs');
    Checker = (function() {
      Checker.prototype.logger = null;

      Checker.prototype.checkCache = {};

      Checker.prototype.checkStatus = {};

      function Checker(_arg, logger) {
        var maxAttempts, retryDelay;
        retryDelay = _arg.retryDelay, maxAttempts = _arg.maxAttempts;
        this.retryDelay = retryDelay;
        this.maxAttempts = maxAttempts;
        this.logger = logger;
      }

      Checker.prototype.isAllowedStatusCode = function(code) {
        return ([200].indexOf(code)) >= 0;
      };

      Checker.prototype.isRetryCode = function(code) {
        return (["ETIMEOUT", "ECONNREFUSED", "HPE_INVALID_CONSTANT", "ECONNRESET", "ETIMEDOUT", "ESOCKETTIMEDOUT", "EPROTO"].indexOf(code)) >= 0;
      };

      Checker.prototype.checkHTTPLink = function(filepath, link, retryCount) {
        var requestOption, retryDelay,
          _this = this;
        if (retryCount == null) {
          retryCount = 0;
        }
        requestOption = {
          method: 'GET',
          url: parseURL(link),
          strictSSL: false,
          followRedirect: true,
          pool: {
            maxSockets: 10
          },
          timeout: 60000
        };
        retryDelay = retryCount != null ? 0 : this.retryDelay;
        return setTimeout(function() {
          return request(requestOption, function(error, res, body) {
            var msg;
            if ((res != null) && _this.isAllowedStatusCode(res.statusCode)) {
              _this.logger.ok("ok: " + link + " at '" + filepath + "'");
              return _this.checkStatus[link] = "ok";
            } else if ((error != null) && _this.isRetryCode(error.code) && retryCount < _this.maxAttempts) {
              _this.logger.error("retry: " + link + " (" + retryCount + ") at '" + filepath + "'");
              retryCount = retryCount + 1;
              return _this.checkHTTPLink(filepath, link, retryCount);
            } else {
              msg = error ? JSON.stringify(error) : res.statusCode;
              _this.logger.error("broken: " + link + " (" + msg + ") at '" + filepath + "'");
              return _this.checkStatus[link] = "fail";
            }
          }).setMaxListeners(25);
        }, retryDelay);
      };

      Checker.prototype.checkLocalLink = function(filepath, link) {
        var _this = this;
        return fs.exists(link, function(exist) {
          if (exist) {
            _this.logger.ok("ok: " + link + " at '" + filepath + "'");
            return _this.checkStatus[link] = "ok";
          } else {
            _this.logger.error("broken: " + link + " at '" + filepath + "'");
            return _this.checkStatus[link] = "fail";
          }
        });
      };

      Checker.prototype.isURL = function(link) {
        return /^ *https?:\/\/?/.test(link);
      };

      Checker.prototype.checkDeadlink = function(filepath, link) {
        if (this.checkCache[link] != null) {
          this.logger.pass("pass: " + link + " in '" + filepath + "' is tried at " + this.checkCache[link]);
          return;
        }
        this.checkCache[link] = filepath;
        if (this.isURL(link)) {
          return this.checkHTTPLink(filepath, link);
        } else {
          return this.checkLocalLink(filepath, link);
        }
      };

      return Checker;

    })();
    return Checker;
  };

}).call(this);
