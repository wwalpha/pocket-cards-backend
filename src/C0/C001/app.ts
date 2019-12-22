import { AWSError, Polly, S3 } from 'aws-sdk';
import { APIGatewayEvent } from 'aws-lambda';
import * as short from 'short-uuid';
import axios from 'axios';
import { polly, s3, ssm } from '@utils/clientUtils';
import { putItem_groups, getItem_words, putItem_words } from './db';
import { C001Request } from '@typings/api';
import { dbHelper } from '@utils/dbHelper';
import { getNow } from '@utils/dateUtils';
import { Logger } from '@utils/utils';

// 環境変数
const TABLE_WORDS = process.env.TABLE_WORDS as string;
const TABLE_GROUP_WORDS = process.env.TABLE_GROUP_WORDS as string;
const IPA_URL = process.env.IPA_URL as string;
const IPA_API_KEY = process.env.IPA_API_KEY as string;
const MP3_BUCKET = process.env.MP3_BUCKET as string;
const PATH_PATTERN = process.env.PATH_PATTERN as string;
const TRANSLATION_URL = process.env.TRANSLATION_URL as string;
const TRANSLATION_API_KEY = process.env.TRANSLATION_API_KEY as string;

export default async (event: APIGatewayEvent): Promise<void> => {
  if (!event.body || !event.pathParameters) {
    return;
  }

  const input = JSON.parse(event.body) as C001Request;
  const groupId = event.pathParameters['groupId'];

  // 単語は全部小文字で処理する
  input.words = input.words.map(item => item.toLowerCase());

  // グループ単語登録用タスクを作成する
  let putTasks = input.words.map(item =>
    dbHelper().put(
      putItem_groups(TABLE_GROUP_WORDS, {
        id: groupId,
        word: item,
        nextTime: getNow(),
        times: 0
      })
    )
  );

  try {
    // グループ単語登録
    await Promise.all(putTasks);
  } catch (err) {
    // キー既存あり以外の場合、エラーとする
    if ((err as AWSError).code !== 'ConditionalCheckFailedException') {
      throw err;
    }
  }

  Logger.info('単語登録完了しました.');

  // 単語存在確認
  const getTasks = input.words.map(item => dbHelper().get(getItem_words(TABLE_WORDS, item)));
  const getResults = await Promise.all(getTasks);

  Logger.info('検索結果', getResults);

  const targets: string[] = [];
  input.words.forEach((item, idx) => {
    const dbInfo = getResults[idx].Item;
    if (!dbInfo || Object.keys(dbInfo).length === 0) {
      targets.push(item);
    }
  });

  Logger.info('単語の存在チェックは完了しました.');

  Logger.info('対象数:', targets.length);
  // すでに辞書に存在しました
  if (targets.length === 0) {
    return;
  }

  // 単語登録用の情報を収集する
  const taskArray = targets.map(item =>
    Promise.all([getPronounce(item), getMP3(item), getTranslate(item, 'zh'), getTranslate(item, 'ja')])
  );

  const result = await Promise.all(taskArray);

  Logger.info('単語情報を収集しました.');

  // 単語辞書登録
  putTasks = result.map(item => {
    const pronounce = item[0];
    const mp3 = item[1];
    const vocChn = item[2];
    const vocJpn = item[3];

    return dbHelper().put(
      putItem_words(TABLE_WORDS, {
        word: pronounce['word'],
        pronounce: pronounce['pronounce'],
        mp3,
        vocChn,
        vocJpn
      })
    );
  });

  // 辞書登録処理
  await Promise.all(putTasks);

  Logger.info('単語辞書の登録は完了しました.');
};

const getPronounce = async (word: string) => {
  const apiKey = await getSSMValue(IPA_API_KEY);

  const res = await axios.get(`${IPA_URL}?word=${word}`, {
    headers: {
      'x-api-key': apiKey
    }
  });

  return res.data;
};

const getMP3 = async (word: string): Promise<string> => {
  const client = polly();

  /**  */
  const request: Polly.SynthesizeSpeechInput = {
    Text: word,
    TextType: 'text',
    VoiceId: 'Joanna',
    OutputFormat: 'mp3',
    LanguageCode: 'en-US'
  };

  const response = await client.synthesizeSpeech(request).promise();

  // ファイル名
  const filename: string = `${short.generate()}.mp3`;
  const prefix: string = getNow();
  const key: string = `${PATH_PATTERN}/${prefix}/${filename}`;

  const putRequest: S3.Types.PutObjectRequest = {
    Bucket: MP3_BUCKET,
    Key: key,
    Body: response.AudioStream
  };

  const sClient = s3();
  // S3に保存する
  await sClient.putObject(putRequest).promise();

  return key;
};

const getTranslate = async (word: string, targetLanguageCode: string) => {
  const apiKey = await getSSMValue(TRANSLATION_API_KEY);

  const {
    data: {
      data: { translations }
    }
  } = await axios.post(`${TRANSLATION_URL}?key=${apiKey}`, {
    q: word,
    from: 'en',
    target: targetLanguageCode,
    format: 'text'
  });

  // 結果ない場合、エラーとする
  if (!translations || translations.length === 0) {
    throw new Error(`翻訳できません。Word:${word}`);
  }

  return translations[0].translatedText;
};

/** SSM Value */
const getSSMValue = async (key: string) => {
  const client = ssm();

  const result = await client
    .getParameter({
      Name: key
    })
    .promise();

  if (!result.Parameter || !result.Parameter.Value) {
    throw new Error('Can not get parameters.');
  }

  return result.Parameter.Value;
};
