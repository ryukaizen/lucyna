![Lucyna Kushinada](https://github.com/user-attachments/assets/d3f8158f-9ebd-450d-8d7f-357e7d2ea718)

<h1 align="center">A Telegram Chat Management Bot</h1> 

<h3 align="center">Built using <a href="https://grammy.dev">grammY</a> & <a href="https://gram.js.org/">GramJS</a></h3>

<h3 align="center"> 🎀 Can be found on Telegram as <a href="https://telegram.me/LucynaBot">LucynaBot</a></h3>

<h2>Features</h2>
<p>This bot offers a variety of chat management features to help you keep your Telegram groups organized and secure. Below is a list of available modules:</p>

- **Admin**: Manage administrative tasks and settings.
- **AniList**: Integration with AniList to provide anime-related information.
- **Antiflood**: Prevent spam by limiting the number of messages a user can send in a short period.
- **Bans**: Ban users from the chat.
- **Blacklists**: Create and manage blacklists to automatically remove unwanted content.
- **Cleanservice**: Clean up service messages to keep the chat tidy.
- **Extras**: Additional features and utilities.
- **Filters**: Set up custom filters to automatically respond to specific messages.
- **Fun**: Fun commands to engage with chat members.
- **Greetings**: Send welcome messages to new members.
- **Locks**: Lock specific types of messages (e.g., media, links) to control chat content.
- **Mutes**: Mute users to prevent them from sending messages temporarily.
- **Notes**: Save and recall notes.
- **Purges**: Bulk delete messages.
- **Reports**: Report messages to administrators.
- **Rules**: Define and display chat rules.
- **Users**: Manage user settings and permissions.
- **Warns**: Warn users for rule violations.

<h2>Installation</h2>
<p>Follow these steps to install and set up the bot:</p>

1. **Clone the repository**:
    ```sh
    git clone https://github.com/ryukaizen/lucyna.git
    cd lucyna
    ```

2. **Install Node.js and npm**: Ensure you have Node.js and npm installed. You can download them from [here](https://nodejs.org/).

3. **Install TypeScript**:
    ```sh
    npm install -g typescript
    ```

4. **Install dependencies**:
    ```sh
    npm install
    ```

5. **Set up environment variables**:
    ```sh
    cp .env.example .env
    ```

6. **Edit and fill up all the relevant environment variables inside the .env file**

6. **Add PostgreSQL URL, Telegram API ID, API Hash, and GramJS String Session to the .env file**:
    Edit the `.env` file and add your PostgreSQL connection URL, Telegram API ID, API Hash, and GramJS String Session:
    ```env
    DATABASE_URL=your-postgresql-connection-url
    API_ID=your-telegram-api-id
    API_HASH=your-telegram-api-hash
    STRING_SESSION=your-gramjs-string-session
    ```
    You can generate the GramJS string session using [telegramtools.com/string-session-generator](https://telegramtools.com/string-session-generator).

7. **Set up Prisma**:
    ```sh
    npx prisma db push
    ```


8. **Start the bot using nodemon**:
    ```sh
    npm start
    ```


## To-do & potential ideas
- [x] Markdown parsing for notes, filters, rules, welcomes
- [x] GramJS as utility
- [ ] Pagination buttons for /notes so it wont cover entire screen
- [ ] Refactor everything since there's A LOT of repeated code
- [x] Command prefixes !, ?
- [ ] Autodelete "Only admins can use this command" type of messages
- [ ] Hydration plugin (change every ctx and bot method)
- [ ] Make use of all invitelink methods given by Telegram API, make a separate module for it
- [ ] Pillow welcome where you fetch pfp of user and create a welcome card
- [ ] Custom bot token (bot instances)
- [ ] Moderator roles
- [ ] Presets for security, settings and etc.
- [ ] /shutup on | off command to make the bot shut up (owner only)

## Bottom Notes
Feel free to clone, contribute and raise issues. You can even reach out to me on [Telegram](https://telegram.me/please_help_me_im_dumb).

The project was rushed due to time constraints, so there might be some bugs and issues. Although, we're just getting started ;)
