(function() {
  module.exports = function(grunt) {
    var _;
    _ = grunt.util._;
    return {
      searchAllLink: function(expressions, content) {
        var result;
        result = [];
        _.forEach(expressions, function(expression) {
          var match, _results;
          if (!(_.isRegExp(expression))) {
            grunt.log.fatal("filter's type must be RegExp or function");
          }
          match = expression.exec(content);
          _results = [];
          while ((match != null)) {
            result.push(match[1]);
            _results.push(match = expression.exec(content));
          }
          return _results;
        });
        return result;
      },
      extractURL: function(files, filter, map) {
        return _.forEach(files, function(filepath) {
          var content, links;
          content = grunt.file.read(filepath);
          links = _.isFunction(filter) ? filter(content) : this.searchAllLink(filter, content);
          return _.forEach(links, function(link) {
            return map(filepath, link);
          });
        });
      }
    };
  };

}).call(this);
