import axios from 'axios';
import qs from 'qs';
import Config from '../Config';

const apiUrl = Config.apiEndPoint;

const numberSearch = (data) => {
  const options = {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify(data),
    url: apiUrl + "/somos/send",
  };
  return axios(options);
};

const sendNew = (data) => {
  const options = {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded'},
    data: qs.stringify(data),
    url: apiUrl + "/somos/send_new",
  };
  return axios(options);
};

const login = async (data) => {
  return await (axios.post(apiUrl + '/session/login',
    data,
    {headers: {'Content-Type': 'application/json'}
    }).then(res => {
      return res;
    }).catch(err => {return err;}));
};

export default {
  numberSearch,
  sendNew,
  login,
}


