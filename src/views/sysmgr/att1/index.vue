<script src="../../../api/sysmgr/att1.js"></script>
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
<!--        <el-input v-model="uploadInfo.name" placeholder="名称"></el-input>-->
<!--        <el-input v-model="uploadInfo.version" placeholder="版本号"></el-input>-->
<!--        <el-input-->
<!--            type="textarea"-->
<!--            autosize-->
<!--            placeholder="备注(选填)"-->
<!--            v-model="uploadInfo.remarks">-->
<!--        </el-input>-->
<!--        <el-form :label-position="right" label-width="80px" :model="formLabelAlign">-->
        <el-form :model="uploadInfo" :rules="uploadFormRules" ref="uploadInfo" :label-position="labelPosition" label-width="80px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="uploadInfo.name"></el-input>
          </el-form-item>
          <el-form-item label="版本号" prop="version">
            <el-input v-model="uploadInfo.version"></el-input>
          </el-form-item>
          <el-form-item label="备注(选填)" prop="remarks">
            <el-input v-model="uploadInfo.remarks"></el-input>
          </el-form-item>
        </el-form>
        <el-col :span="24">
          <el-upload
              class="upload-demo"
              ref="upload"
              drag
              action="#"
              :accept="acceptFileType"
              :limit="1"
              :headers="importHeaders"
              :data="fileUploadParam"
              :http-request="CosUpload"
              :on-exceed="handleExceed"
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              :on-progress="handleProgress"
              :on-change="handleChange"
              :on-success="handleSuccess"
              :on-error="handleError"
              :file-list="fileList"
              :auto-upload=false>
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <el-progress :percentage="percent"></el-progress>
            <div class="el-upload__tip" slot="tip">只能上传apk文件，且不超过1GB</div>
          </el-upload>
        </el-col>
      </el-row>
      <span slot="footer" class="dialog-footer">
        <el-button @click="uploadVisible=false;resetUploadForm()" size="small">取消</el-button>
        <el-button @click="resetUploadForm()" size="small">重置</el-button>
        <el-button @click="submitUpload" type="primary" :loading="uploadLoading" size="small" v-waves> 确定上传</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getUploadToken } from "@/api/sysmgr/att1";
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

