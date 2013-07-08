define(['text!extraction_pipeline/html_partials/graph_partial.html'], function (graphPartialHtml) {
  var graphPresenter = Object.create(null);

  function addNodesCoordonates(data) {
    console.log("data", data);
    var grid_deltaX = 50;
    var grid_deltaY = 50;
    initialiseCoord(data);
    moveIfNeeded(data);
    function moveIfNeeded(data) {
      function moveIfNeeded_rec(nodeIndex, data) {
        if (nodeIndex > 0) {
          console.log('node', nodeIndex, " === ", data.nodes[nodeIndex].name);
          var sources = _.chain(data.links).filter(function (link) {
            console.log(" >> ", link.source.name, "->", link.target.name, data.nodes[nodeIndex].name);
            return link.target.name === data.nodes[nodeIndex].name;
          }).pluck('source').value();
          if (sources.length > 1) {
            console.log(nodeIndex, " -> source considered : ", _.min(sources, function (s) {
              return s.x;
            }));
            var startNode = _.min(sources, function (source) {
              return source.x;
            });
            var endNode = data.nodes[nodeIndex];
            var startNodeX = startNode.x;
            var endNodeX = endNode.x;
            var startNodeY = startNode.y;
            var endNodeY = endNode.y;

            if (startNodeY === endNodeY) {
              _.chain(data.nodes)
                  .filter(function (node) {
                    return node.x > startNodeX && node.x < endNodeX;
                  })
                  .each(function (node) {
                    node.y += grid_deltaY;
                  });
            }
//          } else {
//            console.log("only one source");
          }
          moveIfNeeded_rec(nodeIndex - 1, data);
        }
      }

      moveIfNeeded_rec(data.nodes.length - 1, data);
      _.each(data.nodes, function (node) {
        node.x += 30;
        node.y += 30;
      })
    }

    function initialiseCoord(data) {

//      _.sortBy(data.nodes, function (node) {
//        return
//      });

      _.each(data.nodes, function (node, index) {
        $.extend(node, {x: index * grid_deltaX, y: 0, index: index});
        console.log(node);
      });
    }

    return data;
  }

  function convertNodesToObjectByName(nodes) {
    return _.reduce(nodes, function (memo, node) {
      memo[node.name] = node;
      return memo
    }, {});
  }

  // Converts link references to the objects they refer to
  function convertLinkReferencesToObjects(links, nodesByName) {
    _.each(links, function (link) {
      link.source = link.source.name ? link.source : nodesByName[link.source];
      link.target = link.target.name ? link.target : nodesByName[link.target];
      if (!link.source.links) {
        link.source.links = [];
      }
      link.source.links.push(link.target);
      if (!link.target.links) {
        link.target.links = [];
      }
      link.target.links.push(link.source);
    })
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
      this.svg = d3.select('#graphic')
//          .append('svg:svg')
          .attr('width', 500)
          .attr('height', 300)
          .attr('id', 'nodeGraph');

      this.svg.append("svg:rect")
          .attr('width', "100%")
          .attr('height', "100%")
          .attr('stroke', "#000")
          .attr('stroke-width', 3)
          .attr('fill', 'none');
      this.plot();
      return this;
    },

    plot: function () {
      // Sample data set
      var json = {
        nodes: [
          { name: 'root'},
          { name: 'B'},
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

      var nodesByName = convertNodesToObjectByName(json.nodes);
      convertLinkReferencesToObjects(json.links, nodesByName);
      addNodesCoordonates(json);

      var drag = d3.behavior.drag()
          .on("drag", function (d, i) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            updateNode(this, d.x, d.y);
//            updateNodePositions();
            updateLinkPositions();

            function updateNode(svgNode, x, y) {
              d3.select(svgNode)
                  .attr('transform', function () {
                    return "translate(" + x + "," + y + ")";
                  });
            }
          });

      var updateLinkPositions = function () {
        linksContainer.selectAll('line')
            .data(json.links)
            .attr("x1", function (d) {
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
      };

      var updateNodePositions = function () {
        nodesContainer.selectAll('.node')
            .data(json.nodes)
            .attr('transform', function (d) {
              return "translate(" + d.x + "," + d.y + ")";
            });
      };

      var hidePanel = function () {
        panel.classed('hidden', true);
        $('#input-name').off('keypress');
        $('#addNode').off('click');
      };

      var svg = this.svg;
      svg.on('click', hidePanel);

      var linksContainer = svg.append('g').attr('id', 'linksContainer');

      var updateLinks = function () {
        var edges = linksContainer.selectAll('line')
                .data(json.links)
                .enter()
                .append('line')
                .attr("x1", function (d) {
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
                })
                .attr("class", 'edge')
            ;
      }

      var nodesContainer = svg.append('g').attr('id', 'nodesContainer');

      var updateNodes = function () {
        var nodes = nodesContainer.selectAll('circle').data(json.nodes);
        nodes.enter()
            .append('svg:g')
            .attr("class", 'node')
            .on('click', function (d, i) {
              var node = this;
              panel.classed('hidden', false);
              foreignObject
                  .attr('x', d.x)
                  .attr('y', d.y);
              $('#input-name').val(d.name).on('keypress', function (event) {
                if (event.which !== 13) return;
                d.name = $('#input-name').val();
                d3.select(node).select('.node-text').text(d.name);
                hidePanel();
              });
              $('#addNode').on('click', function (event) {
                nodes.remove();
                var edges = linksContainer.selectAll('line').remove();
                svg.append('g').attr('id', 'nodesContainer');
                var name = "node_" + json.nodes.length;
                json.nodes.splice(i+1, 0, {'name': name});
                json.links.push({source: d.name, target: name});

                var nodesByName = convertNodesToObjectByName(json.nodes);
                convertLinkReferencesToObjects(json.links, nodesByName);
                addNodesCoordonates(json);

                updateNodes();
                updateLinks();
                updateNodePositions();
                hidePanel();
              });

              d3.event.stopPropagation();
            })
            .call(drag)
            .attr('transform', function (d) {
              return "translate(" + d.x + "," + d.y + ")";
            });

        nodes.append('circle')
            .attr("r", 20)
            .attr("class", 'node-circle');

        nodes.append('text')
            .attr("text-anchor", "middle")
            .attr("y", 5)
            .attr('class', 'node-text')
            .text(function (d) {
              return d.name;
            });
      };

      updateLinks();
      updateNodes();

      var foreignObject = svg.append("foreignObject")
          .attr("width", 480)
          .attr("height", 500);

      var panel = foreignObject
              .append("xhtml:body")
              .html("<input type='text' id='input-name'><button id='addNode'>add node</button>")
              .attr("id", 'node-panel')
              .attr('class', 'hidden')
              .on('click', function (d) {
                d3.event.stopPropagation();
              })

          ;

    }
  });

  return graphPresenter;
});
