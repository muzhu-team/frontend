import COS from 'cos-js-sdk-v5'
import { getToken } from '@/utils/auth'
import SparkMD5 from "spark-md5";
import {
    Message
} from 'element-ui'
import axios from "axios";

//  CosTokenApi 後端接口地址 e.g. process.env.VUE_APP_BASE_API + "/sysmgr/att/upload"
//  file 傳入要上傳的file對象
//  pathKey COS上傳的目錄名稱 e.g. "picture"

const cosConfig = {
    Bucket: "jacky917-1305943827",
    Region: "ap-hongkong",
    Domain: "development.majo.website"
}


export function CosUpload(CosTokenApi,file,pathKey,callback) {
    console.log("======================")
    console.log(CosTokenApi,typeof(file));
    console.log("======================")

    const config = {
        headers: {Authorization: getToken()},
    }

    axios.post(CosTokenApi, "",config)
        .then((res) => { // 后台接口返回 密钥相关信息
            console.log(res)
            console.log("-----------------------")
            var key = JSON.parse(res.data.data);
            console.log(key);
        var cos = new COS({
            getAuthorization: function(options, callback) {
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
            uploadFile(cos,file,pathKey,res => callback(res))
            console.log("uploadFile");
        }else if(file.size < 1048576000){
            uploadFileSlice(cos,file,pathKey, res => callback(res))
            console.log("uploadFileSlice");
        }else{
            callback("Error");
        }

    })
}

// 大文件分片上传-通过sliceUploadFile上传
function uploadFile(cos, file, pathKey, callback) {
    cos.putObject(
        {
            Bucket: cosConfig.Bucket, // 存储桶名称
            Region: cosConfig.Region, // 地区
            Key: "/"+pathKey+"/"+file.name, // 图片名称
            StorageClass: 'STANDARD',
            Body: file, // 上传文件对象
            onHashProgress: function (progressData) {
                console.log ('校验中', JSON.stringify (progressData));
            },
            onProgress: function (progressData) {
                console.log ('上传中', JSON.stringify (progressData));
            },
        },
        function (err, data) {
            console.log('999',err,data,data.Location)
            if (err) {
                Message({message:'文件上传失败,请重新上传',type: 'error',})
            } else {
                let fileUrl = 'http://' + data.Location
                callback(fileUrl)
            }
        }
    )
}


// 大文件分片上传-通过sliceUploadFile上传
function uploadFileSlice(cos, file, pathKey, callback) {
    // 得到md5码
    getFileMD5(file, md5 => {
        // 存储文件的md5码
        file.md5 = md5
        const subfix = file.name.substr(file.name.lastIndexOf('.'))
        let key = file.md5 + subfix;
        cos.sliceUploadFile({
            Bucket: cosConfig.Bucket, // 存储桶名称
            Region: cosConfig.Region, // 地区
            Key: "/"+pathKey+"/"+file.name,
            Body: file,
        }, function(err, data) {
            if (err) {
                callback(err)
            } else {
                data.fid = getObjectUrl(cos,key,pathKey)
                callback(null, data)
            }
        })
    })
}


function getObjectUrl(cos,key,pathKey) {
    const url = cos.getObjectUrl({
        Bucket: cosConfig.Bucket, // 存储桶名称
        Region: cosConfig.Region, // 地区
        Key: "/"+pathKey+"/"+key,
        Sign: false
    })
    // 腾讯云的地址替换为域名地址
    const p = `${cosConfig.Bucket}.cos.${cosConfig.Region}.myqcloud.com`
    return url.replace(p, cosConfig.Domain)
}



function getFileMD5(file, callback) {
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
            callback(spark.end())
        }
    }

    // 处理单片文件的上传
    function loadNext() {
        const start = currentChunk * chunkSize
        const end = start + chunkSize >= file.size ? file.size : start + chunkSize

        fileReader.readAsBinaryString(file.slice(start, end))
    }

    loadNext()
}