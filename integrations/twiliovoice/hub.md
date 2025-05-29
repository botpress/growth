The Twilio Voice integration allows you to talk to your bot on a phone call.

[![image](https://i.imgur.com/Ye9dN2F.png)](https://youtu.be/5w_qRxuTLAM)

## Prerequisites

- A [Twilio](https://www.twilio.com/) account.
- A Twilio phone number. Refer to [this article](https://support.twilio.com/hc/en-us/articles/223135247-How-to-Search-for-and-Buy-a-Twilio-Phone-Number-from-Console) to learn how to get one.
- A [Botpress Cloud account](https://app.botpress.cloud) and a [Botpress Bot](https://botpress.com/docs/cloud/getting-started/create-and-publish-your-chatbot/).

## 1. Add Twilio authentication to Botpress

1. Go to the Twilio [console dashboard](https://console.twilio.com/?frameUrl=/console).
2. Scroll down and copy your **Account SID** and **Auth Token** from the **Account Info** section. Then, paste them into the **Account SID** and **Auth Token** fields in the integration configuration on Botpress.

## 2. Add Botpress Webhook URL to Twilio

1. In the Develop tab on the left, navigate to Phone Numbers -> Manage -> Active Numbers. Click on the phone number you would like to integrate.
2. Copy the webhook URL from the integration configuration page and paste it into the **A Call Comes In** field.

## Important Things to Keep in Mind

- Bot should only send one message per turn.
- To hang up the call, you should add `<hangup/>` at the end of the message. For example, if a bot sends `Bye!<hangup/>`, the caller will hear "Bye!" and the call will be disconnected immediately afterward.

## Integration Configuration

- Enabled: Whether Botpress will communicate with Twilio.
- Webhook URL: The URL for receiving data in Botpress.
- Account SID: Your Twilio Account SID.
- Auth Token: Your Twilio Auth Token.
- Reprompt Phrase: Phrase played if the caller doesn't respond
- Voice: Voice used to pronounce bot's responses. Full list of voices can be found [here](https://www.twilio.com/docs/voice/twiml/say/text-speech#available-voices-and-languages).
- Language: Language in which bot communicates. Full list of languages can be found [here](https://www.twilio.com/docs/voice/twiml/say/text-speech#available-voices-and-languages).
- Timeout: Sets the limit (in seconds) that Twilio will wait for the caller to say another word before it sends data to the integration.
- Speech Timeout: Sets the limit (in seconds) that Twilio will wait after a pause in speech before it stops its recognition. After this timeout is reached, Twilio will send the data to the integration.
