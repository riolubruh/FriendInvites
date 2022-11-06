/**
 * @name FriendInvites
 * @author Riolubruh
 * @version 0.1.0
 * @source https://github.com/riolubruh/FriendInvites
 * @updateUrl https://raw.githubusercontent.com/riolubruh/FriendInvites/main/FriendInvites.plugin.js
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
	const config = {
		"info": {
			"name": "FriendInvites",
			"authors": [{
				"name": "Riolubruh",
				"discord_id": "359063827091816448",
				"github_username": "riolubruh"
			}],
			"version": "0.1.0",
			"description": "Create Friend Links. Inspired by spinfal's Enmity plugin. /friendinvites",
			"github": "https://github.com/riolubruh/FriendInvites",
			"github_raw": "https://raw.githubusercontent.com/riolubruh/FriendInvites/main/FriendInvites.plugin.js"
		},
		"main": "FriendInvites.plugin.js"
	};

	return !global.ZeresPluginLibrary ? class {
		constructor() {
			this._config = config;
		}
		getName() {
			return config.info.name;
		}
		getAuthor() {
			return config.info.authors.map(a => a.name).join(", ");
		}
		getDescription() {
			return config.info.description;
		}
		getVersion() {
			return config.info.version;
		}
		load() {
			BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
				confirmText: "Download Now",
				cancelText: "Cancel",
				onConfirm: () => {
					require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
						if (error) return require("electron").shell.openExternal("https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
						await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
					});
				}
			});
		}
		start() { }
		stop() { }
	} : (([Plugin, Api]) => {
		const plugin = (Plugin, Api) => {
			const {
				Patcher,
				DiscordModules,
				Settings,
				Toasts,
				PluginUtilities
			} = Api;
			return class FriendInvites extends Plugin {
				
				friendInvites(){
					let currentChannelGlobal = BdApi.findModuleByProps("getLastChannelFollowingDestination").getChannelId();
					const friendInvitesModule = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("createFriendInvite"));
					const SlashCommandStore = ZLibrary.WebpackModules.getModule(
						(m) => m?.Kh?.toString?.()?.includes?.("BUILT_IN_TEXT")
					);
					try{
						BdApi.Patcher.after("FriendInvites", SlashCommandStore, "Kh", (_, args, res) => {
						  if (args[0] !== 1) return;
						  res.push({
							applicationId: "-1",
							name: "friendinvites",
							displayName: "friendinvites",
							displayDescription: "List all friendinvites commands",
							description: "List commands",
							id: (-1 - res.length).toString(),
							type: 1,
							target: 1,
							options: [],
							execute: () => {
								//Help command
								DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, "Command List:\n/friendinvites create\n/friendinvites revoke\n/friendinvites list");
							}
						  },{
							applicationId: "-1",
							name: "friendinvites create",
							displayName: "friendinvites create",
							displayDescription: "Create a friend invite",
							description: "Create a friend invite",
							id: (-1 - res.length).toString(),
							type: 1,
							target: 1,
							options: [],
							execute: () => {
								//Create friend link
								let newFriendInvite = friendInvitesModule.createFriendInvite().then(function(e){
									inviteList = "Invite URL: discord.gg/ " + e.code + "\nExpires: " + e.expires_at + "\nUses: " + e.uses + "/" + e.max_uses;
									DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, inviteList);
								});
								return
							}
						  },{
							applicationId: "-1",
							name: "friendinvites revoke",
							displayName: "friendinvites revoke",
							displayDescription: "Delete all active friend invites",
							description: "Delete all active friend invites",
							id: (-1 - res.length).toString(),
							type: 1,
							target: 1,
							options: [],
							execute: () => {
								//Delete all friend links
								friendInvitesModule.revokeFriendInvites();
								DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, "Deleted all friend invites.");
								return
							}
						  },{
							applicationId: "-1",
							name: "friendinvites list",
							displayName: "friendinvites list",
							displayDescription: "List all active friend invites",
							description: "List all active friend invites",
							id: (-1 - res.length).toString(),
							type: 1,
							target: 1,
							options: [],
							execute: () => {
								//List active friend links
								var inviteList = "";
								friendInvitesModule.getAllFriendInvites().then(function(result){result.forEach(function (e){
									inviteList = "Invite URL: discord.gg/ " + e.code + "\nExpires: " + e.expires_at + "\nUses: " + e.uses + "/" + e.max_uses;
									DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, inviteList);
								})});
								friendInvitesModule.getAllFriendInvites().then(function(result){
									if(result.length == 0) DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, "No invites");
								});
								return
							}
						  });
						});
					}catch(err){
						console.error(err);
						console.log("Using fallback method");
						BdApi.Patcher.before("FriendInvites", DiscordModules.MessageActions, "sendMessage", (_, [channelId, msg]) => {
						if(msg.content.toLowerCase().startsWith("/friendinvites create")){
							//Create friend link
							let newFriendInvite = friendInvitesModule.createFriendInvite().then(function(e){
								inviteList = "Invite URL: discord.gg/ " + e.code + "\nExpires: " + e.expires_at + "\nUses: " + e.uses + "/" + e.max_uses;
								DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, inviteList);
							});	
							channelId = undefined;
							msg.content = undefined;
							return
						}
						if(msg.content.toLowerCase().startsWith("/friendinvites revoke") || msg.content.toLowerCase().startsWith("/friendinvites delete") || msg.content.toLowerCase().startsWith("/friendinvites deleteall") || msg.content.toLowerCase().startsWith("/friendinvites revokeall")){
							//Delete all friend links
							friendInvitesModule.revokeFriendInvites();
							DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, "Deleted all friend invites.");
							channelId = undefined;
							msg.content = undefined;
							return
						}
						if(msg.content.toLowerCase().startsWith("/friendinvites list")){
							//List active friend links
							var inviteList = "";
							friendInvitesModule.getAllFriendInvites().then(function(result){result.forEach(function (e){
								inviteList = "Invite URL: discord.gg/ " + e.code + "\nExpires: " + e.expires_at + "\nUses: " + e.uses + "/" + e.max_uses;
								DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, inviteList);
							})});
							friendInvitesModule.getAllFriendInvites().then(function(result){
								if(result.length == 0) DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, "No invites");
							});
							channelId = undefined;
							msg.content = undefined;
							return
						}
						if(msg.content.toLowerCase().startsWith("/friendinvites")){
							//Help command
							DiscordModules.MessageActions.sendBotMessage(currentChannelGlobal, "Command List:\n/friendinvites create\n/friendinvites revoke\n/friendinvites list");
							channelId = undefined;
							msg.content = undefined;
							return
						}
						});
					}
				}
				
				
				onStart() {
					this.friendInvites();
				}

				onStop() {
					BdApi.Patcher.unpatchAll("FriendInvites");
				}
			};
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/