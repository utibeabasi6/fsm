import { sign } from 'aws4';
import FormData from 'form-data';

export type AwsCredentials = {
    accessKeyId: string;
    secretAccessKey: string;
  };
  
  export type CreateSignedRequestArgs = {
    credentials: AwsCredentials;
    url: URL;
    method: 'GET' | 'POST';
    data?: FormData;
    headers?: Record<string, string>;
  };
  
  export const createSignedRequest = (args: CreateSignedRequestArgs) => {
    const { credentials, url, method, data, headers } = args;
  
    const request = {
      host: url.hostname,
      url: url.toString(),
      method,
      // path needs to include query params when present
      path: `${url.pathname}${url.search}`,
      timeout: 20_000,
      headers: headers || {},
      data,
  
      // signed request options
      service: 's3',
      region: 'us-west-2',
    };
  
    sign(request, credentials);
  
    request.headers = {
      'Accept-Encoding': '*',
      ...(data ? data.getHeaders() : {}),
      ...request.headers,
    };
  
    return request;
  };