define([], function(){

  var graphApp = function (thePresenterFactory) {
    var app = this;
    app.presenterFactory = thePresenterFactory;

    var configuration = {};

    var graphPresenter = app.presenterFactory.create('graph_presenter', app, configuration);
    $("#content").append(graphPresenter.view);

      app.jquerySelection = function () { return $('#content'); };
      // app.setupPresenter();
      // app.addEventHandlers();

  };

  return graphApp;
});