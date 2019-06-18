import { DynamoDB } from 'aws-sdk';
import { DynamoDBStreamEvent } from 'aws-lambda';

let client: DynamoDB.DocumentClient;

// 環境変数
const WORDS_TABLE = process.env.WORDS_TABLE as string;
const GROUPS_TABLE = process.env.GROUPS_TABLE as string;
// 最大単語数、default 10件
const WORDS_LIMIT = process.env.WORDS_LIMIT ? Number(process.env.WORDS_LIMIT) : 10;

// {
//   "Records": [
//     {
//       "eventID": "c4ca4238a0b923820dcc509a6f75849b",
//       "eventName": "INSERT",
//       "eventVersion": "1.1",
//       "eventSource": "aws:dynamodb",
//       "awsRegion": "ap-northeast-1",
//       "dynamodb": {
//         "Keys": {
//           "Id": {
//             "N": "101"
//           }
//         },
//         "NewImage": {
//           "Message": {
//             "S": "New item!"
//           },
//           "Id": {
//             "N": "101"
//           }
//         },
//         "ApproximateCreationDateTime": 1428537600,
//         "SequenceNumber": "4421584500000000017450439091",
//         "SizeBytes": 26,
//         "StreamViewType": "NEW_AND_OLD_IMAGES"
//       },
//       "eventSourceARN": "arn:aws:dynamodb:ap-northeast-1:123456789012:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899"
//     },
//     {
//       "eventID": "c81e728d9d4c2f636f067f89cc14862c",
//       "eventName": "MODIFY",
//       "eventVersion": "1.1",
//       "eventSource": "aws:dynamodb",
//       "awsRegion": "ap-northeast-1",
//       "dynamodb": {
//         "Keys": {
//           "Id": {
//             "N": "101"
//           }
//         },
//         "NewImage": {
//           "Message": {
//             "S": "This item has changed"
//           },
//           "Id": {
//             "N": "101"
//           }
//         },
//         "OldImage": {
//           "Message": {
//             "S": "New item!"
//           },
//           "Id": {
//             "N": "101"
//           }
//         },
//         "ApproximateCreationDateTime": 1428537600,
//         "SequenceNumber": "4421584500000000017450439092",
//         "SizeBytes": 59,
//         "StreamViewType": "NEW_AND_OLD_IMAGES"
//       },
//       "eventSourceARN": "arn:aws:dynamodb:ap-northeast-1:123456789012:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899"
//     },
//     {
//       "eventID": "eccbc87e4b5ce2fe28308fd9f2a7baf3",
//       "eventName": "REMOVE",
//       "eventVersion": "1.1",
//       "eventSource": "aws:dynamodb",
//       "awsRegion": "ap-northeast-1",
//       "dynamodb": {
//         "Keys": {
//           "Id": {
//             "N": "101"
//           }
//         },
//         "OldImage": {
//           "Message": {
//             "S": "This item has changed"
//           },
//           "Id": {
//             "N": "101"
//           }
//         },
//         "ApproximateCreationDateTime": 1428537600,
//         "SequenceNumber": "4421584500000000017450439093",
//         "SizeBytes": 38,
//         "StreamViewType": "NEW_AND_OLD_IMAGES"
//       },
//       "eventSourceARN": "arn:aws:dynamodb:ap-northeast-1:123456789012:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899"
//     }
//   ]
// }

const EVENT_NAME = 'MODIFY';

export default async (event: DynamoDBStreamEvent): Promise<void> => {
  event.Records.forEach(async record => {
    // 更新以外処理しない
    if (record.eventName !== EVENT_NAME) {
      return;
    }
  });
};
