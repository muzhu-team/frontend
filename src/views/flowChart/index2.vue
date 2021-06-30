<template>
  <div id="container">

  </div>
</template>

<script>
import { Graph, Edge, Shape, NodeView } from '@antv/x6'



function createDag()
{

  // 定义节点
  class MyShape extends Shape.Rect {
    getInPorts() {
      return this.getPortsByGroup('in')
    }

    getOutPorts() {
      return this.getPortsByGroup('out')
    }

    getUsedInPorts(graph) {
      const incomingEdges = graph.getIncomingEdges(this) || []
      return incomingEdges.map((edge) => {
        const portId = edge.getTargetPortId()
        return this.getPort(portId)
      })
    }

    getNewInPorts(length) {
      return Array.from(
          {
            length,
          },
          () => {
            return {
              group: 'in',
            }
          },
      )
    }

    updateInPorts(graph) {
      const minNumberOfPorts = 2
      const ports = this.getInPorts()
      const usedPorts = this.getUsedInPorts(graph)
      const newPorts = this.getNewInPorts(
          Math.max(minNumberOfPorts - usedPorts.length, 1),
      )

      if (
          ports.length === minNumberOfPorts &&
          ports.length - usedPorts.length > 0
      ) {
        // noop
      } else if (ports.length === usedPorts.length) {
        this.addPorts(newPorts)
      } else if (ports.length + 1 > usedPorts.length) {
        this.prop(
            ['ports', 'items'],
            this.getOutPorts().concat(usedPorts).concat(newPorts),
            {
              rewrite: true,
            },
        )
      }

      return this
    }
  }

  MyShape.config({
    attrs: {
      root: {
        magnet: false,
      },
      body: {
        fill: '#f5f5f5',
        stroke: '#d9d9d9',
        strokeWidth: 1,
      },
    },
    ports: {
      items: [
        {
          group: 'out',
        },
      ],
      groups: {
        in: {
          position: {
            name: 'top',
          },
          attrs: {
            portBody: {
              magnet: 'passive',
              r: 6,
              stroke: '#ffa940',
              fill: '#fff',
              strokeWidth: 2,
            },
          },
        },
        out: {
          position: {
            name: 'bottom',
          },
          attrs: {
            portBody: {
              magnet: true,
              r: 6,
              fill: '#fff',
              stroke: '#3199FF',
              strokeWidth: 2,
            },
          },
        },
      },
    },
    portMarkup: [
      {
        tagName: 'circle',
        selector: 'portBody',
      },
    ],
  })

  // 高亮
  const magnetAvailabilityHighlighter = {
    name: 'stroke',
    args: {
      attrs: {
        fill: '#fff',
        stroke: '#47C769',
      },
    },
  }


  // Graph.registerNode(
  //     'MyShape',
  //     {
  //       width: 180,
  //       height: 60,
  //       markup: [
  //         {
  //           tagName: 'rect',
  //           selector: 'body',
  //         },
  //         {
  //           tagName: 'image',
  //           selector: 'avatar',
  //         },
  //         {
  //           tagName: 'text',
  //           selector: 'rank',
  //         },
  //         {
  //           tagName: 'text',
  //           selector: 'name',
  //         },
  //         {
  //           tagName: 'g',
  //           attrs: {
  //             class: 'btn del',
  //           },
  //           children: [
  //             {
  //               tagName: 'circle',
  //               attrs: {
  //                 class: 'del',
  //               },
  //             },
  //             {
  //               tagName: 'text',
  //               attrs: {
  //                 class: 'del',
  //               },
  //             },
  //           ],
  //         },
  //       ],
  //       attrs: {
  //         body: {
  //           refWidth: '100%',
  //           refHeight: '100%',
  //           fill: '#FFFFFF',
  //           stroke: '#000000',
  //           strokeWidth: 2,
  //           rx: 10,
  //           ry: 10,
  //           pointerEvents: 'visiblePainted',
  //         },
  //         avatar: {
  //           width: 48,
  //           height: 48,
  //           refX: 8,
  //           refY: 6,
  //         },
  //         rank: {
  //           refX: 0.83,
  //           refY: 0.2,
  //           fontFamily: 'Courier New',
  //           fontSize: 14,
  //           textAnchor: 'end',
  //           textDecoration: 'underline',
  //         },
  //         name: {
  //           refX: 0.95,
  //           refY: 0.6,
  //           fontFamily: 'Courier New',
  //           fontSize: 14,
  //           fontWeight: '800',
  //           textAnchor: 'end',
  //         },
  //         '.btn > circle': {
  //           r: 10,
  //           fill: 'transparent',
  //           stroke: '#333',
  //           strokeWidth: 1,
  //         },
  //         '.btn.del': {
  //           refDx: -15,
  //           refY: 16,
  //           event: 'node:delete',
  //         },
  //         '.btn.del > text': {
  //           fontSize: 28,
  //           fontWeight: 500,
  //           stroke: '#000',
  //           x: -4.5,
  //           y: 6,
  //           fontFamily: 'Times New Roman',
  //           text: '-',
  //         },
  //       },
  //       ports: {
  //         items: [
  //           {
  //             group: 'in',
  //           },
  //           {
  //             group: 'out',
  //           },
  //         ],
  //         groups: {
  //           in: {
  //             position: {
  //               name: 'top',
  //             },
  //             attrs: {
  //               portBody: {
  //                 magnet: 'passive',
  //                 r: 6,
  //                 stroke: '#ffa940',
  //                 fill: '#fff',
  //                 strokeWidth: 2,
  //               },
  //             },
  //           },
  //           out: {
  //             position: {
  //               name: 'bottom',
  //             },
  //             attrs: {
  //               portBody: {
  //                 magnet: true,
  //                 r: 6,
  //                 fill: '#fff',
  //                 stroke: '#3199FF',
  //                 strokeWidth: 2,
  //               },
  //             },
  //           },
  //         },
  //       },
  //       portMarkup: [
  //         {
  //           tagName: 'circle',
  //           selector: 'portBody',
  //         },
  //       ],
  //     },
  //     true,
  // )


  // 画布
  const graph = new Graph({
    width: 1000,
    height: 1000,
    grid: true,
    container: document.getElementById('container'),
    highlighting: {
      magnetAvailable: magnetAvailabilityHighlighter,
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#fff',
            stroke: '#31d0c6',
          },
        },
      },
    },
    connecting: {
      snap: true,
      allowBlank: false,
      allowLoop: false,
      highlight: true,
      connector: 'rounded',
      connectionPoint: 'boundary',
      router: {
        name: 'er',
        args: {
          direction: 'V',
        },
      },
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#a0a0a0',
              strokeWidth: 1,
              targetMarker: {
                name: 'classic',
                size: 7,
              },
            },
          },
        })
      },
      validateConnection({sourceView, targetView, targetMagnet}) {
        if (!targetMagnet) {
          return false
        }

        if (targetMagnet.getAttribute('port-group') !== 'in') {
          return false
        }

        if (targetView) {
          const node = targetView.cell
          if (node instanceof MyShape) {
            const portId = targetMagnet.getAttribute('port')
            const usedInPorts = node.getUsedInPorts(graph)
            if (usedInPorts.find((port) => port && port.id === portId)) {
              return false
            }
          }
        }

        return true
      },
    },
  })

  graph.addNode(
      new MyShape().resize(120, 40).position(200, 50).updateInPorts(graph),
  //         .attrs({
  //       body: {
  //         fill: '#feb563',
  //         stroke: 'none',
  //       },
  //       avatar: {
  //         opacity: 0.7,
  //         'xlink:href': 'https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*kUy8SrEDp6YAAAAAAAAAAAAAARQnAQ',
  //       },
  //       rank: {
  //         text: 'CEO',
  //         fill: '#000',
  //         wordSpacing: '-5px',
  //         letterSpacing: 0,
  //       },
  //       name: {
  //         text: name,
  //         fill: '#000',
  //         fontSize: 13,
  //         fontFamily: 'Arial',
  //         letterSpacing: 0,
  //       },
  //     }),
  )

  graph.addNode(
      new MyShape().resize(120, 40).position(400, 50).updateInPorts(graph),
  )

  graph.addNode(
      new MyShape().resize(120, 40).position(300, 250).updateInPorts(graph),
  )

  function update(view) {
    const cell = view.cell
    if (cell instanceof MyShape) {
      cell.getInPorts().forEach((port) => {
        const portNode = view.findPortElem(port.id, 'portBody')
        view.unhighlight(portNode, {
          highlighter: magnetAvailabilityHighlighter,
        })
      })
      cell.updateInPorts(graph)
    }
  }

  graph.on('edge:connected', ({previousView, currentView}) => {
    if (previousView) {
      update(previousView)
    }
    if (currentView) {
      update(currentView)
    }
  })

  graph.on('edge:removed', ({edge, options}) => {
    if (!options.ui) {
      return
    }

    const target = edge.getTargetCell()
    if (target instanceof MyShape) {
      target.updateInPorts(graph)
    }
  })

  graph.on('edge:mouseenter', ({edge}) => {
    edge.addTools([
      'source-arrowhead',
      'target-arrowhead',
      {
        name: 'button-remove',
        args: {
          distance: -30,
        },
      },
    ])
  })

  graph.on('edge:mouseleave', ({edge}) => {
    edge.removeTools()
  })
}

export default {
  mounted () {
    createDag();
  },
}

</script>