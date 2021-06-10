import request from '@/utils/request'

export function getUploadToken(params) {
  return request({
    url: '/sysmgr/cos/uploadApk',
    method: 'post',
    params
  })
}

