require('dotenv').config();

import { Helper } from 'dynamodb-helper';
import { DynamoDB } from 'aws-sdk';
import { sync } from 'glob';

const AWS_ENDPOINT = process.env.AWS_ENDPOINT;
const DEFAULT_REGION = process.env.DEFAULT_REGION;

const helper = new Helper({
  options: {
    endpoint: AWS_ENDPOINT,
    region: DEFAULT_REGION,
  },
});

const insert = async () => {
  console.log('Insert PocketCards_Groups...');
  await helper.bulk('PocketCards_Groups', require('../datas/Groups.json'));

  console.log('Insert PocketCards_Words...');
  await helper.bulk('PocketCards_Words', require('../datas/Words.json'));
};

(async () => {
  await insert();
})();