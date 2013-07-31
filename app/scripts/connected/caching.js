define([], function() {
  'use strict';

  var DeferredCache = Object.create(null);

  _.extend(DeferredCache, {


        // Behave like a promise but remember that the value of 'results' above can change
        then:    resultsBound('then'),
        resolve: resultsBound('resolve'),

        // Caching can be treated as a store, allowing things to be cached and uncached.
        push: function() { _.each(arguments, recache); },
        pull: function() { _.each(arguments, uncache); }
      });
      return instance;

      // Deals with either maintenance of the cache so that we always have the freshest information
      // presented.  Recaching is about removing and then putting the resource back into the cache,
      // and uncaching is about removing without readding.
      function recache(resource) { manage(resource, [resource]); }
      function uncache(resource) { manage(resource, []); }
      function manage(remove, addition) {
        results.then(function(array) {
          return _.chain(array).reject(function(cached) {
            return cached.uuid === remove.uuid;
          }).union(addition).value();
        }).then(function(array) {
          pulled  = _.chain(pulled).union([remove]).difference(array).value();
          results = $.Deferred().resolve(array);
        });
      }

      // Returns a function that will call the named function bound to the results.  This is not
      // the same as _.bind as the value of results can change on each call.
      function resultsBound(name) {
        return function() {
          return results[name].apply(results, arguments);
        };
      }
    }
  });

  return DeferredCache;
});
