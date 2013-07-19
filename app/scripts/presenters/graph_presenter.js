define(['text!extraction_pipeline/html_partials/graph_partial.html'], function (graphPartialHtml) {
  var graphPresenter = Object.create(null);

  var json = {
    title: "Pipeline overview",
    nodes: [
      { name: 'root', fixed: true },
      { name:       'B',
        'subGraph': {
          title: "Component B",
          nodes: [
            { name: 'B0', fixed: true },
            { name: 'B1'},
            { name: 'B2'},
            { name: 'B3'},
            { name: 'B4'}
          ],
          links: [
            {
              source: 'B0',
              target: 'B1'
            },
            {
              source: 'B1',
              target: 'B2'
            },
            {
              source: 'B2',
              target: 'B4'
            },
            {
              source: 'B0',
              target: 'B3'
            },
            {
              source: 'B3',
              target: 'B4'
            }
          ]
        }
      },
      { name: 'C'},
      { name: 'D'},
      { name: 'E'},
      { name: 'F'},
      { name: 'G'},
      { name: 'H'}
    ],
    links: [
      {
        source: 'root',
        target: 'B'
      },
      {
        source: 'root',
        target: 'H'
      },
      {
        source: 'B',
        target: 'C'
      },
      {
        source: 'C',
        target: 'D'
      },
      {
        source: 'C',
        target: 'F'
      },
      {
        source: 'C',
        target: 'H'
      },
      {
        source: "D",
        target: 'E'
      },
      {
        source: "D",
        target: 'F'
      },
      {
        source: "E",
        target: 'F'
      },
      {
        source: 'F',
        target: 'G'
      },
      {
        source: 'G',
        target: 'H'
      }
    ]
  };

  function convertLinkReferencesToObjects(graphData) {

    var nodesByName = {};
    _.each(graphData.nodes, function (node) {
      nodesByName[node.name] = node;
      delete node.links;
    });

    // Convert link references to objects -
    // d3 needs each link to have source and target objects, with their respective links
    _.each(graphData.links, function (link) {
      // check to see if the references have been consolidated previously!
      link.source = $.isPlainObject(link.source) ? nodesByName[link.source.name] : nodesByName[link.source];
      link.target = $.isPlainObject(link.target) ? nodesByName[link.target.name] : nodesByName[link.target];
      if (!link.source.links) {
        link.source.links = [];
      }
      link.source.links.push(link.target);
      if (!link.target.links) {
        link.target.links = [];
      }
      link.target.links.push(link.source);
    });
  }

  function addLink(currentNode){
    return function (event){
      var targetNodeName = this.contextMenuSelection.find("input.add-link-input").val();

      if (targetNodeName === currentNode.name){
        // trying to link to itself: not valid
        console.log("Input error: cannot link node to itself");
        return;
      }

      var linkExists = _.find(this.graphData.links, function(link){
        return link.source.name === currentNode.name && link.target.name === targetNodeName;
      });
      var reversedLinkExists = _.find(this.graphData.links, function(link){
        return link.source.name === targetNodeName && link.target.name === currentNode.name;
      });
      var nodeExists = _.find(this.graphData.nodes, function (n) {
        return n.name === targetNodeName;
      });

      if (nodeExists) {
        if(linkExists || reversedLinkExists){
          // link exists: input error
          console.log("Input error: link already exists")
        }
        else{
          var newLink = { source: currentNode.name, target: targetNodeName };
          this.graphData.links.push(newLink);
          this.refreshGraph(this.graphData);
        }
      }
      else {
        // input error, link not found
        console.log("Input error: link not found");
      }
    }
  }

  function zoomIn(node) {
    return function (event) {
      if (node.subGraph) {
        var presenter = this;
        this.parentGraphData = this.graphData;

       // temporary solution!
        this.view.find("#zoom-out-btn")
          .removeClass("hidden")
          .on("click", function(){
            presenter.refreshGraph(presenter.parentGraphData);
            presenter.view.find("#zoom-out-btn").addClass("hidden");
          });

        this.refreshGraph(node.subGraph);
      }
    }
  }

  function addNode(currentNode) {
    return function (event) {
      var newNodeName = this.contextMenuSelection.find("input.add-node-input").val();
      var newNode = { name: newNodeName };
      var newLink = { source: currentNode.name || "root", target: newNode.name };
      this.graphData.nodes.push(newNode);
      this.graphData.links.push(newLink);
      this.refreshGraph(this.graphData);
    }
  }

  function deleteNode(currentNode) {
    return function (event){
    // delete the node
    this.graphData.nodes = _.reject(this.graphData.nodes, function (n) {
      return n === currentNode;
    });

    // delete all links associated with this node
    this.graphData.links = _.reject(this.graphData.links, function (link) {
      return link.source === currentNode || link.target === currentNode;
    });

    this.refreshGraph(this.graphData);
    }
  }

  function deleteLink(link){
    return function (event) {
      this.graphData.links = _.reject(this.graphData.links, function(l){
        return l === link;
      });

      this.refreshGraph(this.graphData);
    }
  }

  function insertNode (link){
    return function (event) {
      // add a new node, with link from source to new node
      var newNodeName = this.linkContextMenuSelection.find("input.insert-node-input").val();
      var newNode = { name: newNodeName };
      var newLink = { source: link.source.name || "root", target: newNode.name };
      this.graphData.nodes.push(newNode);
      this.graphData.links.push(newLink);

      // add a link from the new node to the target node
      var targetNodeName = link.target.name;
      var otherLink = { source: newNode.name, target: targetNodeName };
      this.graphData.links.push(otherLink);

      // remove the original link
      this.graphData.links = _.reject(this.graphData.links, function(l){
        return l === link;
      });

      this.refreshGraph(this.graphData);
    }
  }

  $.extend(graphPresenter, {
    register: function (callback) {
      callback('graph_presenter', function () {
        var instance = Object.create(graphPresenter);
        graphPresenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function () {
      this.view = $('#graph').append(graphPartialHtml);
      this.contextMenuSelection = this.view.find("#context-menu");
      this.linkContextMenuSelection = this.view.find("#link-context-menu");
      this.loadData(json);
      this.plot();
      return this;
    },

    loadData:function(json){
      this.graphData = json;
    },

    setupContextMenuClickHandlers: function (node) {

      // first unbind previous click events
      var subGraphBtn = this.contextMenuSelection.find("#sub-graph-btn").off();
      var addNodeBtn = this.contextMenuSelection.find("#add-node-btn").off();
      var addLinkBtn = this.contextMenuSelection.find("#add-link-btn").off();
      var deleteNodeBtn = this.contextMenuSelection.find("#delete-node-btn").off();

      subGraphBtn.on('click', _.bind(zoomIn(node),this));
      addNodeBtn.on('click', _.bind(addNode(node), this));
      addLinkBtn.on('click', _.bind(addLink(node), this));
      deleteNodeBtn.on('click', _.bind(deleteNode(node), this));
    },

    setupLinkContextMenuClickHandlers: function (link){
      var deleteLinkBtn = this.linkContextMenuSelection.find("#delete-link-btn").off();
      var insertNodeBtn = this.linkContextMenuSelection.find("#add-node-on-link-btn").off();

      deleteLinkBtn.on('click', _.bind(deleteLink(link), this));
      insertNodeBtn.on('click', _.bind(insertNode(link), this));
    },

    clearGraph: function () {
      this.view.find("#graphic").empty();
      this.force.stop();
    },

    refreshGraph: function (data) {
      this.clearGraph();
      this.loadData(data);
      this.plot();
      this.closeContextMenu();
      this.closeLinkContextMenu();
    },

    plot: function () {
      var graphData = this.graphData;
      this.view.find("#title").text(graphData.title);
      var graphPresenter = this;
      var width = 960, height = 500;
      var color = d3.scale.category20();

      var nodes = graphData.nodes;
      var links = graphData.links;

      var svg = d3.select("#graphic")
        .attr("width", width)
        .attr("height", height);

      convertLinkReferencesToObjects(graphData);

      var force = d3.layout.force()
        .charge(-120)
        .linkDistance(50)
        .size([width, height])
        .nodes(nodes)
        .links(links)
        .start();

      var link = svg.selectAll(".edge")
        .data(links)
        .enter().append("line")
        .attr("class", "edge")
        .style("stroke-width", function (d) {
          return Math.sqrt(d.value);
        });

      var node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("svg:g")
        .attr("class", "node")
        .call(force.drag)

      node.append("circle")
        .attr("class", "node-circle")
        .attr("r", 10)
        .style("fill", function (d) {
          return color(d.group);
        });

      var title = node.append("text")
        .text(function (d) {
          return d.name;
        });

      force.on("tick", function () {
        link.attr("x1", function (d) {
          return d.source.x;
        })
          .attr("y1", function (d) {
            return d.source.y;
          })
          .attr("x2", function (d) {
            return d.target.x;
          })
          .attr("y2", function (d) {
            return d.target.y;
          });

        node.attr('transform', function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      });

      node.on('click', function (clickedNode) {
        graphPresenter.setupContextMenu(clickedNode);
      });

      link.on('click', function (clickedLink){
        graphPresenter.setupLinkContextMenu(clickedLink);
      });

      this.force = force;
    },

    setupLinkContextMenu: function (clickedLink) {
      this.setupLinkContextMenuClickHandlers(clickedLink);
      this.linkContextMenuSelection.removeClass("hidden");
    },

    closeLinkContextMenu: function(){
      var deleteLinkBtn = this.linkContextMenuSelection.find("#delete-link-btn").off();
      var insertNodeBtn = this.linkContextMenuSelection.find("#add-node-on-link-btn").off();

      this.linkContextMenuSelection.addClass("hidden");
    },

    setupContextMenu: function (currentNode) {
      this.setupContextMenuClickHandlers(currentNode);
      this.contextMenuSelection.removeClass("hidden");
      this.contextMenuSelection.find(".context-menu-title").text("Options for node " + currentNode.name);
      if (!currentNode.subGraph) {
        this.contextMenuSelection.find("#sub-graph-btn").hide();
      }
      else {
        this.contextMenuSelection.find("#sub-graph-btn").show();
      }
    },

    closeContextMenu: function (){
      var subGraphBtn = this.contextMenuSelection.find("#sub-graph-btn").off();
      var addNodeBtn = this.contextMenuSelection.find("#add-node-btn").off();
      var addLinkBtn = this.contextMenuSelection.find("#add-link-btn").off();
      var deleteNodeBtn = this.contextMenuSelection.find("#delete-node-btn").off();

      this.contextMenuSelection.addClass("hidden");
    }
  });

  return graphPresenter;
});
