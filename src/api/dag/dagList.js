import request from '@/utils/request'

export function getDagInfo(dagId) {
    return request({
        url: '/sysmgr/workflow/list?dagId='+dagId,
        method: 'post',
    })
}

