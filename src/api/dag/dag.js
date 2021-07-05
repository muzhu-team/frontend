import request from '@/utils/request'

export function getDag(dagId) {
    return request({
        url: '/sysmgr/workflow/list?dagId='+dagId,
        method: 'post',
    })
}

export function saveDag(data) {
    console.log(data.toString())
    return request({
        url: '/sysmgr/workflow/saveDag',
        method: 'post',
        data,
    })
}
