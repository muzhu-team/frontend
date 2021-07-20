import request from '@/utils/request'

export function getOutsourceList(params) {
    return request({
        url: '/sysmgr/outsource/list',
        method: 'get',
        params
    })
}

export function findOutsourceById(param) {
    return request({
        url: '/sysmgr/outsource/find',
        method: 'post',
        data:param
    })
}

export function saveOutsource(param) {
    return request({
        url: '/sysmgr/outsource/save',
        method: 'post',
        data:param
    })
}

export function dropOutsource(param) {
    return request({
        url: '/sysmgr/outsource/delete',
        method: 'post',
        data:param
    })
}
