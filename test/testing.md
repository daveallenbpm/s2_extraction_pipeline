Testing in the s2_extraction_pipeline
=====================================

Use of a fakeDOM for view testing
---------------------------------

Many of the spec files here use a fakeDOM object in order to test components at the level of what the user sees. Using jQuery triggering of events, it is possible to simulate a user walking through a process, and to "see" what is visible on the page.
 
```javascript
	fakeDOM = $('<div><div id="content"></div></div>');
```

A selector function is also created so that we may examine the updated fakeDOM.

	fakeContent = function () {
      return fakeDOM.find("#content");
    };


The above shows the creation of a fake DOM object. This is passed to the presenter that we wish to test as it's selection parameter.

Since the presenter appends to the selection it has been given, rather than directly to the DOM, the presenter will attach all new HTML (by itself and sub-presenters) to this fake DOM. This allows testing at the view level.

A simple example of this can be found in the reception app:


	it('gives the user the option to create or load a 	manifest', function () {
      expect(fakeContent().find('#create-manifest-	btn').length).toEqual(1);
	  expect(fakeContent().find('#read-manifest-btn').length).toEqual(1);
    });

Here, jQuery is used to check the existence of two buttons on a page. Checking the length of a jQuery object is a simple way of detecting the presence of something on a page.

More complicated examples use jQuery to trigger events:

	fakeContent()
      .find("#read-manifest-btn")
      .trigger('click');
      
The above simulates a click on the read manifest button.

For more complex user interactions, such as pressing the enter key, or waiting for an object to appear on the page, the ***fake_user*** module has been made.

Fake User and use in asynchronous testing
-----------------------------------------

The fake user module (in *test/lib*) contains two very useful functions for testing: **aPressReturnEvent** and **waitsForIt**.

**aPressReturnEvent** simply simulates a user hitting the return key. The below example is from the *reception_app_spec*:

	fakeContent()
      .find('#barcodeReader .barcodeInput')
      .val("2881460250710")
      .trigger(FakeUser.aPressReturnEvent());
      
**waitsForIt** waits for a particular element of the DOM to appear. It takes on three parameters: a **jQuery object**, a **context** (or selector), and a **callback** for when the DOM element is found in the jQuery object. This makes it very useful for asynchronous testing, where a human tester would have to wait for something to appear on screen before being able to perform an action. The below example is in the setup for a test in the *reception_app_spec*.

	beforeEach(function () {
      runs(function () {
        results.resetFinishedFlag();
        fakeContent()
          .find("#read-manifest-btn")
          .trigger('click');

        //wait for jquery animation
        waits(500);

        //simulate file input
        presenter.manifestReaderComponent.presenter.responderCallback(manifestCSVData)
          .then(function () {
            FakeUser.waitsForIt(fakeDOM, "#registrationBtn", results.expected);
          })
          .fail(results.unexpected);
          });
        waitsFor(results.hasFinished);
      });
    });
      
The above simulates file input, then waits for the registration button to appear on the display. This example makes use of the *test_helper* module, which is explained in another section.

Essentially, the callback executed here (once the registration button appears) will create a flag. Used in tandem with the Jasmine testing suite **waitsFor** function (which will wait until the function given to it returns true), **results.hasFinished** will return true when **results.expected** is executed.

This pattern can be used in any situation where a fakeDOM element needs to be waited for in order to perform the next action.

MORE COMPLETE EXAMPLE??

Test Helper
-----------

The *resource_test_helper* module (*app/components/S2Mapper/test/resource_test_helper.js*) is a module that aids with asynchronous testing.

The *test_helper* is used as a wrapper to all tests, as in the following basic example:
 
	define([your_module
	  , 'mapper_test/resource_test_helper']
	  , function(YourModule, TestHelper){
	  
	  // this module takes on a function callback
	  TestHelper(function (results){
	    
	    // all testing goes in here.
	    // For example:
	    
	    describe("Your Module", function(){
	      it("Does what we expect!", function(){
	        
	        var stuff, expectedStuff = {};
	        
	        runs(function(){
	          YourModule.getStuff
	            .fail(results.unexpected)
	            .then(function(retrievedStuff){
	              stuff = retrievedStuff;
	            })
	            .fail(results.unexpected)
	            .then(results.expected);
	        });
	             
	        waitsFor(results.hasFinished);
	        
	        expect(stuff).toEqual(expectedStuff);
	      });
	    });
	  });
	});

