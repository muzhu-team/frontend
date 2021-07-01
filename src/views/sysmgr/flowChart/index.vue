

<template>
  <div>
    <div id="container">
    </div>
    <el-dialog title="新增节点" :visible.sync="addNodeVisible" style="width: 1000px">
      <el-form :model="addNodeForm" ref="addNodeForm" :rules="rules" label-width="70px" label-position="right" size="small" style="width: 400px; margin-left:20px;">
        <el-form-item label="名称" prop="name" >
          <el-input v-model="addNodeForm.name" placeholder="请输入节点名"></el-input>
        </el-form-item>
<!--        <el-form-item label="权限" prop="rank" >-->
<!--          <el-input v-model="addNodeForm.rank" placeholder="请输入权限"></el-input>-->
<!--        </el-form-item>-->
        <el-form-item label="权限" prop="rank">
          <el-select v-model="addNodeForm.rank" class="filter-item" filterable reserve-keyword placeholder="请选择权限...">
            <el-option v-for="index in 3" :key="index-1" :label="rank_name[index-1]" :value="index-1"/>
          </el-select>
        </el-form-item>
<!--        <el-form-item label="性别" prop="gender" >-->
<!--          <el-input v-model="addNodeForm.gender" type="password" placeholder="请输入性别"></el-input>-->
<!--        </el-form-item>-->
        <el-form-item label="性别" prop="gender">
          <el-select v-model="addNodeForm.gender" class="filter-item" filterable reserve-keyword placeholder="请选择性别...">
            <el-option v-for="item in gender" :key="item.id" :label="item.sc" :value="item.id"/>
          </el-select>
        </el-form-item>
<!--        <el-form-item label="父节点" prop="parent_node">-->
<!--          <el-select v-model="addNodeForm.parent_node" class="filter-item" filterable reserve-keyword placeholder="请选择父节点...">-->
<!--            <el-option v-for="node in data_node" :key="node.node_id" :label="node.node_name" :value="node.node_id"/>-->
<!--          </el-select>-->
<!--        </el-form-item>-->
      </el-form>
    <span slot="footer" class="dialog-footer">
            <el-button @click="addNodeVisible = false" size="small">取 消</el-button>
            <el-button type="primary" @click="submitAddNode('addNodeForm')" size="small" >确 定</el-button>
          </span>

    </el-dialog>
  </div>
</template>
<script>

import { Graph, Node , Shape } from '@antv/x6'
import {getDagInfo} from "@/api/dag/dagList";
// import { GridLayout } from '@antv/layout'
import dagre from 'dagre'

