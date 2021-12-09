import axios, { ResponseType, AxiosResponse } from 'axios';

export function objectAssign(target: any, ...sources: any[]) {
  sources.forEach(source => {
    Object.keys(source).forEach(key => {
      const s_val = source[key]
      const t_val = target[key]
      target[key] = t_val && s_val && typeof t_val === 'object' && typeof s_val === 'object'
        ? objectAssign(t_val, s_val)
        : s_val
    })
  })
  return target
}

export async function downloadFile(url: string, responseType: ResponseType = 'json'): Promise<AxiosResponse<any>> {
  return await axios({
    url,
    method: 'GET',
    responseType: responseType
  })
}

export const delay = async (amount = 720) => new Promise(resolve => setTimeout(resolve, amount))
export function dotify(obj: any) {
  var res = {} as any;
  function recurse(obj: any, current?: any) {
    for (var key in obj) {
      var value = obj[key];
      var newKey = (current ? current + '.' + key : key);  // joined key with dot
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        recurse(value, newKey);  // it's a nested object, so do it again
      } else {
        res[newKey] = value;  // it's not an object, so set the property
      }
    }
  }

  recurse(obj);
  return res;
}
export function isNumber(value: any) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}
