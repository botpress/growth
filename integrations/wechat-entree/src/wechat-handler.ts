import crypto from 'crypto';

// ============== SHA1 Signature Verification ==============
function getSHA1(...args: string[]): string {
  // Replicate Python: list = [token, timestamp, nonce]; list.sort()
  const sortedList = [...args].sort();
  
  // Replicate Python: sha1 = hashlib.sha1(); map(sha1.update, list)
  const sha1 = crypto.createHash('sha1');
  sortedList.forEach(item => sha1.update(item, 'utf8'));
  
  return sha1.digest('hex');
}

// ============== XML Parsing (like receive.py) ==============
interface WeChatMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: string;
  MsgType: string;
  MsgId?: string;
  Content?: string;      // for text messages
  PicUrl?: string;       // for image messages
  MediaId?: string;      // for image/voice/video messages
  Format?: string;       // for voice messages
  Recognition?: string;  // for voice messages (speech recognition)
  ThumbMediaId?: string; // for video messages
  Location_X?: string;   // for location messages
  Location_Y?: string;
  Scale?: string;
  Label?: string;
  Title?: string;        // for link messages
  Description?: string;
  Url?: string;
  Event?: string;        // for event messages
  EventKey?: string;
  Ticket?: string;
}

function parseXml(webData: string): WeChatMessage | null {
  if (!webData || webData.length === 0) {
    return null;
  }

  const extractValue = (xml: string, tag: string): string | undefined => {
    // Match CDATA values: <Tag><![CDATA[value]]></Tag>
    // Need to double-escape brackets for RegExp constructor
    const cdataRegex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1];
    
    // Match plain text values: <Tag>value</Tag>
    const plainRegex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
    const plainMatch = xml.match(plainRegex);
    if (plainMatch) return plainMatch[1];
    
    return undefined;
  };

  const msg: WeChatMessage = {
    ToUserName: extractValue(webData, 'ToUserName') || '',
    FromUserName: extractValue(webData, 'FromUserName') || '',
    CreateTime: extractValue(webData, 'CreateTime') || '',
    MsgType: extractValue(webData, 'MsgType') || '',
    MsgId: extractValue(webData, 'MsgId'),
    Content: extractValue(webData, 'Content'),
    PicUrl: extractValue(webData, 'PicUrl'),
    MediaId: extractValue(webData, 'MediaId'),
    Format: extractValue(webData, 'Format'),
    Recognition: extractValue(webData, 'Recognition'),
    ThumbMediaId: extractValue(webData, 'ThumbMediaId'),
    Location_X: extractValue(webData, 'Location_X'),
    Location_Y: extractValue(webData, 'Location_Y'),
    Scale: extractValue(webData, 'Scale'),
    Label: extractValue(webData, 'Label'),
    Title: extractValue(webData, 'Title'),
    Description: extractValue(webData, 'Description'),
    Url: extractValue(webData, 'Url'),
    Event: extractValue(webData, 'Event'),
    EventKey: extractValue(webData, 'EventKey'),
    Ticket: extractValue(webData, 'Ticket'),
  };

  return msg;
}

// ============== XML Reply Generation (like reply.py) ==============
function createTextReply(toUser: string, fromUser: string, content: string): string {
  const createTime = Math.floor(Date.now() / 1000);
  return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${createTime}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${content}]]></Content>
</xml>`;
}

function createImageReply(toUser: string, fromUser: string, mediaId: string): string {
  const createTime = Math.floor(Date.now() / 1000);
  return `<xml>
