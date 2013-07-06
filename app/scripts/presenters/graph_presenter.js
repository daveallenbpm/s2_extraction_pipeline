define([], function () {
  var graphPresenter = Object.create(null);

  $.extend(graphPresenter, {
    register: function (callback) {
      callback('graph_presenter', function () {
        var instance = Object.create(graphPresenter);
        graphPresenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function () {
      d3.select('#graph')
        .style("display", "block");

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
          { name: 'Hodor'}
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
            target: 'Hodor'}
        ]

      };

      $('#graph').append('<svg style="border:2px solid black"><g id="vis"></g></svg>');
      var vis = d3.select('#vis').attr('transform', 'translate(20, 20)');

      // Build initial link elements - Build first so they are under the nodes
      var links = vis.selectAll('line.link').data(json.links);
      links.enter().append('line').attr('class', 'link');

      // Build initial node elements
      var nodes = vis.selectAll('g.node').data(json.nodes);
      nodes.enter().append('g').attr('class', 'node').append('circle').attr('r', 10);

      // Add the node titles
      nodes.append('text')
        .attr("x", 15)
        .attr("dy", ".31em")
        .style("stroke", "black")
        .text(function (d) {
        return d.name;
      });

      // Store nodes in a hash by name
      var nodesByName = {};
      nodes.each(function (d) {
        nodesByName[d.name] = d;
      });

      // Convert link references to objects
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
      });

      // Compute positions based on distance from root
      // Put algorithm here
      var setPosition = function (node, i, depth) {
        if (!depth) {
          depth = 0;
        }
        if (!node.x) {
          node.x = (i + 1) * 60;
          node.y = (depth + 1) * 60;
          if (depth <= 1) {
            _.each(node.links, function (d, i2) {
              setPosition(d, i2, depth + 1);
            });
          }

        }

      };
      nodes.each(setPosition);

      // Update inserted elements with computed positions
      nodes.attr('transform', function (d) {
        return 'translate(' + d.x + ', ' + d.y + ')';
      });

      links.attr('x1',function (d) {
        return d.source.x;
      }).attr('y1',function (d) {
          return d.source.y;
        }).attr('x2',function (d) {
          return d.target.x;
        }).attr('y2', function (d) {
          return d.target.y;
        });

      nodes.on('click', function(node){
        console.log(node.name);
      });
    }
  });

  return graphPresenter;
});
