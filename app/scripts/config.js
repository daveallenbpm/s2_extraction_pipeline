define([], function() {
  'use strict';
  return {
    // Configure the API to S2
    apiUrl: 'http://psd2g.internal.sanger.ac.uk:8000/',

    // Don't change the release branch value as it's picked up by the deployment script
    release: 'development_branch',

    ajax: function(options) {
      return $.ajax(options).then(function(result) { return {responseText:result}; });
    },

    // Configure the print service
    printServiceUrl: 'http://psd2g.internal.sanger.ac.uk:8000/printers/legacy/soap',
    printers: [{
      name: 'e367bc',
      type: 2
    }, {
      name: 'd304bc',
      type: 1
    }],
    printerTypes: {
        1 : '96 Well Plate Printer',
        2 : 'Tube Printer',
        3 : 'Rack Printer'
    },
    messageTimeout: 5000,
    // Handler for exceptions (does absolutely nothing, but could try..catch!)
    exceptionHandling: function(callback) {
      callback();
    }
  };
});