<ToUserName><![CDATA[${toUser}]]></ToUserName>
<FromUserName><![CDATA[${fromUser}]]></FromUserName>
<CreateTime>${createTime}</CreateTime>
<MsgType><![CDATA[image]]></MsgType>
<Image>
<MediaId><![CDATA[${mediaId}]]></MediaId>
</Image>
</xml>`;
}

// ============== Logger Interface ==============
export interface Logger {
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const defaultLogger: Logger = {
  info: (...args) => console.log(...args),
  debug: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

// ============== Main Handler ==============
export interface WeChatHandlerParams {
  wechatToken: string;
  method: string;
  signature?: string;
  timestamp?: string;
  nonce?: string;
  echostr?: string;
  body?: string;
  logger?: Logger;
}

export interface WeChatHandlerResult {
  status: number;
  contentType: string;
  body: string;
  message?: WeChatMessage;
}

export function handleWeChatRequest(params: WeChatHandlerParams): WeChatHandlerResult {
  const { wechatToken, method, signature, timestamp, nonce, echostr, body, logger = defaultLogger } = params;

  // ========== Handle GET (Webhook Verification) ==========
  if (method === 'GET') {
    logger.info('=== WeChat GET Verification ===');
    logger.info('Token (first 4 chars):', wechatToken?.substring(0, 4) + '...');
    logger.info('Timestamp:', timestamp);
    logger.info('Nonce:', nonce);
    logger.info('Signature:', signature);
    logger.info('Echostr:', echostr);

    // If no signature, return greeting
    if (!signature) {
      logger.info('GET request without signature - returning greeting');
      return {
        status: 200,
        contentType: 'text/plain',
        body: 'hello, this is handle view',
      };
    }

    // Verify signature: SHA1(sorted([token, timestamp, nonce]))
    const sortedInputs = [wechatToken, timestamp || '', nonce || ''].sort();
    logger.info('Sorted inputs for SHA1:', sortedInputs);
    
    const hashcode = getSHA1(wechatToken, timestamp || '', nonce || '');
    logger.info('Computed hashcode:', hashcode);
    logger.info('Received signature:', signature);
    logger.info('Match:', hashcode === signature);

    if (hashcode === signature) {
      logger.info('✓ Signature verified successfully, returning echostr:', echostr);
      return {
        status: 200,
        contentType: 'text/plain',
        body: echostr || '',
      };
    } else {
      logger.error('✗ Signature verification FAILED');
      logger.error('Expected:', hashcode);
      logger.error('Received:', signature);
      return {
        status: 200,
        contentType: 'text/plain',
        body: '',
      };
    }
  }

  // ========== Handle POST (Message Receive) ==========
  if (method === 'POST') {
    logger.info('=== WeChat POST Message ===');
    
    // Verify signature first (optional but recommended)
    if (signature && timestamp && nonce) {
      const sortedInputs = [wechatToken, timestamp, nonce].sort();
      logger.info('Sorted inputs for SHA1:', sortedInputs);
      
      const hashcode = getSHA1(wechatToken, timestamp, nonce);
      logger.info('Computed hashcode:', hashcode);
      logger.info('Received signature:', signature);
      logger.info('Match:', hashcode === signature);
      
      if (hashcode !== signature) {
        logger.error('✗ POST signature verification FAILED');
        return {
          status: 200,
          contentType: 'text/plain',
          body: '',
        };
      }
      logger.info('✓ POST signature verified');
    }

    // Parse the incoming XML
    logger.info('Parsing XML body, length:', body?.length || 0);
    logger.info('Raw XML body:', body);
    const recMsg = parseXml(body || '');

    if (!recMsg) {
      logger.error('Failed to parse XML message');
      return {
        status: 200,
        contentType: 'text/plain',
        body: 'success',
      };
    }

    logger.info('=== Parsed WeChat Message ===');
    logger.info('Received message:', JSON.stringify(recMsg, null, 2));
    logger.info('MsgType:', recMsg.MsgType);
    logger.info('FromUserName:', recMsg.FromUserName);
    logger.info('ToUserName:', recMsg.ToUserName);

    if (recMsg.MsgType === 'text') {
      logger.info('Content:', recMsg.Content);
    } else if (recMsg.MsgType === 'image') {
      logger.info('PicUrl:', recMsg.PicUrl);
      logger.info('MediaId:', recMsg.MediaId);
    }

    // Return the parsed message to be handled by Botpress
    // We return 'success' to tell WeChat we received the message
    // The actual reply will be sent from Botpress through the message handler
    logger.info('Message parsed successfully, returning success to WeChat');

    return {
      status: 200,
      contentType: 'text/plain',
      body: 'success',
      message: recMsg,
    };
  }

  // Other methods not allowed
  return {
    status: 405,
    contentType: 'text/plain',
    body: 'Method not allowed',
  };
}

