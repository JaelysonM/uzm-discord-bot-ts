import axios from 'axios';

export const mcApi = (ip: string) => axios.create({
  baseURL: `http://mcapi.us/server/status?ip=${ip}`,
  timeout: 2000,
});

export const mineTools = (nickname: string) => axios.create({
  baseURL: `https://api.minetools.eu/uuid/${nickname}`,
  timeout: 2000,
});