export default {
  name: "sysmgratt",
  components: {DataGrid},
  directives: { waves },
  filters: {
    parseTime,
    formatFileSize
  },
  data() {
    let validateName = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入档名'));
      } else {
        if (this.uploadInfo.name !== '') {
          this.$refs.uploadInfo.validateField('checkPass');
        }
        callback();
      }
    };
    let validateVersion = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入版本号'));
      } else {
        if (this.uploadInfo.version !== '') {
          this.$refs.uploadInfo.validateField('checkPass');
        }
        callback();
      }
    };
    let validateRemarks = (rule, value, callback) => {
      this.$refs.uploadInfo.validateField('checkPass');
      callback();
    };
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
      uploadInfo: {
        name: "",
        version: "",
        remarks: ""
      },
      labelPosition:"right",
      percent: 0,
      importHeaders: {Authorization: getToken()},
      fileList: [],
      uploadAction:"",
      uploadVisible: false,
      uploadLoading: false,
      acceptFileType: ".apk,.APK",
      // acceptFileType: ".apk,.jpg",
      downLoadLoading: '',
      pathKey:'apk',  //文件夹
      fileUploadParam: {
        sourceDir: "temp"
      },
      uploadFormRules: {
        name: [
          { validator: validateName, trigger: 'blur' }
        ],
        version: [
          { validator: validateVersion, trigger: 'blur' }
        ],
        remarks: [
          { validator: validateRemarks, trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    CosUpload(file) {
      getUploadToken("").then((res) => {
        if(res.result && res.data){
            let key = JSON.parse(res.data);
            let cos = this.initCos(key);
            if (file.size < 20971520) {
              this.uploadFile(cos, file, this.pathKey)
            } else if ( 20971520 < file.size < 1048576000) {
              this.uploadFileSlice(cos, file, this.pathKey)
            }

        }else{
          this.$message.error(res.code);
        }
      });
    },
    initCos(key){
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
    uploadFile(cos, file, pathKey) {
      cos.putObject(
          {
            Bucket: cosConfig.Bucket, // 存储桶名称
            Region: cosConfig.Region, // 地区
            Key: "/" + pathKey + "/" + this.uploadInfo.name+"_v"+this.uploadInfo.version+file.name.substr(file.name.lastIndexOf('.')), // apk名称
            StorageClass: 'STANDARD',
            Body: file, // 上传文件对象
            ContentType: "application/json; charset=utf-8",
            'x-cos-meta-detail':"99999999999999999999999999999999",
            onProgress: (progressData) => {
              this.percent = progressData.percent * 100 || 0
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
       this.getFileMD5(file,cos,pathKey)
    },
    uploadSliceFile(file,cos,pathKey,md5){
      // 存储文件的md5码
      file.md5 = md5
      let subfix = file.name.substr(file.name.lastIndexOf('.'))
      let key = file.md5 + subfix;
      cos.sliceUploadFile({
        Bucket: cosConfig.Bucket, // 存储桶名称
        Region: cosConfig.Region, // 地区
        Key: "/" + pathKey + "/" + this.uploadInfo.name+"_v"+this.uploadInfo.version+file.name.substr(file.name.lastIndexOf('.')), // apk名称
        Body: file,
        ContentType: "application/json; charset=utf-8",
        'x-cos-meta-detail':"99999999999999999999999999999999",
        onProgress: (progressData) => {
          this.percent =  progressData.percent* 100 || 0
        },
      }, (err, data) => {
        if (err) {

        } else {
          data.fid = this.getObjectUrl(cos, key, pathKey)
        }
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
    getFileMD5(file,cos,pathKey) {
      const target = file.file
      const fileReader = new FileReader()
      // 文件每块分割10M，计算分割详情
      const chunkSize = 10 * 1024 * 1024;
      const chunks = Math.ceil(file.size / chunkSize)
      let currentChunk = 0
      // 创建md5对象（基于SparkMD5）
      const spark = new SparkMD5()
      const reader = new FileReader();

      reader.onload = (event) =>{
        // 文件里的文本会在这里被打印出来
        spark.appendBinary(event.target.result)
        currentChunk++
        // 文件处理完成计算MD5，如果还有分片继续处理
        if (currentChunk < chunks) {
          this.loadNext(currentChunk,chunkSize,target,fileReader)
        } else {
          const md5 = spark.end()
          this.uploadSliceFile(target,cos,pathKey,md5)
        }
        this.loadNext(currentChunk,chunkSize,target,fileReader)
      };
      reader.readAsText(target);
      reader.onerror = () =>{
        Message.error("读取文件错误")
      }
    },
   loadNext(currentChunk,chunkSize,file,fileReader) {
    const start = currentChunk * chunkSize
     const   end = start + chunkSize >= file.size ? file.size : start + chunkSize
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
      // this.file = file
      if (file.size > 1048576000) {
        this.$message({
          type: 'error',
          showClose: true,
          duration: 3000,
          message: '文件大于1G!'
        });
        return false;
      } else {
        this.CosUpload(file)
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
    handleChange(file) {
      console.log(this.fileList,"uploadList")
    },
    submitUpload() {
      // this.uploadLoading=true;
      let that = this;
      // setTimeout(function () {
      if (that.$refs.upload.$children[0].fileList.length != 1) {
        that.uploadLoading = false;
        that.$message({
          type: 'error',
          showClose: true,
          duration: 3000,
          message: '请选择文件!'
        });
      } else {
        this.$refs['uploadInfo'].validate((valid) => {
          if (valid) {
            that.$refs.upload.submit();
            console.log('submit!');
          } else {
            this.resetUploadForm();
            // console.log('error submit!!');
            that.$message({
              type: 'error',
              showClose: true,
              duration: 3000,
              message: '验证失败!'
            });
          }
        });
      }
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
    },
    resetUploadForm() {
      this.$refs['uploadInfo'].resetFields();
      this.$refs.upload.clearFiles();
    }
  },
  mounted() {
    // eslint-disable-next-line no-console
  },
};
</script>
