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

"use strict";

define([
  'extraction_pipeline/models/base_page_model',
  'mapper/operations',
  'extraction_pipeline/models/connected'
], function (BasePageModel, Operations, Connected) {
  var Model = Object.create(BasePageModel);

  $.extend(Model, Connected, {
    //TODO: add suitable methods for the model

    init:function (owner, initData) {
      this.owner = owner;
      this.user = undefined;
      this.batch = undefined;

      this.elutionStarted = false;

      this.initialiseCaching();
      this.initialiseConnections(initData);
      return this;
    },

    getRowModel:function (rowNum, input) {
      return {
        "rowNum":rowNum,
        "remove_arrow":false,
        "enabled":!!this.outputs.length,
        "labware1":{
          "input":true,
          "expected_type":"spin_column",
          "display_remove":true,
          "display_barcode":true
        },
        "labware2":{
          "input":false,
          "expected_type":"tube",
          "display_remove":true,
          "display_barcode":true
        }
      };
    },

    startElution:function () {
      var that = this;
      var addingRoles = {updates:[]};

      this.batch.getItemsGroupedByOrders()
          .then(function (rscByOrders) {
            _.each(rscByOrders, function (orderKey) {
              _.each(orderKey.items, function (item) {
                if (item.role === that.config.output[that.config.output.target].role) {
                  addingRoles.updates.push({
                    input:{
                      order:orderKey.order
                    },
                    output:{
                      resource:item,
                      role:that.config.output[that.config.output.target].role,
                      batch:that.batch.uuid
                    }});
                }
              });
            });
            return Operations.stateManagement().start(addingRoles);
          })
          .then(function () {
            that.elutionStarted = true;
            that.owner.childDone(that, "elutionStarted", {});
          }).fail(function () {
            throw "Could not make a batch";
          }
      );
    },

    makeAllTransfers: function() {
      var that = this;
      this.makeTransfers({
        preflight: function(that) {
          return that.batch.items;
        },
        process: function(that, items) {
          var destBySrc = _.chain(that.owner.rowPresenters).reduce(function (memo, presenter) {
            presenter.handleResources(function(source, destination) {
              memo[source.uuid] = {
                source: source,
                destination: destination
              };
            })
            return memo
          }, {}).value();

          return _.chain(items).filter(function(item) {
            return item.role === that.config.input.role;
          }).map(function(item) {
            var source = destBySrc[item.uuid].source;
            var destination = destBySrc[item.uuid].destination;
            return {
              source:      source,
              destination: destination,
              order:       item.order,
              details:     that.config.output[destination.resourceType]
            };
          }).flatten().value();
        }
      });
    },

    hasStarted:function () {
      return this.elutionStarted;
    }
  });

  return Model;

});
