import { Client, GatewayIntentBits, Colors, EmbedBuilder, Events, Guild, GuildMember, PartialUser, User, UserPrimaryGuild } from "discord.js";


const token = ""; // put ur bot token here. its probably a good idea to enable all privileged intents on the developer portal. see comment on line 13 for more details.

const allowedServerTagIds = ["1385520444458799155", "1187823000934953060", "1397363236193697792"]; // change this to include any server ids that you want to reward users for using their tags

const serverTagPermsRoleId = "1373786757300224010"; // role id to give users when they wear a permitted tag
const serverTagTargetGuildId = "1187823000934953060"; // the server to update roles in
const serverTagLogsChannelId = "1373789524961923164"; // the logs channel for tag updates


const client = new Client({ // i was having issues with intents so i just gave up and put every intent. someone smarter than me can fix this later ig
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessagePolls,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessagePolls,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.AutoModerationConfiguration
  ],
});


async function sendTagAlertEmbed(type: string, member: GuildMember) {
  const description = `<@${member.id}> ${member.user.username} ${type} their tag.`;
  console.log(description);

  const embed = new EmbedBuilder()
    .setTitle("Server Tag Update")
    .setColor(type === "added" ? Colors.Green : Colors.Red)
    .setDescription(description)
    .setFooter({ text: "Bot by https://eepy.io/"});

  const channel = member.guild.channels.cache.get(serverTagLogsChannelId);
  if (channel && channel.isTextBased()) { // idk why i have to put the `.isTextBased` check but it makes the typescript thingie stop complaining
    await channel.send({ embeds: [embed] });
  }
}

client.on(Events.UserUpdate, async (oldUser, newUser) => {
  if (oldUser.primaryGuild === newUser.primaryGuild) return; // skipping events where the tag isnt updated

  const guild = client.guilds.cache.get(serverTagTargetGuildId);
  if (!guild) return;
  const member = guild.members.cache.get(newUser.id);
  if (!member) return;

  const clanTag = member.user.primaryGuild; // the entire `clanTag` thingie is bcuz i ported most of this over from a python bot that used a custom fork of discord.py and it looked kinda like this
  if (clanTag && clanTag.tag && clanTag.identityGuildId) { // this makes the typescript compiler stop complaining
    if (allowedServerTagIds.includes(clanTag.identityGuildId) && clanTag.identityEnabled) {
      if (!member.roles.cache.has(serverTagPermsRoleId)) {
        await member.roles.add(serverTagPermsRoleId, "Server tag reward");
        await sendTagAlertEmbed("added", member);
      }
      return; // if the tag isnt accepted then it removes roles by default
    }
  }

  if (member.roles.cache.has(serverTagPermsRoleId)) {
    await member.roles.remove(serverTagPermsRoleId, "Server tag reward");
    await sendTagAlertEmbed("removed", member);
  }
});

client.once(Events.ClientReady, () => {
  if (client.user) { // if this check isnt here then the entire world dies and idk why
    console.log(`Logged in as ${client.user.tag}`);
  }
});

client.login(token);
