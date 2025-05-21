import * as types from './types';
import { Twilio, twiml } from 'twilio';

const handleOutgoing = async (props: types.MessageHandlerProps) => {
  const { ctx, payload, conversation, logger } = props;

  const textResponse = payload.text.split('<hangup/>')[0] as string; //weird TS bug
  const isHangingUp = payload.text.includes('<hangup/>');

  const { configuration } = ctx;

  const voice = (configuration.voice || 'Google.en-US-Standard-C') as twiml.VoiceResponse['SayVoice'];
  const language = (configuration.language || 'en-US') as twiml.VoiceResponse['SayLanguage'];
  const timeOut = configuration.timeOut || 1;
  const speechTimeout = configuration.speechTimeOut || 1;
  logger.forBot().info(`The following text response is being sent to Twilio: ${textResponse}`);

  const voiceResponse = new twiml.VoiceResponse();

  if (isHangingUp) {
    voiceResponse.say(
      {
        voice: voice,
        language: language,
      },
      textResponse,
    );
    voiceResponse.hangup();
  } else {
    const gatherOptions: twiml.VoiceResponse['GatherAttributes'] = {
      input: ['speech'],
      speechModel: 'phone_call',
      language: language,
      action: `https://webhook.botpress.cloud/${ctx.webhookId}`,
      method: 'POST',
      timeOut: timeOut,
      speechTimeout: speechTimeout,
    };

    voiceResponse.gather(gatherOptions).say(
      {
        voice: voice,
        language: language,
      },
      textResponse,
    );

    if (configuration.repromptPhrase) {
      voiceResponse.gather(gatherOptions).say(
        {
          voice: voice,
          language: language,
        },
        configuration.repromptPhrase!,
      );
    }
  }

  if (!conversation.tags.callSid) {
    throw new Error('No call SID provided');
  }

  try {
    const twilioClient = new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken);
    const call = await twilioClient.calls(conversation.tags.callSid).fetch();

    await call.update({
      twiml: voiceResponse.toString(),
    });
  } catch (error) {
    throw new Error(`Error sending request to Twilio webhook ${JSON.stringify(error)}`);
  }
};

export default handleOutgoing;
