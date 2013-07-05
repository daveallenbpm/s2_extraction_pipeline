define([], function(){
  var graphPresenter =  Object.create(null);

  $.extend(graphPresenter, {
    register: function (callback) {
      callback('graph_presenter', function () {
        var instance = Object.create(graphPresenter);
        graphPresenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init:function(){
      d3.select('#content')
        .style("background-color", "black")
        .style("display", "inline-block");

      return this;
    }
  });

  return graphPresenter;
});
