# ChatGod

ChatGod lets your Twitch viewers take turns voicing characters in your stream using text-to-speech. Up to three chatters can queue up as different "chat gods," and whatever they type gets spoken out loud in the character's voice.

---

## What You Need

- **[Node.js](https://nodejs.org/)** (version 18 or newer)
- **Twitch credentials** (client ID, access token, channel name — see below)
- **Azure TTS credentials** (optional — but without them your chat gods are silent)

### Twitch Credentials

The easy way:

1. Go to [twitchtokengenerator.com](https://twitchtokengenerator.com/)
2. Click **Bot Chat Token**
3. Authorize with your Twitch account
4. Copy the **Access Token**, **Refresh Token**, and **Client ID** from the top of the page

### Azure TTS (optional)

Without this, chat gods will work but won't actually speak.

1. Make a free account at [portal.azure.com](https://portal.azure.com)
2. Create a new **Speech** resource (use the **Free F0** pricing tier)
3. Once it's made, click **Keys and endpoint** and copy **KEY 1** and the **Location/Region**

---

## Running It

Clone the repo and create a `.env` file in the root folder with your credentials:

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CHANNEL_NAME=your_twitch_username
TWITCH_ACCESS_TOKEN=your_access_token
TWITCH_REFRESH_TOKEN=your_refresh_token
TWITCH_BROADCASTER_ID=your_numeric_twitch_id
AZURE_TTS_KEY=your_azure_key
AZURE_TTS_REGION=eastus
BACKEND_PORT=3333
```

> Your numeric Twitch ID isn't your username — you can look it up at [streamweasels.com](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).

Then run:

```
npm run dev
```

That's it. Everything else (installing, building, starting the servers) happens automatically. When it's ready, visit **http://localhost:3333** in your browser to see the ChatGod control panel.

---

## Chat Commands

Your viewers type these in your Twitch chat:

- `!joingod1`, `!joingod2`, `!joingod3` — queue up as one of the three chat gods. The first person to join becomes the current speaker; everyone else waits in line.
- Once you're in control of a chat god, anything you type gets spoken in their voice.

---

## Using It In Your Own Project

ChatGod is also published on npm as `@sarxina/chatgod-js`. If you're building something on top of it:

```
npm install @sarxina/chatgod-js
```

```ts
import { DefaultChatGodManager } from "@sarxina/chatgod-js";
import http from "http";

const server = http.createServer();
new DefaultChatGodManager(server);
server.listen(3333);
```

It also exports `ChatGod`, `ChatGodManager` (the abstract base you can subclass), `WSManager`, `TTSManager`, and the stage-3 decorators `updateGodState` and `updateFromFrontend`.
