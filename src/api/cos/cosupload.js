import request from '@/utils/request'

export function getUploadToken(params) {
  return request({
    url: '/cos/uploadApk',
    method: 'post',
    params
  })
}

