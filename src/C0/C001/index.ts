import { APIGatewayEvent, Callback } from 'aws-lambda';
import validate from './validator';
import app from './app';

// イベント入口
export const handler = (event: APIGatewayEvent, _: any, callback: Callback<Response>) => {
  // イベントログ
  console.log(event);

  validate(event)
    .then(() => app(event))
    .then((result: ResponseBody) => {
      // 終了ログ
      console.log(result);
      callback(null, {
        statusCode: 200,
        isBase64Encoded: false,
      });
    })
    .catch(err => {
      // エラーログ
      console.log(err);
      callback(err, {
        statusCode: 502,
      } as Response);
    });
};

export interface Response {
  statusCode: number;
  headers?: {
    [key: string]: string;
  };
  isBase64Encoded: boolean;
  body?: string;
}

export interface RequestBody {
  words: string[];
}

export interface ResponseBody {}