import axios from "axios";
import { Alert } from "antd";
import { env } from "./envProps";
export const requestSquematic = async (type, url, object, cancelRequest) => {
  try {
    let res;

    const generalParams = {
      signal: cancelRequest,
      timeout: 20000,
    };

    if (type === "GET") {
      res = await axios.get(env.DOMAIN + url, {
        ...generalParams,
        params: object,
      });
    } else if (type === "POST") {
      res = await axios.post(env.DOMAIN + url, object, generalParams);
    } else if (type === "PUT") {
      res = await axios.put(env.DOMAIN + url, object, generalParams);
    } else {
      res = await axios.delete(env.DOMAIN + url, object, generalParams);
    }

    const data = res.data;

    if (res.data) {
      return data;
    } else {
      console.log(data.error);
      <Alert message="Error" description={data.error} type="error" showIcon />;
    }
  } catch (error) {
    if (error) {
      <Alert
        message="Error"
        description={error.message}
        type="error"
        showIcon
      />;
      console.log(error.message);
      return;
    } else if (axios.isCancel(error)) {
      return;
    }

    <Alert message="Error" description="server error" type="error" showIcon />;
  }
};
