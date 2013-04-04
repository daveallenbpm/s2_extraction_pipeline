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
define(['config'
        ,'mapper_services/print'
//  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction/2.json'
], function (config, PrintService) {

  var BasePageModel = Object.create(null);

  $.extend(BasePageModel, {
    addResource:function (resource) {
      if (!resource) return;

      if (resource.uuid) {
        this.stash_by_UUID[resource.uuid] = resource;
      }
      if (resource.labels && resource.labels.barcode) {
        this.stash_by_BC[resource.labels.barcode.value] = resource;
      }
    },
    fetchResourcePromiseFromUUID:function (uuid) {
      return this.fetchResourcePromise({uuid:uuid});
    },
    fetchResourcePromiseFromBarcode:function (barcode) {
      return this.fetchResourcePromise({barcode:barcode});
    },
    fetchResourcePromise:function (resourceDetails) {
      var deferredS2Resource = new $.Deferred();

      var rsc, that = this;



      if (resourceDetails.uuid) {
        rsc = this.stash_by_UUID[resourceDetails.uuid];
        if (rsc) {
          return deferredS2Resource.resolve(rsc).promise();
        } else {
          debugger;
          return deferredS2Resource.reject().promise();
        }
      }

      if (resourceDetails.barcode) {
        rsc = this.stash_by_BC[resourceDetails.barcode];
        if (rsc) {
          return deferredS2Resource.resolve(rsc).promise();
        } else {

          this.owner.getS2Root()
              .then(function (root) {
                return root.tubes.findByEan13Barcode(resourceDetails.barcode);
              }).then(function (result) {
                rsc = result;
                that.addResource(rsc);
                deferredS2Resource.resolve(rsc);
              }).fail(function () {
                deferredS2Resource.reject();
              });
        }
      }
      return deferredS2Resource.promise();
    },
    printBarcodes:function(labwareCollection) {
      var labels = [];
      var complete = false;

      labwareCollection.forEach(function (item){
        labels.push(item.labels);
      });

      var printer = PrintService.printers[0];

//      printer.print(labels)
//        .done(function (result) {
//          complete = true;
//        })
//        .fail(function (error) {
//          console.log(error);
//        }).
//        then(function(result) {
//          console.log(result);
//        });

      return complete;
    },
    createLabwareResource:function(type) {

      this.owner.getS2Root()
        .then(function (root) {
          var labwareType = {};

          switch (type) {
            case 'tube':
                labwareType = root.tubes;
              break;
            case 'spin_column':
                labwareType = root.spin_columns;
              break;
          };


        });
    }

  });

  return BasePageModel;
});