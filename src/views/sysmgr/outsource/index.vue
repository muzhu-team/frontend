<template>
  <div class="app-container">

    <data-grid url="/sysmgr/outsource/list" dataName="listQuery" ref="dataList" @dataRest="onDataRest" :searchHandlerVisibleSet="true" >
      <template slot="form">
        <el-form-item label="名称">
          <el-input v-model="listQuery.name" placeholder="名称" class="filter-item" @keyup.enter.native="handleFilter" />
        </el-form-item>
      </template>
      <!--extendOperation-->
      <template slot="extendOperation">
        <el-form-item>
          <el-button class="filter-item" type="primary" size="mini" icon="el-icon-edit" @click="modify()" v-show="hasAuthority('sysmgr.outsource.save')">新增</el-button>
        </el-form-item>
      </template>
      <!--body-->
      <template slot="body">
        <el-table-column type="index" width="50" align="center" :index="indexMethod" fixed="left"></el-table-column>
        <el-table-column align="left" prop="name" label="名称" ></el-table-column>
        <el-table-column align="left" prop="content" label="描述" ></el-table-column>
        <el-table-column align="center" prop="modifiedTime" label="编辑时间">
          <template slot-scope="scope">{{ scope.row.modifiedTime | parseTime('{y}-{m}-{d} {h}:{i}') }}</template>
        </el-table-column>
        <el-table-column align="center" prop="createdTime" label="创建时间">
          <template slot-scope="scope">{{ scope.row.createdTime | parseTime('{y}-{m}-{d} {h}:{i}') }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" icon="el-icon-edit" @click="modify(scope.row)" title="编辑" v-show="hasAuthority('sysmgr.outsource.save')"></el-button>
            <el-button type="danger" size="mini" icon="el-icon-delete" @click="dropRow(scope.row)" title="删除" v-show="hasAuthority('sysmgr.outsource.delete')"></el-button>
          </template>
        </el-table-column>
      </template>
    </data-grid>
    <el-dialog title="外协信息" :visible.sync="modifyVisible" :before-close="handleClose">
      <el-form :model="outsourceForm" :rules="rules" ref="outsourceForm" label-width="70px" label-position="right" size="small" style="width: 400px; margin-left:50px;">
        <el-form-item label="名称" prop="name">
          <el-input v-model="outsourceForm.name" class="filter-item" placeholder="输入外协公司名称" ></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="content">
          <el-input v-model="outsourceForm.content" class="filter-item" placeholder="输入外协描述" ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="reset" size="small" >取 消</el-button>
        <el-button type="primary" @click="submitForm" size="small" v-show="hasAuthority('sysmgr.outsource.save')">确 定</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import {saveOutsource, dropOutsource} from "@/api/sysmgr/outsource";
import { parseTime } from '@/utils'
import DataGrid from "@/components/DataGrid";
import waves from "@/directive/waves"; // Waves directive
export default {
  name: "sysmgroutsource",
  components: { DataGrid },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: "success",
        draft: "gray",
        deleted: "danger"
      };
      return statusMap[status];
    }
  },
  data() {
    return {
      total: 0,
      list: null,
      listLoading: true,
      listQuery: {
        pageNo: 1,
        limit: 10,
        name:null
      },
      modifyVisible:false,
      outsourceForm:{
        id:"",
        name:"",
        content:""
      },
      rules: {
        name: [{ required: true, message: '名称是必填项', trigger: 'blur' }]
      },

      currentAuthoutsourceId:null,
      dataNodes:[],
      defaultSelected:[],
      authTreeLoading:false
    };
  },
  filters:{
    parseTime
  },
  methods: {
    handleClose(done) {
      this.$confirm('确认关闭？')
          .then(_ => {
            this.reset();
            done();
          })
          .catch(_ => {});
    },
    indexMethod(index) {
      return index + ((this.listQuery.pageNo-1) * this.listQuery.limit) + 1;
    },
    onDataRest(){
      this.listQuery = {}
    },
    handleFilter() {
      this.$refs.dataList.fetchData();
    },
    modify(outsource){
      this.modifyVisible=true
      if(outsource){
        this.outsourceForm.id=outsource.id;
        this.outsourceForm.name=outsource.name;
        this.outsourceForm.content=outsource.content;
      }
    },
    reset(){
      this.modifyVisible=false;
      this.outsourceForm={};
    },
    submitForm() {// 保存
      this.$refs["outsourceForm"].validate((valid) => {
        if (valid) {
          let para = this.outsourceForm;
          console.log(para);
          saveOutsource(para).then((res) => {
            this.modifyVisible = false
            this.$refs.dataList.fetchData();
          });
        } else {
          return false;
        }
      });
    },
    dropRow(row){
      this.$confirm('您确定要删除该数据吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let params={};
        if(row.id){
          params.id= row.id;
          dropOutsource(params).then((res) => {
            this.$refs.dataList.fetchData();
          });
        }
      }).catch(() => {
      });
    },
  },
};
</script>
