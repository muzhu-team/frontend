import request from '@/utils/request'

export function getUploadToken(params) {
  return request({
    url: '/tool/uploadapk',
    method: 'post',
    params
  })
}

