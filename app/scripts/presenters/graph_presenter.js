define(['text!extraction_pipeline/html_partials/graph_partial.html'], function (graphPartialHtml) {
  var graphPresenter = Object.create(null);

  function updateGraph(nodes, links) {
    nodes.attr('transform', function (d) {
      return 'translate(' + d.x + ', ' + d.y + ')';
    });

    links
      .attr('x1', function (d) {
        return d.source.x;
      })
      .attr('y1', function (d) {
        return d.source.y;
      })
      .attr('x2', function (d) {
        return d.target.x;
      })
      .attr('y2', function (d) {
        return d.target.y;
      });
  }

  // Basic algorithm for plotting nodes
  function setPosition(node, i, depth) {
    // Compute positions based on distance from root
    if (!depth) {
      depth = 0;
    }
    if (!node.x) {
      node.x = (i + 1) * 80;
      node.y = (depth + 1) * 80;
      if (depth <= 1) {
        _.each(node.links, function (link, i2) {
          setPosition(link, i2, depth + 1);
        });
      }
    }
  }

  function convertNodesToObjectByName(nodes){
    var nodesByName = {};
    nodes.each(function (node) {
      nodesByName[node.name] = node;
    });
    return nodesByName;
  }

  // Converts link references to the objects they refer to
  function convertLinkReferencesToObjects(links, nodesByName){
    links.each(function (link) {
      link.source = nodesByName[link.source];
      link.target = nodesByName[link.target];
      if (!link.source.links) {
        link.source.links = [];
      }
      link.source.links.push(link.target);
      if (!link.target.links) {
        link.target.links = [];
      }
      link.target.links.push(link.source);
    })
  };

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
      this.d3GraphSelection = d3.select('#vis').attr('transform', 'translate(20, 20)');
      this.plot();
      return this;
    },

    plot: function () {
      // Sample data set
      var json = {
        nodes: [
          { name: 'Peter'},
          { name: 'Jon'},
          { name: 'Jimmers'},
          { name: 'Hodor'},
          { name: 'Vasily'},
          { name: 'Steven'}
        ],
        links: [
          {
            source: 'Peter',
            target: 'Jon'},
          {
            source: 'Peter',
            target: 'Jimmers'},
          {
            source: 'Jon',
            target: 'Hodor'},
          {
            source: 'Jimmers',
            target: 'Hodor'},
          {
            source: "Peter",
            target: 'Vasily'
          },
          {
            source: 'Jon',
            target: 'Steven'
          }
        ]
      };

      // Build initial link elements - Build first so they are under the nodes
      var links = this.d3GraphSelection.selectAll('line.link').data(json.links);
      links.enter().append('line').attr('class', 'link');

      // Build initial node elements
      var nodes = this.d3GraphSelection.selectAll('g.node').data(json.nodes);
      nodes.enter().append('g').attr('class', 'node').append('circle').attr('r', 10);

      // Add the node titles
      nodes.append('text')
        .attr("x", 15)
        .attr("dy", ".31em")
        .style("stroke", "black")
        .text(function (d) {
          return d.name;
        });

      var nodesByName = convertNodesToObjectByName(nodes);

      convertLinkReferencesToObjects(links, nodesByName);

      // Sub our own algorithm for this
      nodes.each(setPosition);

      // Update inserted elements with computed positions
      updateGraph(nodes, links);

      // Add basic click functionality
      nodes.on('click', function (node) {
        console.log(node.name);
      });
    }
  });

  return graphPresenter;
});
