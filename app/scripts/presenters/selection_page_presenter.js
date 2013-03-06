/*
 * S2 - An open source lab information management systems (LIMS)
 * Copyright (C) 2013  Wellcome Trust Sanger Insitute
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 1, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA  02110-1301 USA
 */


define(['extraction_pipeline/views/selection_page_view', 'extraction_pipeline/models/selection_page_model', 'mapper/s2_root'], function (SelectionPageView, SelectionPageModel, S2Root) {
  // TODO : add dependency for resource : ..., ... ,'mapper/s2_resource' ], function (...,..., rsc )

  var SelectionPagePresenter = function (owner, presenterFactory) {
    /* constructor
     *
     * Arguments
     * ---------
     * owner : the owner of this presenter. Expected to be the application controller
     */
    this.owner = owner;
    this.view = undefined;
    this.presenterFactory = presenterFactory;
    this.presenters = [];
    return this;
  };

  SelectionPagePresenter.prototype.setupPresenter = function (input_model, jquerySelection) {
    /*
     Arguments:
     input_model = { userUUID:"1234567890", labwareUUID:"1234567890", batchUUID:"0123456789" }
     */
    console.log("SelectionPagePresenter  : setupPresenter, ", input_model);
    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();

    this.updateModel(input_model);
    return this;
  };

  SelectionPagePresenter.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;
    return this;
  };

  SelectionPagePresenter.prototype.setupView = function () {
    /* initialises this instance by instantiating the view
     */
    this.view = new SelectionPageView(this, this.jquerySelection);
    return this;
  };

  SelectionPagePresenter.prototype.updateModel = function (input_model) {
    /*
     Arguments:
     input_model = {
     userUUID:"1234567890",
     labwareUUID:"1234567890",
     batchUUID:"1234567890"
     }
     */

    console.log("SelectionPagePresenter  : updateModel");
    if (!this.model) {
      this.model = new SelectionPageModel(this, input_model);
      this.model.retrieveBatchFromSeminalLabware();
    }
    return this;
  };


  SelectionPagePresenter.prototype.renderView = function () {
    /* Updates the data for the current view
     *
     * Tells the presenter that the model has been updated
     *
     */

    if (!this.view) {
      return this;
    }

    // we need to render the model first, so that the html elements
    // exist to configure the sub-presenters' views
    this.view.render(this.model);
    for (var i = 0; i < this.presenters.length; i++) {
      if (this.presenters[i]) {
        this.presenters[i].renderView();
      }
    }
    return this;
  };

  SelectionPagePresenter.prototype.setupSubPresenters = function () {
    var numOrders = this.model ? this.model.getNumberOfTubes() : 0;

    for (var i = 0; i < this.model.getCapacity(); i++) {

      if (i < numOrders) {
        this.presenters[i] = this.presenterFactory.createLabwarePresenter(this, 'tube');
      } else if (i == numOrders) {
        this.presenters[i] = this.presenterFactory.createScanBarcodePresenter(this);
      } else {
        this.presenters[i] = this.presenterFactory.createEmptyPresenter(this);

      }
    }
    this.setupSubModel();
    return this;
  };

  SelectionPagePresenter.prototype.setupSubModel = function () {
    /*
     Creates the data needed for the sub presenters
     */
    var that = this;
    var jQueryForNthChild = function (childIndex) {
      return function () {
        return that.jquerySelection().find("li :eq(" + childIndex + ")");
      };
    };

    if (!this.model) {
      return;
    }

    numTubes = this.model.getNumberOfTubes();

    console.warn(this.model);

    for (var i = 0; i < this.model.getCapacity(); i++){
      if (i < numTubes){
        var dataForTubeRemovalPresenter = { uuid:this.model.tubeUUIDs[i]};
        this.presenters[i].setupPresenter(dataForTubeRemovalPresenter, jQueryForNthChild(i));
      } else if (i == numTubes) {
        var dataForScanBarcodePresenter = {};
        this.presenters[i].setupPresenter(dataForScanBarcodePresenter, jQueryForNthChild(i));
      } else {
        var dataForEmptyPresenter = {};
        this.presenters[i].setupPresenter(dataForEmptyPresenter, jQueryForNthChild(i));

      }
    }

  };

  SelectionPagePresenter.prototype.release = function () {
    /* Tells the presenter to get ready for being deleted.
     *
     * This should only be called at the end of the life. It will
     * tell the view component to tell itself to disappear from the
     * open page.
     */
    this.view.clear();
    return this;
  };

  SelectionPagePresenter.prototype.childDone = function (child, action, data) {
    /* Handles done messages from the page view and child presenters.
     *
     * Any messages that happen to come from the PageView will be delegated over to
     * selfDone.
     *
     * Arguments
     * ---------
     * child : the presenter(or model) instance the done message is coming from. Can be
     *             either the PagePresenter, one of the PartialPresenters or the model
     * action:     a string representing the action request, e.g. 'next' for someone
     *             clicking on the next button
     * data:       Any data associated with the action.
     *
     */
    if (child === this.model) {
      if (action === "modelUpdated") {
        this.setupSubPresenters();
        this.renderView();
        
        return;
      }
    }

    if (action === "barcodeScanned") {
      console.warn(data);
      return this.handleBarcodeScanned(data.uuid);
    } else if (action === "removeTube") {
      return this.handleTubeRemoved(data);
    }
    else if (action === "next"){
      return this.owner.childDone(child, "done", data);
    }



    return this.owner.childDone(child, action, data);
  };

  SelectionPagePresenter.prototype.handleBarcodeScanned = function (uuid) {
    if (this.model.addTube(uuid)) {
      // TODO: deal with the success...
    } else {
      // TODO: deal with the error...
    }
    return this;
  };

  SelectionPagePresenter.prototype.handleTubeRemoved = function (data) {
    var index = this.model.removeTubeByUuid(data.tube.uuid);

    if (index > -1) {
      this.presenters[index].release();
      this.presenters.splice(index, 1);
      if (this.presenters.length == this.model.getCapacity() - 1) {
        //this.ensureScanBarcodePresenter();
      }
      this.setupSubPresenters();
      this.renderView();
      //this.setupChildViews();
    }
  };


  SelectionPagePresenter.prototype.handleExtraTube = function (tube) {
    if (this.model) {
      var numTubes = this.model.getNumberOfTubes();
      this.model.addTube(tube);
      if (this.presenters[numTubes]) {
        this.presenters[numTubes].release();
        this.presenters[numTubes] = null;
      }
      this.ensureTubeRemovalPresenter(tube, numTubes);
      this.ensureScanBarcodePresenter(this.model);
      this.setupChildViews();
    }
  };

  SelectionPagePresenter.prototype.selfDone = function (action, data) {
    /* Handles done messages that arose from within this object or the view
     *
     * Arguments
     * ---------
     * presenter : the presenter instance the done message is coming from. Can be
     *             either the PagePresenter or one of the PartialPresenters
     * action:     a string representing the action request, e.g. 'next' for someone
     *             clicking on the next button
     * data:       Any data associated with the action.
     *
     */
    if (action == "next") {
      this.owner.childDone(this, "done", data);
    }
    return this;
  };


  return SelectionPagePresenter;
});
