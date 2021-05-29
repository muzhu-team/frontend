<template>
  <div class="app-container">

    <data-grid url="/sysmgr/att/list" dataName="listQuery" ref="dataList" @dataRest="onDataRest">
      <template slot="form">
        <el-form-item label="名称">
          <el-input v-model="listQuery.originName" placeholder="文件名" class="filter-item"
                    @keyup.enter.native="handleFilter"/>
        </el-form-item>
        <el-form-item label="批次">
          <el-input v-model="listQuery.slotId" placeholder="批次" class="filter-item" @keyup.enter.native="handleFilter"/>
        </el-form-item>
      </template>
      <!--extendOperation-->
      <template slot="extendOperation">
        <el-form-item>
          <el-button class="filter-item" type="primary" size="mini" icon="el-icon-upload2" @click="showUploadForm()"
                     v-show="hasAuthority('sysmgr.att.upload')">上传
          </el-button>
        </el-form-item>
      </template>
      <!--body-->
      <template slot="body">
        <el-table-column type="index" width="50" align="center" :index="indexMethod" fixed="left"></el-table-column>
        <!-- <el-table-column align="center" prop="name" label="名称" ></el-table-column> -->
        <el-table-column prop="originName" label="源文件名" width="150" show-overflow-tooltip></el-table-column>
        <el-table-column align="center" prop="slotId" label="批次" width="150" show-overflow-tooltip></el-table-column>
        <!-- <el-table-column align="center" prop="fileCate" label="分类" ></el-table-column> -->
        <el-table-column align="center" prop="type" label="类型" show-overflow-tooltip></el-table-column>
        <el-table-column align="center" prop="fileSize" label="大小">
          <template slot-scope="scope">
            <span>{{ scope.row.fileSize | formatFileSize }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" prop="path" label="路径" show-overflow-tooltip></el-table-column>
        <el-table-column align="center" prop="description" label="描述"></el-table-column>
        <el-table-column label="创建时间">
          <template slot-scope="scope">
            <span>{{ scope.row.createdTime | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button type="danger" size="mini" icon="el-icon-delete" @click="dropRow(scope.row)" title="删除"
                       v-show="hasAuthority('sysmgr.att.delete')"></el-button>
          </template>
        </el-table-column>
      </template>
    </data-grid>

    <el-dialog title="上传文件" :visible.sync="uploadVisible">
      <el-row>
        <el-col :span="24">
          <el-upload
              class="upload-demo"
              ref="upload"
              drag
              :action="uploadAction"
              :accept="acceptFileType"
              :limit="1"
              :headers="importHeaders"
              :data="fileUploadParam"
              :http-request="CosUpload"
              :on-exceed="handleExceed"
              :before-upload="beforeUpload"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              :on-progress="handleProgress"
              :on-change="handleChange"
              :on-success="handleSuccess"
              :on-error="handleError"
              :file-list="fileList"
              :auto-upload="false">
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <el-progress :percentage="percent"></el-progress>
            <div class="el-upload__tip" slot="tip">只能上传apk文件，且不超过1GB</div>
          </el-upload>
        </el-col>
      </el-row>
      <span slot="footer" class="dialog-footer">
        <el-button @click="uploadVisible=false" size="small">取消</el-button>
        <el-button @click="submitUpload" type="primary" :loading="uploadLoading" size="small"> 确定上传</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {getList, drop} from "@/api/sysmgr/att";
import DataGrid from "@/components/DataGrid";
import {parseTime, formatFileSize} from '@/utils';
import waves from "@/directive/waves"; // Waves directive
import COS from 'cos-js-sdk-v5'
import { getToken } from '@/utils/auth'
import SparkMD5 from "spark-md5";
import {
  Message,
} from 'element-ui'
import axios from "axios";
import {cosConfig} from '@/utils/cosRequest'

export default {
  name: "sysmgratt",
  components: {DataGrid},
  directives: {waves},
  filters: {
    parseTime,
    formatFileSize
  },
  data() {
    return {
      tableKey: 0,
      total: 0,
      list: null,
      listLoading: true,
      listQuery: {
        pageNo: 1,
        limit: 10,
        id: null,
        originName: null,
        slotId: null
      },
      percent:0,
      importHeaders: {Authorization: getToken()},
      fileList: [],
      uploadAction: process.env.VUE_APP_BASE_API + "/sysmgr/att/upload",
      CosTokenApi: process.env.VUE_APP_BASE_API + "/sysmgr/cos/uploadApk",
      uploadVisible: false,
      uploadLoading: false,
      // acceptFileType: ".apk,.APK",
      acceptFileType:".apk,.APK,.jpg,.jpeg,.png,.gif,.bmp,.pdf,.JPG,.JPEG,.PBG,.GIF,.BMP,.PDF,.ZIP,.RAR",
      downLoadLoading: '',
      fileUploadParam: {
        sourceDir: "temp"
      },
    };
  },
  methods: {

    CosUpload(CosTokenApi,file,pathKey,callback) {
      const config = {
        headers: {Authorization: getToken()},
      }
      axios.post(CosTokenApi, "",config)
          .then((res) => { // 后台接口返回 密钥相关信息
            var key = JSON.parse(res.data.data);
            var cos = new COS({
              getAuthorization: (options, callback)=> {
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

            // 大於20MB使用分片上傳
            // 超過1GB回傳錯誤
            if (file.size < 20971520) {
              this.uploadFile(cos,file,pathKey,res => callback(res))
            }else if(file.size < 1048576000){
              this.uploadFileSlice(cos,file,pathKey, res => callback(res))
            }else{
              callback("Error");
            }
          })
    },
    uploadFile(cos, file, pathKey, callback) {
      cos.putObject(
          {
            Bucket: cosConfig.Bucket, // 存储桶名称
            Region: cosConfig.Region, // 地区
            Key: "/"+pathKey+"/"+file.name, // 图片名称
            StorageClass: 'STANDARD',
            Body: file, // 上传文件对象
            onHashProgress:  (progressData)=> {
              console.log ('校验中', JSON.stringify (progressData));
            },
            onProgress:  (progressData) =>{
              console.log ('上传中', JSON.stringify (progressData));
            },
          },
          this.getLocation()
      )
    },
    getLocation (err, data) {
      if (err) {
        Message({message:'文件上传失败,请重新上传',type: 'error',})
      } else {
        let fileUrl = 'http://' + data.Location
        this.callback(fileUrl)
      }
    },
    uploadFileSlice(cos, file, pathKey, callback) {
      // 得到md5码
      this.getFileMD5(file, md5 => {
        // 存储文件的md5码
        file.md5 = md5
        const subfix = file.name.substr(file.name.lastIndexOf('.'))
        let key = file.md5 + subfix;
        cos.sliceUploadFile({
          Bucket: cosConfig.Bucket, // 存储桶名称
          Region: cosConfig.Region, // 地区
          Key: "/"+pathKey+"/"+file.name,
          Body: file,
          onProgress:  (progressData) =>{
            this.percent = progressData.percent * 100 || 0
          },
        }, (err, data) =>{
          if (err) {
            callback(err)
          } else {
            data.fid = this.getObjectUrl(cos,key,pathKey)
            callback(null, data)
          }
        })
      })
    },
    getObjectUrl(cos,key,pathKey) {
      const url = cos.getObjectUrl({
        Bucket: cosConfig.Bucket, // 存储桶名称
        Region: cosConfig.Region, // 地区
        Key: "/"+pathKey+"/"+key,
        Sign: false
      })
      // 腾讯云的地址替换为域名地址
      const p = `${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com`
      return url.replace(p, cosConfig.Domain)
    },
    getFileMD5(file, callback) {
      // 声明必要的变量
      const fileReader = new FileReader()
      // 文件每块分割10M，计算分割详情
      const chunkSize = 10 * 1024 * 1024;
      const chunks = Math.ceil(file.size / chunkSize)
      let currentChunk = 0

      // 创建md5对象（基于SparkMD5）
      const spark = new SparkMD5()

      // 每块文件读取完毕之后的处理
      fileReader.onload = function(e) {
        // 每块交由sparkMD5进行计算
        spark.appendBinary(e.target.result)
        currentChunk++

        // 文件处理完成计算MD5，如果还有分片继续处理
        if (currentChunk < chunks) {
          loadNext()
        } else {
          this.callback(spark.end())
        }
      }

      // 处理单片文件的上传
      function loadNext() {
        const start = currentChunk * chunkSize
        const end = start + chunkSize >= file.size ? file.size : start + chunkSize

        fileReader.readAsBinaryString(file.slice(start, end))
      }

      loadNext()
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
      this.$confirm('您确定要删除该数据吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let params = {};
        if (row.id) {
          params.id = row.id;
          drop(params).then((res) => {
            this.$refs.dataList.fetchData();
          });
        }
      }).catch(() => {
      });
    },
    showUploadForm() {
      this.uploadVisible = true;
    },
    handleExceed(files, fileList) {
      this.$message.warning('只能选择1个文件!');
    },
    handleRemove(file, fileList) {
      //console.log(file,fileList);
    },
    handlePreview(file) {
      //console.log(file);
    },
    beforeUpload(file) {
      if (file.size > 1048576000) {
        this.$message({
          type: 'error',
          showClose: true,
          duration: 3000,
          message: '文件大于1G!'
        });
        return false;
      }else{
        this.CosUpload(this.CosTokenApi,file,"apk",(res) => {
        })
        return true;
      }
    },
    handleProgress(event, file, fileList) {
      this.downloadLoading = this.$loading({
        lock: true,
        text: '数据导入中...',
        spinner: 'el-icon-loading',
        background: 'rgba(0,0,0,0.7)'
      });
    },
    handleChange(file, fileList) {
      if (this.downloadLoading) {
        this.downloadLoading.close();
        this.uploadLoading = false;
      }
    },
    submitUpload(){
      // this.uploadLoading=true;
      var that=this;
      // setTimeout(function () {
      if(that.$refs.upload.$children[0].fileList.length==1){
        that.$refs.upload.submit();
      }else{
        that.uploadLoading=false;
        that.$message({
          type:'error',
          showClose:true,
          duration:3000,
          message:'请选择文件!'
        });
      }
      // },100);
    },

    handleSuccess(response) {
      if (response.result) {
        this.$message.success("上传成功");
        this.uploadVisible = false;
        this.$refs.dataList.fetchData();
      } else {
        this.$message({
          type: 'error',
          showClose: true,
          duration: 60000,
          message: response.message
        });
      }
    },
    handleError(err) {
      this.$message({
        type: 'error',
        showClose: true,
        duration: 60000,
        message: '请求失败! error:' + err
      });
    }
  },
  mounted() {
    // eslint-disable-next-line no-console

  }
};
</script>
