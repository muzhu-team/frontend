<template>
  <div class="app-container">
    <data-grid :url="url" dataName="listQuery" ref="dataList" @dataRest="onDataRest" @handleRowClick="handleRowClick" :searchHandlerVisibleSet="searchHandlerVisibleSet" :pageSizes="pageSizes">
      <template slot="form">
        <el-form-item label="名称">
          <el-input v-model="listQuery.originName" placeholder="文件名" class="filter-item"
                    @keyup.enter.native="handleFilter"/>
        </el-form-item>
      </template>
      <!--extendOperation-->
      <template slot="extendOperation">
        <el-form-item>
          <el-button class="filter-item" type="primary" size="mini" icon="el-icon-upload2" @click="createFolder()"
                     v-show="hasAuthority('sysmgr.att.upload')">创建文件夹
          </el-button>
          <el-button class="filter-item" type="primary" size="mini" icon="el-icon-upload2" @click="showUploadForm()"
                     v-show="hasAuthority('sysmgr.att.upload')">上传文件
          </el-button>
        </el-form-item>
      </template>
      <!--body-->
      <template slot="body">
        <el-table-column prop="cosKey" label="文件夹名称" width="500" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.cosKey.split("/")[3] || ""}}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间">
          <template slot-scope="scope">
            <span>{{ scope.row.createdTime | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button type="danger" size="mini" icon="el-icon-delete" @click.stop="dropRow(scope.row)" title="删除"
                       v-show="hasAuthority('sysmgr.att.delete')"></el-button>
          </template>
        </el-table-column>
      </template>
    </data-grid>

    <el-dialog title="上传文件" :visible.sync="uploadVisible">
      <el-row>
        <el-form :model="ruleForm" status-icon :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
          <el-form-item label="名称" prop="name">
            <el-input v-model="ruleForm.name" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="版本号" prop="version">
            <el-input-number v-model="ruleForm.version" :precision="2" :step="0.01" :max="1000" :min="0"></el-input-number>
          </el-form-item>
          <el-form-item label="上传文件夹" prop="cosKey">
            <el-select v-model="ruleForm.cosKey" placeholder="请选择">
              <el-option
                  v-for="(item,index) in options"
                  :key="index"
                  :label="item"
                  :value="item">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="备注(选填)" prop="remarks">
            <el-input v-model="ruleForm.remarks"></el-input>
          </el-form-item>
        </el-form>
        <el-col>
          <el-upload
              class="upload"
              ref="upload"
              drag
              action="#"
              :accept="acceptFileType"
              :limit="1"
              :headers="importHeaders"
              :data="fileUploadParam"
              :http-request="cosUpload"
              :on-progress="handleProgress"
              :on-error="handleError"
              :file-list="fileList"
              :auto-upload='false'>
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">只能上传apk文件，且不超过1GB</div>
          </el-upload>
        </el-col>
      </el-row>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog" size="small">取消</el-button>
        <el-button @click="resetForm" size="small">重置</el-button>
        <el-button @click="submitUpload" type="primary" :loading="uploadLoading" size="small">确定</el-button>
      </span>
    </el-dialog>
    <el-dialog
        :show-close="false"
        title="上传进度"
        :visible.sync="uploadPercent"
        width="30%"
        :close-on-click-modal="false"
    >
      <el-progress :percentage="percent"></el-progress>
    </el-dialog>
    <el-dialog
        title="创建文件夹"
        :visible.sync="isUploadFolder"
        width="30%"
        :before-close="handleFolderClose"
    >
      <el-row>
        <el-form :model="uploadFolderForm" status-icon :rules="folderRules" ref="folderRules" label-width="100px" class="demo-ruleForm">
          <el-form-item label="名称" prop="name">
            <el-input v-model="uploadFolderForm.name" autocomplete="off"></el-input>
          </el-form-item>
        </el-form>
      </el-row>
      <span slot="footer" class="dialog-footer">
        <el-button @click="handleFolderClose" size="small">取消</el-button>
        <el-button @click="submitUploadFolder" type="primary"  size="small">确定</el-button>
      </span>
    </el-dialog>
    <div class="tabBar"  v-if="isShowTabBar">
      <el-row class="TabBarRow">
        <el-col :span="22">
          <div class="TabBarTitle">
            {{ tabBarTitle || '' }}
          </div>
        </el-col>
        <el-col :span="2">
            <el-image class="TabBarCloseBtn" :src="require('@/icons/png/close.png')"  fit="fill" style="height:30px;width:30px" @click="closeSec"></el-image>
        </el-col>
      </el-row>

<!--      <div v-if="isShowTabBar" class="tabBar">-->
<!--        <img class="sec" v-if="isShowTabBar" src="@/icons/png/close.png"  @click="closeSec"/>-->
        <data-grid :url="url" dataName="secListQuery" ref="secdataList" @dataRest="onDataRest" @handleRowClick="handleRowClick" v-if="forceRefresh" :pageSizes="pageSizes">
          <template slot="body">
            <!--        <el-table-column type="cosKey" label="存储位置" width="50" align="center" :index="indexMethod" fixed="left"></el-table-column>-->
            <!-- <el-table-column align="center" prop="name" label="名称" ></el-table-column> -->
            <el-table-column prop="cosKey" label="名称" width="150" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.name || ""}}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="cosFolder" label="所属文件夹" width="150" show-overflow-tooltip></el-table-column>
            <el-table-column align="center" prop="cosSize" label="大小">
              <template slot-scope="scope">
                <span class="detail">{{ Math.floor(scope.row.cosSize / 1024 / 1024) || 0  }}MB</span>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="detail" label="版本号" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{  scope.row.version || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="detail" label="描述"  width='200'
                             :show-overflow-tooltip='true'>
              <template slot-scope="scope">
                <span>{{ decodeURIComponent(scope.row.detail) || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间">
              <template slot-scope="scope">
                <span>{{ scope.row.createdTime | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
              <template slot-scope="scope">
                <el-button type="danger" size="mini" icon="el-icon-download" @click.stop="downLoadRow(scope.row)" title="下载"
                ></el-button>
                <el-button type="danger" size="mini" icon="el-icon-delete" @click.stop="dropRow(scope.row)" title="删除"
                ></el-button>
              </template>
            </el-table-column>
          </template>
        </data-grid>
      </div>
    </div>


</template>

<script>
import {getUploadToken} from "@/api/cos/cosupload";
import { getRequest } from '@/api/axiosCommom';
import DataGrid from "@/components/DataGrid";
import {parseTime, formatFileSize} from '@/utils';
import waves from "@/directive/waves";
import COS from 'cos-js-sdk-v5'
import {getToken} from '@/utils/auth'
import SparkMD5 from "spark-md5";
import {
  Message,
} from 'element-ui'
import {cosConfig} from '@/utils/cosRequest'
import {download} from '@/utils/index'
export default {
  name: "cosupload",
  components: {DataGrid},
  directives: {waves},
  filters: {
    parseTime,
    formatFileSize
  },
  data() {
    return {
      url:'/cos/list', //请求地址
      searchHandlerVisibleSet:true,  //去掉二级列表的搜索
      options:[],//上传选择文件夹下拉选择的数据
      isShowTabBar:false,  //tabbar
      tabBarTitle:'',
      forceRefresh:false,  //刷新子组件
      isUploadFolder:false,
      uploadPercent: false,
      list: null,
      listLoading: true,
      listQuery: {
        pageNo: 1,
        limit: 10,
        searchStatus:1
      },
      pageSizes:[10,20,30],
      secListQuery:{
        pageNo: 1,
        limit: 10,
        searchStatus:0,    //代表文件搜索
        folderKey:''
      },
      percent: 0,
      importHeaders: {Authorization: getToken()},
      fileList: [],
      uploadVisible: false,
      uploadLoading: false,
      acceptFileType: ".apk,.jpg",
      downLoadLoading: '',
      pathKey: 'apk',  //文件夹
      fileUploadParam: {
        sourceDir: "temp"
      },
      uploadFolderForm:{
        name:''
      },
      ruleForm: {
        name: '',
        version: 0.01,
        remarks: '',
        cosKey:''
      },
      folderRules: {
        name: [
          { required: true, message: '请输入文件名称', trigger: 'blur' },
          { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' }
        ],
      },
      rules: {
        name: [
          { required: true, message: '请输入文件夹名称', trigger: 'blur' },
          { min: 1, max: 10, message: '长度在 1 到 10 个字符', trigger: 'blur' }
        ],
        version: [
            { required: true, message: '请输入版本号', trigger: 'integer' },
        ],
        remarks: [
          {max: 30, message: '长度最多30个字符',trigger: 'blur'}
        ],
        cosKey: [
          { required: true, message: '请选择上传的文件夹',trigger: 'change' },
          { min: 1,max: 10, message: '长度最多10个字符',trigger: 'blur'   }
        ]
      }
    };

  },
  methods: {
    closeDialog(){
      this.uploadVisible=false;
      this.resetForm()
    },
    downLoadRow(row){
      if(row.url){
        download(row.url)
      }
    },
    //关闭二级列表
    closeSec(){
      this.isShowTabBar = false
    },
    handleRowClick(row, column, event){
      if(row.isFolder == 1) {
        this.forceRefresh = false
      }else {
        this.forceRefresh = true
      }
      this.secListQuery.folderKey = row.cosKey.split("/")[3] || null
      this.tabBarTitle = this.secListQuery.folderKey
      this.isShowTabBar = true
      this.searchHandlerVisibleSet = false
      //判断是文件夹的时候,强制刷新子组件 重新加载二级列表
      this.$nextTick(() => {
        this.forceRefresh = true
      })
    },
    //创建文件夹
    submitUploadFolder(){
      const that= this
      let file = {
        file:{
          size:0
        }
      }
        that.$refs['folderRules'].validate((valid) => {
          if (valid) {
            that.cosUpload(file)
            setTimeout(()=>{
              console.log("刷新啦")
              this.refresh()
              that.handleFolderClose()
            },3000)
            return true;
          }
        });
    },
    handleFolderClose(){
      this.isUploadFolder=false;
      this.$refs['folderRules'].resetFields();
    },
    createFolder(){
      this.isUploadFolder = true;
    },
    //获取上传权限token，默认60s
    cosUpload(file,key) {
      getUploadToken("").then((res) => {
        if (res.result && res.data) {
          let key = JSON.parse(res.data);
          let cos = this.initCos(key);
          let f = file.file

          if ( 0 < f.size  && f.size< 20971520) {
            //TODO 上传普通图片
            this.uploadFile(cos, file)
          } else if (20971520 < f.size  && f.size< 1048576000) {
            //分片上传
            this.uploadFileSlice(cos, file, this.pathKey)
          }else if(f.size === 0){
            //上传文件夹
            this.uploadFolder(cos)
          }
        } else {
          Message.error("获取上传凭证错误")
        }
      });
    },
    initCos(key) {
      return new COS({
        getAuthorization: (options, callback) => {
          callback({
            TmpSecretId: key.credentials.tmpSecretId,
            TmpSecretKey: key.credentials.tmpSecretKey,
            XCosSecurityToken: key.credentials.sessionToken,
            StartTime: key.startTime,
            ExpiredTime: key.expiredTime,
            expiration: key.expiration,
            requestId: key.requestId
          })
        }
      })
    },
    uploadFolder(cos){
      const that = this
      cos.putObject({
        Bucket: cosConfig.Bucket, // 存储桶名称
        Region: cosConfig.Region, // 地区
        Key: `${that.uploadFolderForm.name}/`,
        Body: '',
      },function(err, data) {
        that.handleFolderClose()
          if(data.statusCode === 200){
            Message.success("创建成功")
          }
          if(err){
            Message.error(err)
          }
        }
      )
    },
    //冲刷一级列表数据
    refresh() {
      this.$refs.dataList.onSubmit()
    },
    uploadFile(cos, file, pathKey) {
      cos.putObject({
            Bucket: cosConfig.Bucket, // 存储桶名称
            Region: cosConfig.Region, // 地区
            Key: "/" + pathKey + "/" + file.name, // 图片名称
            StorageClass: 'STANDARD',
            Body: file, // 上传文件对象
            onProgress: (progressData) => {
              this.percent =  Math.floor(progressData.percent * 100) || 0
            },
          },
          this.getLocation()
      )
    },
    getLocation(err, data) {
      if (err) {
        Message({message: '文件上传失败,请重新上传', type: 'error'})
      } else {
        return 'http://' + data.Location
      }
    },
    uploadFileSlice(cos, file, pathKey) {
      // 得到md5码
      this.getFileMD5(file, cos, pathKey)
    },
    uploadSliceFile(file, cos, pathKey, md5) {
      const that = this;
      // 存储文件的md5码
      file.md5 = md5
      let subfix = file.name.substr(file.name.lastIndexOf('.'))
      let key = file.md5 + subfix;
      const str = that.ruleForm.remarks
      const s1 = encodeURIComponent(str)
      // file没有setter只能重新构造
      const name = `${that.ruleForm.name}-${that.ruleForm.version}.${file.name.split(".")[1]}`
      console.log(name,"name")
      const copyFile = new File([file], name)
      cos.sliceUploadFile({
        Bucket: cosConfig.Bucket, // 存储桶名称
        Region: cosConfig.Region, // 地区
        Key: "/" + that.ruleForm.cosKey + "/" + copyFile.name,
        Body: copyFile,
        'x-cos-meta-detail': s1,
        onProgress: (progressData) => {
          that.percent = Math.floor(progressData.percent * 100) || 0

          //节流

        },
      }, (err, data) => {
        if (err) {
          Message.error("上传错误");
        }else{
          console.log("上传成功")
          setTimeout(() =>{
              that.forceRefresh = false
              that.uploadPercent = false;
              that.percent = 0;
              that.uploadLoading = false;
              that.resetForm();
              Message.success("上传成功")
              //刷新二级列表
              that.$nextTick(() => {
                that.forceRefresh = true
              })
          },3000)
        }
          //替换上传域名
          //data.fid = that.getObjectUrl(cos, key, pathKey)
      })
    },
    getObjectUrl(cos, key, pathKey) {
      const url = cos.getObjectUrl({
        Bucket: cosConfig.Bucket, // 存储桶名称
        Region: cosConfig.Region, // 地区
        Key: "/" + pathKey + "/" + key,
        Sign: false
      })
      // 腾讯云的地址替换为域名地址
      const p = `${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com`
      return url.replace(p, cosConfig.Domain)
    },
    getFileMD5(file, cos, pathKey) {
      const target = file.file
      const readerCopy = new FileReader();
      // 文件每块分割10M，计算分割详情
      const chunkSize = 10 * 1024 * 1024;
      const chunks = Math.ceil(file.size / chunkSize)
      let currentChunk = 0
      // 创建md5对象（基于SparkMD5）
      const spark = new SparkMD5()
      const reader = new FileReader();
      reader.onload = (event) => {
        // 文件里的文本会在这里被打印出来
        spark.appendBinary(event.target.result)
        currentChunk++
        // 文件处理完成计算MD5，如果还有分片继续处理
        if (currentChunk < chunks) {
          this.loadNext(currentChunk, chunkSize, target, readerCopy)
        } else {
          const md5 = spark.end()
          this.uploadSliceFile(target, cos, pathKey, md5)
        }
        this.loadNext(currentChunk, chunkSize, target, readerCopy)
      };
      reader.onerror = () => {
        Message.error("读取文件错误")
      }
      //触发onload事件
      reader.readAsText(target);
    },
    loadNext(currentChunk, chunkSize, file, fileReader) {
      console.log("运行了多少次")
      const start = currentChunk * chunkSize
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize
      fileReader.readAsBinaryString(file.slice(start, end))
    },
    indexMethod(index) {
      return index + ((this.listQuery.pageNo - 1) * this.listQuery.limit) + 1;
    },
    onDataRest() {
      this.listQuery = {}
    },
    handleFilter() {
      this.$refs.dataList.fetchData();
    },
    dropRow(row) {
      console.log(row,"row")
      const that = this
      // 删除文件夹
      if(row.isFolder == 1){
        that.$confirm('您确定要删除该数据吗?删除文件夹会删除所有下级文件', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const that = this
          getUploadToken("").then((res) => {
            if (res.result && res.data) {
              let key = JSON.parse(res.data);
              let cos = that.initCos(key);
              //文件夹名
              let params = `${row.cosKey.split("/")[3]}`
              that.getListFromFolder(params,cos)
              setTimeout(() =>{
                that.refresh()
                that.isShowTabBar = false
              },3000)
            } else {
              Message.error(res.message);
            }
          })
        })
      }else{
        that.$confirm('您确定要删除该数据吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const that = this
          getUploadToken("").then((res) => {
            if (res.result && res.data) {
              let key = JSON.parse(res.data);
              let cos = that.initCos(key);
              //单独删除一个文件，数组只有一个
              const str = `${row.cosKey.split("/").slice(-2).join("/")}`
              let params = [{Key:str}]
              that.deleteTarget(cos,params)
              that.forceRefresh = false
              setTimeout(() =>{
                that.$nextTick(() => {
                  that.forceRefresh = true
                })
              },3000)
            } else {
              Message.error(res.message);
            }
          })
        });
      }
    },
    //获取文件夹下的所有文件
    getListFromFolder(params,cos){
        const that = this
        let listQuery = {
            pageNo: 1,
            limit: 1000,
            searchStatus:0,
            folderKey:params
        }
         getRequest(that.url, listQuery).then(response => {
           console.log(response,"response")
          if(response.result){
            //转换文件夹数组
            let arr = response.data.records.map((item)=>{
              return item.cosKey = {Key:`${item.cosKey.split("/").slice(-2).join("/")}`}
            })
            //数组添加删除的文件夹
              let folder = { Key : `${params}/` }
              arr.push(folder)
              //删除
              that.deleteTarget(cos,arr)
          }else{
            Message.error("获取文件夹失败")
          }
        })
    },
    //删除文件以及文件夹
    deleteTarget(cos,params){
      cos.deleteMultipleObject({
        Bucket: cosConfig.Bucket, // 存储桶名称
        Region: cosConfig.Region, // 地区
        Objects: params
      }, function(err, data) {
        if(err){
          Message.error("删除错误")
        }else{
          Message.success("删除成功")
        }
      });
    },
    showUploadForm() {
      const that = this
      that.uploadVisible = true;
      //拉取所有文件夹的数据,查询所有文件夹
      const listQuery =  {
            pageNo: 1,
            limit: 10000,
            searchStatus:1
          }
      that.getFolder(listQuery)
    },
    getFolder(listQuery){
      const that = this
      getRequest(that.url, listQuery).then(response => {
        if(response.result){
          //转换文件夹数组
          const arr = response.data.records.map((item)=>{
            return item.cosKey = item.cosKey.split("/")[3]
          })
          that.options = arr;
          console.log(that.options,"that.options")
        }else{
          Message.error("获取文件夹失败")
        }
      })
    },
    beforeUpload(file) {
      // const that = this;
      // console.log(that.ruleForm,"表单")
      //
      //   that.$refs['ruleForm'].validate((valid) => {
      //     if (valid) {
      //       console.log(valid, "valid")
      //       // that.$refs.upload.submit();
      //       that.CosUpload(file)
      //       return true;
      //     }
      //   });
    },
    handleProgress() {
      this.downloadLoading = this.$loading({
        lock: true,
        text: '数据导入中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0,0,0,0.7)'
      });
    },
    submitUpload() {
      let that = this;
      if (that.$refs.upload.$children[0].fileList.length != 1) {
        that.uploadLoading = false;
        Message.error('请选择文件!');
      } else {
        that.$refs['ruleForm'].validate((valid) => {
          if (valid) {
            that.$refs.upload.submit();
            that.uploadVisible = false;
            that.uploadLoading = true;
            that.uploadPercent = true;
          }
        });
      }
    },
    handleError(err) {
      Message({
        type: 'error',
        showClose: 'true',
        duration: 60000,
        message: '请求失败! error:' + err
      });
    },
    resetForm() {
      this.$refs['ruleForm'].resetFields();
      this.$refs.upload.clearFiles();
    }
  },
  computed:{
  },

  mounted() {
  }
};
</script>
<style lang='scss' scoped>

  .tabBar{
    position:absolute;
    bottom:0;
    min-height:100px;
    border-radius: 5px;
    width:98%;
    max-height:250px;
    overflow: hidden;
    overflow-y:scroll;
    scroll-behavior: smooth;
    background-color: white;
    .sec{
      z-index:999;
      width:40px;
      height:40px;
      position:absolute;
      top:-5px;
      right:-5px;
    }
  }
  .upload{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .detail{
    overflow: hidden;
    text-overflow:ellipsis;
    white-space: nowrap;
  }

  .TabBarRow{
    color: white;
    border-radius: 5px;
    background: rgb(83,128,166);
    .TabBarTitle{
      font-weight:bold;
      font-family: sans-serif;
      text-align: center;
      font-size: 20px;
      line-height:40px;
    }
    .TabBarCloseBtn{
      float:right;
      overflow: hidden;
      height:30px;
      width:48px;
    }
    .TabBarCloseImg{
      margin-left: -32px;
      margin-top: -24px;
    }
  }
</style>