export default {
  data() {

    const validateNodeName = (rule, value, callback) => {
      if (value.length < 3 || value.length > 10) {
        callback(new Error('长度在 3 到 10 个字符'))
      } else {
        callback()
      }
    }

    return{

      dir:'TB',
      graph:'',
      node_arr:[],

      rules: {
        name: [
          { required: true, trigger: 'blur' ,validator: validateNodeName},
          // { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' }
        ],
        rank: [
          { required: true, message: '请选择权限', trigger: 'integer' },
        ],
        gender: [
          {required: true, message: '请选择性别',trigger: 'blur'}
        ],
      },

      gender:[
        {"id":0,"name":"male","sc":"男"},
        {"id":1,"name":"female","sc":"女"},
        {"id":2,"name":"secret","sc":"保密"},
      ],

      addNodeForm:{
        name:'',
        rank:'',
        gender:'',
        parent_node:''
      },

      addNodeVisible:false,
      user_pic_info:{
        0:"https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*kUy8SrEDp6YAAAAAAAAAAAAAARQnAQ", //male
        1:"https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*f6hhT75YjkIAAAAAAAAAAAAAARQnAQ", //female
        // 2:"../../../assets/gender/secret.png", //secret
        2:"https://t1.daumcdn.net/cfile/tistory/9951F7395A54D1F92C", //secret
      },

      rank_color:{
        0:"#30d0c6", //CEO
        1:"#7c68fd", //VP Marketing
        2:"#feb563", //Manager
      },

      rank_name:{
        0:"CEO",
        1:"VP Marketing",
        2:"Manager",
      },
      // data_node:[
      //   {"dag_id":1,"node_id":1,"node_name":"Bart Simpson","rank":0,"gender":0},
      //   {"dag_id":1,"node_id":2,"node_name":"Homer Simpson","rank":1,"gender":0},
      //   {"dag_id":1,"node_id":3,"node_name":"Marge Simpson","rank":1,"gender":1},
      //   {"dag_id":1,"node_id":4,"node_name":"Lisa Simpson","rank":1,"gender":1},
      //   {"dag_id":1,"node_id":5,"node_name":"Lenny Leonard","rank":2,"gender":0},
      //   {"dag_id":1,"node_id":6,"node_name":"Carl Carlson","rank":2,"gender":0},
      //   {"dag_id":1,"node_id":7,"node_name":"Maggie Simpson","rank":2,"gender":1},
      // ],

      data_node:[],

      // data_edge:[
      //   {"edge_id":1,"src":1,"dst":2},
      //   {"edge_id":2,"src":1,"dst":3},
      //   {"edge_id":3,"src":1,"dst":4},
      //   {"edge_id":4,"src":2,"dst":5},
      //   {"edge_id":5,"src":2,"dst":6},
      //   {"edge_id":6,"src":3,"dst":7},
      // ],

      data_edge:[],

    }
  },
// const male = 'https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*kUy8SrEDp6YAAAAAAAAAAAAAARQnAQ'
// const female = 'https://gw.alipayobjects.com/mdn/rms_43231b/afts/img/A*f6hhT75YjkIAAAAAAAAAAAAAARQnAQ'

  methods: {
    async getData(dagId){
      getDagInfo(dagId).then((res) => {
          this.data_node=res.data.node.records
          this.data_edge=res.data.edge.records
          this.createDag()
      });
    },

  // 自动布局
    layout() {
      const nodes = this.graph.getNodes()
      const edges = this.graph.getEdges()
      const g = new dagre.graphlib.Graph()
      g.setGraph({ rankdir: this.dir, nodesep: 16, ranksep: 16 })
      g.setDefaultEdgeLabel(() => ({}))

      const width = 200
      const height = 90
      nodes.forEach((node) => {
        g.setNode(node.id, { width, height })
      })

      edges.forEach((edge) => {
        const source = edge.getSource()
        const target = edge.getTarget()
        g.setEdge(source.cell, target.cell)
      })

      dagre.layout(g)

      this.graph.freeze()

      g.nodes().forEach((id) => {
        const node = this.graph.getCell(id)
        if (node) {
          const pos = g.node(id)
          node.position(pos.x, pos.y)
        }
      })

      edges.forEach((edge) => {
        const source = edge.getSourceNode()
        const target = edge.getTargetNode()
        const sourceBBox = source.getBBox()
        const targetBBox = target.getBBox()

        // console.log(sourceBBox, targetBBox)

        if ((this.dir === 'LR' || this.dir === 'RL') && sourceBBox.y !== targetBBox.y) {
          const gap =
              this.dir === 'LR'
                  ? targetBBox.x - sourceBBox.x - sourceBBox.width
                  : -sourceBBox.x + targetBBox.x + targetBBox.width
          const fix = this.dir === 'LR' ? sourceBBox.width : 0
          const x = sourceBBox.x + fix + gap / 2
          edge.setVertices([
            { x, y: sourceBBox.center.y },
            { x, y: targetBBox.center.y },
          ])
        } else if (
            (this.dir === 'TB' || this.dir === 'BT') &&
            sourceBBox.x !== targetBBox.x
        ) {
          const gap =
              this.dir === 'TB'
                  ? targetBBox.y - sourceBBox.y - sourceBBox.height
                  : -sourceBBox.y + targetBBox.y + targetBBox.height
          const fix = this.dir === 'TB' ? sourceBBox.height : 0
          const y = sourceBBox.y + fix + gap / 2
          edge.setVertices([
            { x: sourceBBox.center.x, y },
            { x: targetBBox.center.x, y },
          ])
        } else {
          edge.setVertices([])
        }
      })
      this.graph.unfreeze()
    },

    submitAddNode(formName){
      this.$refs[formName].validate((valid) => {
        if (valid) {
          // this.$refs['ruleForm'].resetFields();
          // console.log(this.addNodeForm)
          // this.member(100 , 100, this.rank_name[this.addNodeForm.rank], this.addNodeForm.name, this.user_pic_info[this.addNodeForm.gender], this.rank_color[this.addNodeForm.rank])
          let member=this.member(this.rank_name[this.addNodeForm.rank], this.addNodeForm.name, this.user_pic_info[this.addNodeForm.gender], this.rank_color[this.addNodeForm.rank])
          this.link(this.addNodeForm.parent_node, member)

          this.addNodeVisible = false;
          this.addNodeForm={};
          this.layout()
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },


    initGraph(id, width, height) {
      const MyShape = Node.define({
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

      Graph.registerNode(
          'MyShape',
          {
            width: 210,
            height: 60,
            markup: [
              {
                tagName: 'rect',
                selector: 'body',
              },
              {
                tagName: 'image',
                selector: 'avatar',
              },
              {
                tagName: 'text',
                selector: 'rank',
              },
              {
                tagName: 'text',
                selector: 'name',
              },
              {
                tagName: 'g',
                attrs: {
                  class: 'btn add',
                },
                children: [
                  {
                    tagName: 'circle',
                    attrs: {
                      class: 'add',
                    },
                  },
                  {
                    tagName: 'text',
                    attrs: {
                      class: 'add',
                    },
                  },
                ],
              },
              {
                tagName: 'g',
                attrs: {
                  class: 'btn del',
                },
                children: [
                  {
                    tagName: 'circle',
                    attrs: {
                      class: 'del',
                    },
                  },
                  {
                    tagName: 'text',
                    attrs: {
                      class: 'del',
                    },
                  },
                ],
              },
            ],
            attrs: {
              body: {
                refWidth: '100%',
                refHeight: '100%',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeWidth: 2,
                rx: 10,
                ry: 10,
                pointerEvents: 'visiblePainted',
              },
              avatar: {
                width: 48,
                height: 48,
                refX: 8,
                refY: 6,
              },
              rank: {
                refX: 0.72,
                refY: 0.2,
                fontFamily: 'Courier New',
                fontSize: 14,
                textAnchor: 'end',
                textDecoration: 'underline',
              },
              name: {
                refX: 0.9,
                refY: 0.6,
                fontFamily: 'Courier New',
                fontSize: 14,
                fontWeight: '800',
                textAnchor: 'end',
              },
              '.btn > circle': {
                r: 10,
                fill: 'transparent',
                stroke: '#333',
                strokeWidth: 1,
              },
              '.btn.del': {
                refDx: -15,
                refY: 16,
                event: 'node:delete',
              },
              '.btn.add': {
                refDx: -40,
                refY: 16,
                event: 'node:add',
              },
              '.btn.add > text': {
                fontSize: 20,
                fontWeight: 800,
                stroke: '#000',
                x: -5.5,
                y: 7,
                fontFamily: 'Times New Roman',
                text: '+',
              },
              '.btn.del > text': {
                fontSize: 28,
                fontWeight: 500,
                stroke: '#000',
                x: -4.5,
                y: 6,
                fontFamily: 'Times New Roman',
                text: '-',
              },
            },
            ports: {
              items: [
                {
                  group: 'in',
                },
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
          },
          true,
      )

      Graph.registerEdge(
          'org-edge',
          {
            zIndex: -1,
            attrs: {
              line: {
                fill: 'none',
                strokeLinejoin: 'round',
                strokeWidth: '2',
                stroke: '#4b4a67',
                sourceMarker: null,
                targetMarker: null,
              },
            },
          },
          true,
      )

      // 高亮
      const magnetAvailabilityHighlighter = {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#fff',
            stroke: '#cc0000',
          },
        },
      }
      this.graph = new Graph({
        width: width,
        height: height,
        container: document.getElementById(id),
        grid: true,
        highlighting: {
          magnetAvailable: magnetAvailabilityHighlighter,
          magnetAdsorbed: {
            name: 'stroke',
            args: {
              attrs: {
                fill: '#fff',
                stroke: '#ff8888',
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
                  // strokeWidth: 1,
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
                const usedInPorts = node.getUsedInPorts(this.graph)
                if (usedInPorts.find((port) => port && port.id === portId)) {
                  return false
                }
              }
            }
            return true
          },
        },
      })
      // return graph;
    },


    // sum 前面X座標累加
    // layer
    // treeNum 此tree有多少node
    // nodeOrder node在tree裏的位置

    // layer_info[layer][treeNum] 此樹有多少節點
    // layer_info[layer].reduce(function(a, b) { return a + b; }, 0) 這層有多少節點

    // function getCoordinates(){
    //   // 返回的結果
    //   let result=new Map();
    //
    //   // layerNode{} 這層的節點數
    //   let layerNode=new Map();
    //
    //   // 暫存.用於判斷是否換子樹
    //   let node_tmp=new Map();
    //
    //   // nodeInfo[i][0] 節點屬於第幾層
    //   // nodeInfo[i][1] 子樹的節點數
    //   // nodeInfo[i][2] 目前子樹的節點順序
    //   let nodeInfo=new Array(data_node.length);
    //
    //   // 區塊最小值
    //   let min=0;
    //   // 區塊最大值
    //   let max=0;
    //
    //   // 總層數
    //   let maxLayer=0;
    //
    //   for(let i = 0; i < data_node.length; i++) {
    //     nodeInfo[i]=new Array(3)
    //     nodeInfo[i][0]=(data_node[i].parent_node)?nodeInfo[data_node[i].parent_node-1][0]+1:0;
    //     maxLayer=Math.max(maxLayer,nodeInfo[i][0])
    //     layerNode.set(nodeInfo[i][0],layerNode.has(nodeInfo[i][0])?layerNode.get(nodeInfo[i][0])+1:1)
    //
    //     for (let j = 0; j < data_edge.length; j++) {
    //       if(data_node[i].parent_node===data_edge[j].src)
    //         nodeInfo[i][1]=(nodeInfo[i][1])?nodeInfo[i][1]+1:1;
    //     }
    //     if(nodeInfo[i][1]){
    //       if(node_tmp.has(nodeInfo[i][1])){
    //         nodeInfo[i][2]=nodeInfo[i-1][2]+1;
    //       }else {
    //         nodeInfo[i][2]=1
    //         node_tmp.set(nodeInfo[i][1],1)
    //       }
    //     }else
    //       nodeInfo[i][1]=nodeInfo[i][2]=1
    //
    //   }
    //   // nodeInfo[i][3] 前面樹的總和
    //   let sum=0
    //   // nodeInfo[i][3] 前面節點的總和
    //   let sum_node=0
    //
    //   for(let i = 0; i < data_node.length; i++) {
    //     // console.log(nodeInfo[i][1],"/",layerNode.get(nodeInfo[i][0]))
    //     // console.log(nodeInfo[i][1]/layerNode.get(nodeInfo[i][0]))
    //     // console.log(nodeInfo[i][2],"/",nodeInfo[i][1]+1)
    //     // console.log(nodeInfo[i][2]/(nodeInfo[i][1]+1))
    //     // console.log("---------------------------")
    //     // console.log((nodeInfo[i][1]/layerNode.get(nodeInfo[i][0]))*nodeInfo[i][2]/(nodeInfo[i][1]+1))
    //     // sum+=(nodeInfo[i][1]/layerNode.get(nodeInfo[i][0]))*nodeInfo[i][2]/(nodeInfo[i][1]+1)
    //     // console.log("==================")
    //     // // console.log("nodeInfo[i][0]+1/maxLayer+1 = ",nodeInfo[i][0]+1,"/",maxLayer+1)
    //     // // console.log(sum,(nodeInfo[i][0]+1)/(maxLayer+1))
    //     // // result.set(i,[sum,(nodeInfo[i][0]+1)/(maxLayer+1)])
    //     // console.log("sum =",sum)
    //     // result.set(i,[sum,(nodeInfo[i][0]+1)])
    //     // // console.log("==================")
    //     // // console.log("---------------------------")
    //     // // console.log("****************************")
    //     // // console.log("!layerNode.get(nodeInfo[i][0])-nodeInfo[i][1] = ",!(layerNode.get(nodeInfo[i][0]),nodeInfo[i][1]))
    //
    //     if(nodeInfo[i][2]===1){ //換樹
    //       sum=sum+sum_node
    //       sum_node=0
    //     }
    //
    //     if(!(layerNode.get(nodeInfo[i][0])-nodeInfo[i][1])){
    //       result.set(i,[(nodeInfo[i][1]/layerNode.get(nodeInfo[i][0]))*nodeInfo[i][2]/(nodeInfo[i][1]+1),(nodeInfo[i][0]+1)])
    //     }else if((nodeInfo[i][1]%2)===1){ //奇數
    //       console.log("sum = ",sum)
    //       min=sum
    //       max=sum+nodeInfo[i][1]/layerNode.get(nodeInfo[i][0]);
    //       let d= (max-min)/(nodeInfo[i][1]+1)
    //       // (nodeInfo[i][1]-1)/2
    //       console.log("1====================")
    //       console.log("(min,max) = ",min,max)
    //       console.log("1====================")
    //       result.set(i,[result.get(data_node[i-2].parent_node)[0]+(nodeInfo[i][2]-(nodeInfo[i][1]+1)/2)*d,(nodeInfo[i][0]+1)])
    //     }else if((nodeInfo[i][1]%2)===0){ //偶數
    //       console.log("sum = ",sum)
    //       min=sum
    //       max=sum+nodeInfo[i][1]/layerNode.get(nodeInfo[i][0]);
    //       let d= (max-min)/(nodeInfo[i][1]+1)
    //       // (nodeInfo[i][1]-1)/2
    //       console.log("2====================")
    //       console.log("(min,max) = ",min,max)
    //       console.log("2====================")
    //       result.set(i,[result.get(data_node[i-2].parent_node)[0]+(nodeInfo[i][2]-((nodeInfo[i][1])/2)-0.5)*d,(nodeInfo[i][0]+1)])
    //     }else
    //       return false
    //     sum_node+=(nodeInfo[i][1]/layerNode.get(nodeInfo[i][0]))*nodeInfo[i][2]/(nodeInfo[i][1]+1)
    //     if(!(layerNode.get(nodeInfo[i][0])-nodeInfo[i][1])){ //換層清空
    //       sum_node=0
    //       sum=0
    //     }
    //   }
    //
    //   // console.log(nodeInfo)
    //   // console.log(layerNode)
    //
    //   return result
    // }

    //  getNodeInfo(){
    //
    //   // nodeInfo 節點屬於第幾層
    //   let nodeInfo=new Array(data_node.length);
    //
    //   // layerNode{} 這層的節點數
    //   let layerNode=new Map();
    //
    //   // 總層數
    //   let maxLayer=0;
    //
    //   for(let i = 0; i < data_node.length; i++) {
    //     nodeInfo[i]=(data_node[i].parent_node)?nodeInfo[data_node[i].parent_node-1]+1:0;
    //     maxLayer=Math.max(maxLayer,nodeInfo[i])
    //     layerNode.set(nodeInfo[i],layerNode.has(nodeInfo[i])?layerNode.get(nodeInfo[i])+1:1)
    //   }
    //   // console.log(nodeInfo)
    //   // console.log(maxLayer)
    //   // console.log(layerNode)
    //   return [nodeInfo,layerNode,maxLayer+1]
    // },


    createDag() {

      const width = 2000, height = 800;

      this.initGraph('container', width, height);

      this.node_arr = new Array(this.data_node.length);


      // // nodeInfo 節點屬於第幾層
      // let nodeInfo = new Array(this.data_node.length);
      //
      // // layerNode{} 這層的節點數
      // let layerNode = new Map();
      //
      // // 總層數
      // let maxLayer = 0;
      //
      //
      // for (let i = 0; i < this.data_node.length; i++) {
      //   nodeInfo[i] = (this.data_node[i].parent_node) ? nodeInfo[this.data_node[i].parent_node - 1] + 1 : 0;
      //   maxLayer = Math.max(maxLayer, nodeInfo[i])
      //   layerNode.set(nodeInfo[i], layerNode.has(nodeInfo[i]) ? layerNode.get(nodeInfo[i]) + 1 : 1)
      // }

      // create node
      for (let i = 0; i < this.data_node.length; i++) {
        // console.log(1/(layerNode.get(nodeInfo[i])+1)*j)
        // x+width / (layerNode.get(nodeInfo[i]) + 1) * j, y + 150 * nodeInfo[i],
        this.node_arr[i] = this.member(this.rank_name[this.data_node[i].approverId], this.data_node[i].nodeName, this.user_pic_info[2], this.rank_color[this.data_node[i].approverId])
      }

      // create edge
      for (let i = 0; i < this.data_edge.length; i++) {
        this.link(this.node_arr[this.data_edge[i].startVertex - 1], this.node_arr[this.data_edge[i].endVertex - 1])
      }

      this.layout()

      // const x=500,y=50,x_dist=50,y_dist=150;


      //   // console.log(data_node[i].node_id.toString())
      //   console.log("i = ",i)
      //   console.log("父節點的node id",data_node[i].parent_node)
      //   // console.log("父節點的layer",layer[data_node[i].parent_node-1])
      //   if (data_node[i].parent_node !== 0)
      //     layer[i]=layer[data_node[i].parent_node-1]+1 //layer為父節點layer+1
      //   // x+layer_tmp[layer[i]][node_order]
      //   console.log("layer[i](層數) = ",layer[i])
      //   console.log("node_order(節點順序) = ",node_order)
      //   console.log("layer_tmp[layer[i]].length = ",layer_tmp[layer[i]].length)
      //   console.log("平分 = ",layer_tmp[layer[i]][node_order],"/",layer_tmp[layer[i]].reduce(function(a, b) { return a + b; }, 0))
      //   // this.node_arr[i] = member(graph,x+(100*(layer_tmp[layer[i]]/layer_tmp[layer[i]].reduce(function(a, b) { return a + b; }, 0)))+(100/layer_tmp[layer[i]].length), y+(y_dist)*layer[i], rank_name[data_node[i].rank], data_node[i].node_name, user_pic_info[data_node[i].gender], rank_color[data_node[i].rank])
      //   if (node_order<layer_tmp[layer[i]][tree_order])
      //       node_order++;
      //   else
      //     node_order=0
      //
      //   if (tree_order<layer_tmp[layer[i]].length-1)
      //     tree_order++;
      //   else
      //     tree_order=0
      // }


      //   for (let i = 0; i < layer_tmp.length; i++){
      //     console.log(layer_tmp[i])
      //     for (let j = 0; j < layer_tmp[j].length; j++){
      //       // console.log(j)
      //     }
      //   }
      // }


      // console.log(layer)


      // a.reduce(function(a, b) { return a + b; }, 0)

      // const bart = member(graph,x + dist * 20/((n[0]+1))*1, y, 'CEO', 'Bart Simpson', male, '#30d0c6')
      // const homer = member(
      //     graph,
      //     x + dist * 20/((n[1]+1))*1,
      //     y + dist * 3,
      //     'VP Marketing',
      //     'Homer Simpson',
      //     male,
      //     '#7c68fd',
      //     '#f1f1f1',
      // )
      // const marge = member(
      //     graph,
      //     x + dist * 20/((n[1]+1))*2,
      //     y + dist * 3,
      //     'VP Sales',
      //     'Marge Simpson',
      //     female,
      //     '#7c68fd',
      //     '#f1f1f1',
      // )
      // const lisa = member(
      //     graph,
      //     x + dist * 20/((n[1]+1))*3,
      //     y + dist * 3,
      //     'VP Production',
      //     'Lisa Simpson',
      //     female,
      //     '#7c68fd',
      //     '#f1f1f1',
      // )
      //
      // const lenny = member(graph,x + dist * 20/((n[2]+1))*1, y + dist * 6, 'Manager', 'Lenny Leonard', male, '#feb563')
      // const carl = member(graph,x + dist * 20/((n[2]+1))*2, y + dist * 6, 'Manager', 'Carl Carlson', male, '#feb563')
      // const maggie = member(graph,x + dist * 20/((n[2]+1))*3, y + dist * 6, 'Manager', 'Maggie Simpson', female, '#feb563')
      //
      // link(graph,bart, marge)
      // link(graph,bart, homer, [
      //   // { x: 385, y: 180 },
      //   // { x: 175, y: 180 },
      // ])
      // link(graph,bart, lisa, [
      //   // { x: 385, y: 180 },
      //   // { x: 585, y: 180 },
      // ])
      // link(graph,homer, lenny, )
      // link(graph,homer, carl, )
      // link(graph,marge, maggie, )

      this.graph.on('node:delete', ({view, e}) => {
        e.stopPropagation()
        // this.graph.freeze()
        view.cell.remove()
        this.layout()
      })
      this.graph.on('node:add', ({ e, node }) => {
        e.stopPropagation()
        // this.graph.freeze()
        // console.log(e, node.)
        this.addNodeForm.parent_node=node
        // this.addNodeForm.parent_node
        this.addNodeVisible = true;
        // e.stopPropagation()
        // const bg = Color.randomHex()
        // const member = createNode(
        //     'Employee',
        //     'New Employee',
        //     Math.random() < 0.5 ? male : female,
        //     bg,
        //     Color.invert(bg, true),
        // )
        // graph.freeze()
        // graph.addCell([member, createEdge(node, member)])
        // layout()
      })
    },


    // function getDagNode() {
    //   return {400, 350, 'Manager', 'Maggie Simpson', female, '#feb563'};
    // }
    //
    // function getDagEdge() {
    //   return 1;
    // }


    member(rank, name, image, background, textColor = '#000') {
      return this.graph.addNode({
        shape: 'MyShape',
        attrs: {
          body: {
            fill: background,
            stroke: 'none',
          },
          avatar: {
            opacity: 0.7,
            'xlink:href': image,
          },
          rank: {
            text: rank,
            fill: textColor,
            wordSpacing: '-5px',
            letterSpacing: 0,
          },
          name: {
            text: name,
            fill: textColor,
            fontSize: 13,
            fontFamily: 'Arial',
            letterSpacing: 0,
          },
        },
      })

      // updateInPorts(graph);
      // graph.addNode(
      //     new MyShape().resize(120, 40).position(200, 50).updateInPorts(graph),
      // )
    },

    // createEdge(source, target) {
    //   return this.graph.createEdge({
    //     shape: 'org-edge',
    //     source: { cell: source.id },
    //     target: { cell: target.id },
    //   })
    // },


    link(source, target, vertices) {
      return this.graph.addEdge({
        vertices,
        source: {cell: source},
        target: {cell: target},
        shape: 'org-edge',
      })
    },
  },

  async mounted() {
    // this.getData('1').then((res)=>{
    //   this.data_node=res.node.records
    //   this.data_edge=res.edge.records
    //   console.log("====================")
    //   console.log(this.data_node)
    //   console.log(this.data_edge)
    //   console.log("====================")
    //   this.createDag()
    // }).then();
    this.getData('1')
  },
}
</script>