**expected** sets a flag for when expected results are found. This is very useful in asynchronous testing, where callbacks are are used (with promises). This means that **expected** can be passed as a callback when the expected actions have been a success. Likewise, **unexpected** can be passed when an asynchronous action fails.

After a run of asynchronous callbacks using **then** and **fail** (more info on these can be found in the section about ***promises***), we can use **waitsFor(results.expected)** which will wait until **results.expected** has been called.



An example from the source is shown below:

	runs(function () {
      results.resetFinishedFlag();
      app.getS2Root()
        .then(function (root) {
          return root.find("tube1UUID");
        })
        .then(function (initialLabware) {
          model = {
            user:    "123456789",
            labware: initialLabware
          };
        })
        .then(results.expected)
        .fail(results.unexpected)
    });
	
    waitsFor(results.hasFinished);
    
This is taken from the *selection_page_spec*. This part of the setup retrieves a tube from the test data. The **waitsFor** will stall executation of code after this. If it is successful in finding the tube, **results.expected** is executed, **results.hasFinished** will return true, and **waitsFor** will stop stalling the code.

In addition to this, it allows you to keep track of previous results through the **assignTo**, **get** and **getAll** methods. 

Test data and the use of the Mapper test_config
-----------------------------------------

We can simulate interactions with the S2 server by using test data in the form of JSON. Test data should be of the form of the data which can be found at the [Sanger LIMS api page](http://docs.sangerlimsapi.apiary.io/).

Test_config in the s2_extraction_pipeline uses the test_config in the S2Mapper (*app/components/S2Mapper/test/test_config.js*) as its basis.

The data is dealt with in stages: it mimicks a very specific path through the system. Perhaps the best example of this is in the file *dna_and_ran_manual_test_data.js*. A condensed version of the default and first two stages is shown below to illustrate:

	{"default":{
	  "calls":[
	    {"description": "Get the root JSON"…},
	    {"description": "Find tube by barcode (1220017279667)"…}
	  ]
	},
	{"1":{
	  "calls":[
	    {"description": "Find tube by barcode (1220017279667)"…},
	    {"description": "Get the search result (tube)"…},
	    {"description": "Find the order by tube uuid"…}
	  ]
	},
	{"2":{
	  "calls":[
	    {"description": "Find the order by tube uuid"…},
	    {"description": "Get the search results (order)"…},
	    {"description": "Find tube by barcode (1220017279668)"…}
	  ]
	},…
	
At each stage, there is a list of available calls.

The test config allows you to use this data in a manner that simulates a real interaction with the server. It is made in such a way that the mocked responses (made by the *test_config*) are asynchronous, with an artificial delay being imposed upon the responses. This is to make it as close as possible as talking to a real system.

	sendResponse: function(callback) { setTimeout(callback, 100); },

The data can be loaded must be loaded with **loadTestData**. If a stage needs to be added previous to this (e.g. retrieval of the root: every server interaction requires the root!) the method **cummulativeLoadingTestDataInFirstStage** can be used. Below is an example of both being used, again from the *selection_page_spec*. This is a full beforeEach() setup:

	beforeEach(function () {
	  // load the test data
      config.loadTestData(selectionPageData);
      
      // load the root as the first stage
      config.cummulativeLoadingTestDataInFirstStage(rootTestData);

      var model;

      runs(function () {
        results.resetFinishedFlag();
        app.getS2Root()
          .then(function (root) {
            return root.find("tube1UUID");
          })
          .then(function (initialLabware) {
            model = {
              user:    "123456789",
              labware: initialLabware
            };
          })
          .then(results.expected)
          .fail(results.unexpected)  
        });

        waitsFor(results.hasFinished);

        runs(function () {
          results.resetFinishedFlag();
          presenter.setupPresenter(model, function () {
            return fakeContent();
          });
          results.expected();
         });
        waitsFor(results.hasFinished);

       PubSub.removeAll('s2.status.error');
     });
	
Right at the start, test data for the selection page is loaded. On top of this, the root data is loaded as the first stage of the test data. 

With this data, the app can get the S2Root (necessary for any server/mock-server interaction). Then, the root can be used to find the tube from the data that has been loaded into the *test_config*.

It is also possible to move between the stages in the JSON files manually. There is a **progress** method in *test_config* that facilitates this.