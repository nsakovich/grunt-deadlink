module.exports = (grunt) ->
  parseURL = (require 'url').parse
  request = require 'request'
  fs = require 'fs'

  class Checker
    logger : null
    checkCache : {}
    checkStatus : {}

    constructor : ({retryDelay, maxAttempts}, logger)->
      @retryDelay = retryDelay
      @maxAttempts = maxAttempts
      @logger = logger

    isAllowedStatusCode : (code)->
      ([200].indexOf code) >= 0

    isRetryCode : (code)->
      (["ETIMEOUT", "ECONNREFUSED", "HPE_INVALID_CONSTANT", "ECONNRESET", "ETIMEDOUT", "ESOCKETTIMEDOUT", "EPROTO"].indexOf code) >= 0

    checkHTTPLink : (filepath, link, retryCount = 0)->
      requestOption =
        method : 'GET'
        url : parseURL link
        strictSSL : false
        followRedirect : true
        pool :
          maxSockets : 10
        timeout: 60000

      retryDelay = if retryCount? then 0 else @retryDelay

      setTimeout =>
        request requestOption, (error, res, body) =>
          if res? and @isAllowedStatusCode res.statusCode
            @logger.ok "ok: #{link} at '#{filepath}'"
            @checkStatus[link] = "ok"
          else if error? and @isRetryCode(error.code) and retryCount < @maxAttempts
            @logger.error "retry: #{link} (#{retryCount}) at '#{filepath}'"
            retryCount = retryCount + 1
            @checkHTTPLink filepath, link, retryCount
          else
            msg = if error then JSON.stringify error else res.statusCode
            @logger.error "broken: #{link} (#{msg}) at '#{filepath}'"
            @checkStatus[link] = "fail"
        .setMaxListeners 25
      , retryDelay

    checkLocalLink : (filepath, link)->
      fs.exists link, (exist)=>
        if exist
          @logger.ok "ok: #{link} at '#{filepath}'"
          @checkStatus[link] = "ok"
        else
          @logger.error "broken: #{link} at '#{filepath}'"
          @checkStatus[link] = "fail"

    isURL : (link)->
      /^ *https?:\/\/?/.test link


    checkDeadlink : (filepath, link) ->
      if @checkCache[link]?
        @logger.pass "pass: #{link} in '#{filepath}' is tried at #{@checkCache[link]}"
        return
      @checkCache[link] = filepath

      if @isURL link
        @checkHTTPLink filepath, link
      else
        @checkLocalLink filepath, link
  Checker
