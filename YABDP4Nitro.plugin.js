/**
 * @name YABDP4Nitro
 * @author Riolubruh
 * @version 4.2.4
 * @source https://github.com/riolubruh/YABDP4Nitro
 * @updateUrl https://raw.githubusercontent.com/riolubruh/YABDP4Nitro/main/YABDP4Nitro.plugin.js
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
			"name": "YABDP4Nitro",
			"authors": [{
				"name": "Riolubruh",
				"discord_id": "359063827091816448",
				"github_username": "riolubruh"
			}],
			"version": "4.2.4",
			"description": "Unlock all screensharing modes, and use cross-server & GIF emotes!",
			"github": "https://github.com/riolubruh/YABDP4Nitro",
			"github_raw": "https://raw.githubusercontent.com/riolubruh/YABDP4Nitro/main/YABDP4Nitro.plugin.js"
		},
		"main": "YABDP4Nitro.plugin.js"
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
			return class YABDP4Nitro extends Plugin {
				defaultSettings = {
					"emojiSize": 64,
					"screenSharing": true,
					"emojiBypass": true,
					"ghostMode": true,
					"emojiBypassForValidEmoji": true,
					"PNGemote": true,
					"uploadEmotes": false,
					"CustomFPSEnabled": false,
					"CustomFPS": 75,
					"ResolutionEnabled": false,
					"CustomResolution": 0,
					"CustomBitrateEnabled": false,
					"minBitrate": -1,
					"maxBitrate": -1,
					"targetBitrate": -1,
					"voiceBitrate": 128,
					"audioSourcePID": 0,
					"CameraSettingsEnabled": false,
					"CameraWidth": 1920,
					"CameraHeight": 1080,
					"ResolutionSwapper": false,
					"stickerBypass": true,
					"profileV2": true
				};
				settings = PluginUtilities.loadSettings(this.getName(), this.defaultSettings);
				getSettingsPanel() {
					return Settings.SettingPanel.build(_ => this.saveAndUpdate(), ...[
						new Settings.SettingGroup("Screen Share Features").append(...[
							new Settings.Switch("High Quality Screensharing", "1080p/source @ 60fps screensharing. There is no reason to disable this.", this.settings.screenSharing, value => this.settings.screenSharing = value),
							new Settings.Switch("Custom Screenshare Resolution", "Choose your own screen share resolution!", this.settings.ResolutionEnabled, value => this.settings.ResolutionEnabled = value),
							new Settings.Textbox("Resolution", "The custom resolution you want (in pixels)", this.settings.CustomResolution,
								value => {
									value = parseInt(value, 10);
									this.settings.CustomResolution = value;
								}),
							new Settings.Switch("Custom Screenshare FPS", "Choose your own screen share FPS!", this.settings.CustomFPSEnabled, value => this.settings.CustomFPSEnabled = value),
							new Settings.Textbox("FPS", "", this.settings.CustomFPS,
								value => {
									value = parseInt(value, 10);
									this.settings.CustomFPS = value;
								}),
								new Settings.Switch("Stream Settings Quick Swapper", "Adds a button that will let you switch your resolution quickly!", this.settings.ResolutionSwapper, value => this.settings.ResolutionSwapper = value),
								new Settings.Switch("Custom Bitrate", "Choose the bitrate for your streams!", this.settings.CustomBitrateEnabled, value => this.settings.CustomBitrateEnabled = value),
								new Settings.Textbox("Minimum Bitrate", "The minimum bitrate (in kbps).", this.settings.minBitrate,
								value => {
									value = parseFloat(value);
									this.settings.minBitrate = value;
								}),
								new Settings.Textbox("Maximum Bitrate", "The maximum bitrate (in kbps).", this.settings.maxBitrate,
								value => {
									value = parseFloat(value);
									this.settings.maxBitrate = value;
								}),
								new Settings.Textbox("Target Bitrate", "The target bitrate (in kbps).", this.settings.targetBitrate,
								value => {
									value = parseFloat(value);
									this.settings.targetBitrate = value;
								}),
								new Settings.Textbox("Voice Audio Bitrate", "Allows you to change the bitrate to whatever you want. Does not allow you to go over the voice channel's set bitrate but it does allow you to go much lower. (bitrate in kbps).", this.settings.voiceBitrate,
								value => {
									value = parseFloat(value);
									this.settings.voiceBitrate = value;
								}),
								new Settings.Textbox("Screen Share Audio Source", "[Advanced] Set this number to the PID of an application to stream that application's audio! Applies upon updating the screen share quality/window. (Set to 0 to disable)", this.settings.audioSourcePID,
								value => {
									value = parseInt(value);
									this.settings.audioSourcePID = value;
								})
						]),
						new Settings.SettingGroup("Emojis").append(
							new Settings.Switch("Nitro Emotes Bypass", "Enable or disable using the emoji bypass.", this.settings.emojiBypass, value => this.settings.emojiBypass = value),
							new Settings.Slider("Size", "The size of the emoji in pixels. 48 is the default.", 16, 128, this.settings.emojiSize, size => this.settings.emojiSize = size, { markers: [16, 32, 48, 64, 80, 96, 112, 128], stickToMarkers: true }),
							new Settings.Switch("Ghost Mode", "Abuses ghost message bug to hide the emoji url.", this.settings.ghostMode, value => this.settings.ghostMode = value),
							new Settings.Switch("Don't Use Emote Bypass if Emote is Unlocked", "Disable to use emoji bypass even if bypass is not required for that emoji.", this.settings.emojiBypassForValidEmoji, value => this.settings.emojiBypassForValidEmoji = value),
							new Settings.Switch("Use PNG instead of WEBP", "Use the PNG version of emoji for higher quality!", this.settings.PNGemote, value => this.settings.PNGemote = value),
							new Settings.Switch("Upload Emotes as Images", "Upload emotes as image(s) after message is sent. (Overrides linking emotes) [Warning: this breaks shit currently, such as replies. Use at your own risk.]", this.settings.uploadEmotes, value => this.settings.uploadEmotes = value),
							new Settings.Switch("Sticker Bypass", "Enable or disable using the sticker bypass.", this.settings.stickerBypass, value => this.settings.stickerBypass = value)
						),
						new Settings.SettingGroup("Camera [Beta]").append(
						new Settings.Switch("Enabled", this.settings.CameraSettingsEnabled, value => this.settings.CameraSettingsEnabled = value),
						new Settings.Textbox("Camera Resolution Width", "Camera Resolution Width in pixels. (Set to -1 to disable)", this.settings.CameraWidth,
								value => {
									value = parseInt(value);
									this.settings.CameraWidth = value;
								}),
						new Settings.Textbox("Camera Resolution Height", "Camera Resolution Height in pixels. (Set to -1 to disable)", this.settings.CameraHeight,
							value => {
								value = parseInt(value);
								this.settings.CameraHeight = value;
							})
						),
						new Settings.SettingGroup("Miscellaneous").append(
							new Settings.Switch("Profile Accents", "When enabled, you will see (almost) all users with the new Nitro-exclusive look for profiles (the sexier look). When disabled, the default behavior is used. Does not allow you to update your profile accent.", this.settings.profileV2, value => this.settings.profileV2 = value)
						)
					])
				}


				async UploadEmote(url, channelIdLmao, msg, emoji, runs) {
					const Uploader = BdApi.findModuleByProps('instantBatchUpload');
					if(url.includes("stickers")){

						const fetchoptions = {
							method: 'GET',
							mode: 'cors',
							headers: {
							'origin':'discord.com'
							}
						};
						let blob = await fetch(("https://cors-anywhere.riolubruh.repl.co/" + url),fetchoptions).then(r => r.blob());
						await blob;
							
						await Uploader.upload({
							channelId: channelIdLmao,
							file: new File([blob], "sticker", {type: "image/png"}),
							draftType: 0,
							message: { content: undefined, invalidEmojis: [], tts: false, channel_id: channelIdLmao},
							hasSpoiler: false,
							filename: "sticker.png"
						});
					}
				
					var extension = ".gif";
					if(!url.includes("stickers")){
						if (!emoji.animated) {
							extension = ".png";
							if (!this.settings.PNGemote) {
								extension = ".webp";
							}
						}
						let file = await fetch(url).then(r => r.blob()).then(blobFile => new File([blobFile], "emote"))
						
						if(runs > 1){
							await Uploader.upload({
							channelId: channelIdLmao,
							file: new File([file], emoji.name),
							draftType: 0,
							message: { content: undefined, invalidEmojis: [], tts: false, channel_id: channelIdLmao },
							hasSpoiler: false,
							filename: emoji.name + extension
						});
						return
						}
					
					await Uploader.upload({
							channelId: channelIdLmao,
							file: new File([file], emoji.name),
							draftType: 0,
							message: { content: msg[1].content, invalidEmojis: [], tts: false, channel_id: channelIdLmao},
							hasSpoiler: false,
							filename: emoji.name + extension
						})
					};
				}

				emojiBypassForValidEmoji(emoji, currentChannelId) { //Made into a function to save space and clean up
					if (this.settings.emojiBypassForValidEmoji) {
						if ((DiscordModules.SelectedGuildStore.getLastSelectedGuildId() == emoji.guildId) && !emoji.animated && ((DiscordModules.ChannelStore.getChannel(currentChannelId).type <= 0) == true)) {
							return true
						}
					}
				}

				async customVideoSettings() {
					const StreamButtons = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("RESOLUTION_SOURCE"));
					let b = BdApi.Webpack.getBulk({filter: ((BdApi.Webpack.Filters.byStrings("audioSSRC"))), first: true});
					let videoOptionFunctions = b[0].prototype;
					
					BdApi.Patcher.before("YABDP4Nitro", videoOptionFunctions, "updateVideoQuality", (e) => {
						//console.log(e);
						if(this.settings.ResolutionEnabled){ //If Custom Resolution is enabled.
						if(e.videoQualityManager.qualityOverwrite.capture != undefined){
						e.videoQualityManager.options.videoCapture.height = this.settings.CustomResolution;
						e.videoQualityManager.options.videoBudget.height = this.settings.CustomResolution;
						e.videoQualityManager.qualityOverwrite.capture.height = this.settings.CustomResolution;
						e.videoQualityManager.qualityOverwrite.capture.width = (this.settings.CustomResolution * (16/9));
						e.videoStreamParameters[0].maxResolution.height = this.settings.CustomResolution;
						e.videoStreamParameters[0].maxResolution.width = (this.settings.CustomResolution * (16/9));
						e.videoQualityManager.options.videoCapture.height = this.settings.CustomResolution;
						e.videoQualityManager.options.videoCapture.width = (this.settings.CustomResolution * (16/9));
						e.videoQualityManager.options.videoBudget.height = this.settings.CustomResolution;
						e.videoQualityManager.options.videoBudget.width = (this.settings.CustomResolution * (16/9));
						
						if(this.settings.CustomFPSEnabled){ //If Custom FPS is enabled.
							e.videoStreamParameters[0].maxFrameRate = this.settings.CustomFPS;
							e.videoQualityManager.qualityOverwrite.capture.framerate = this.settings.CustomFPS;
						}}}
					});
					
					if(BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings("updateRemoteWantsFramerate"))){
						let L = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byStrings("updateRemoteWantsFramerate")).prototype;
						//console.log(L);
						if(L){
							BdApi.Patcher.instead("YABDP4Nitro", L, "updateRemoteWantsFramerate", () => {
							return
						});
						}
						return
					}else{
						let R = await BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings("updateRemoteWantsFramerate"));
						if(R){
							BdApi.Patcher.instead("YABDP4Nitro", R, "updateRemoteWantsFramerate", () => {
							return
						});
						}
					}
				}

				saveAndUpdate() {
					PluginUtilities.saveSettings(this.getName(), this.settings);
					//console.log("saveAndUpdate running");
					if (this.settings.emojiBypass) {
						//Upload Emotes
						if (this.settings.uploadEmotes) {
							Patcher.unpatchAll(DiscordModules.MessageActions);
							BdApi.Patcher.unpatchAll("YABDP4Nitro", DiscordModules.MessageActions);
							BdApi.Patcher.instead("YABDP4Nitro", DiscordModules.MessageActions, "sendMessage", (_, b, send) => {
								var currentChannelId = BdApi.findModuleByProps("getLastChannelFollowingDestination").getChannelId();
								var runs = 0;
								b[1].validNonShortcutEmojis.forEach(emoji => {
									if (emoji.url.startsWith("/assets/")) return;
									if (this.settings.PNGemote) {
										emoji.url = emoji.url.replace('.webp', '.png');
									}
									if (this.emojiBypassForValidEmoji(emoji, currentChannelId)) { return }
									runs++;
									emoji.url = emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize}`
									b[1].content = b[1].content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, "");
									this.UploadEmote(emoji.url, currentChannelId, b, emoji, runs);
									return
								});
								if ((b[1].content !== undefined && b[1].content != "") && runs == 0) {
									send(b[0], b[1], b[2], b[3]);
								}
								return
							});
						}
						//If Ghost Mode is enabled do this shit
						if (this.settings.ghostMode && !this.settings.uploadEmotes) {
							//console.log("ghostmoderun");
							BdApi.Patcher.unpatchAll("YABDP4Nitro", DiscordModules.MessageActions);
							Patcher.unpatchAll(DiscordModules.MessageActions);
							BdApi.Patcher.before("YABDP4Nitro", DiscordModules.MessageActions, "sendMessage", (_, [, msg]) => {
								//console.log(msg);
								var currentChannelId = BdApi.findModuleByProps("getLastChannelFollowingDestination").getChannelId();
								msg.validNonShortcutEmojis.forEach(emoji => {
									if (emoji.url.startsWith("/assets/")) return;
									if (this.settings.PNGemote) {
										emoji.url = emoji.url.replace('.webp', '.png')
									}
									if (this.emojiBypassForValidEmoji(emoji, currentChannelId)) {
										return
									}
									//if no ghost mode required
									if (msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, "") == "") {
										msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `)
										return;
									}
									let ghostmodetext = "||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|| _ _ _ _ _ "
									if (msg.content.includes(ghostmodetext)) {
										if (msg.content.includes(("https://embed.rauf.wtf/?&image=" + emoji.url.split("?")[0]))) {//Duplicate emoji handling (second duplicate)
											msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + "https://test.rauf.workers.dev/?&image=" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `
											return
										}
										if (msg.content.includes(emoji.url.split("?")[0])) { //Duplicate emoji handling (first duplicate)
											msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + "https://embed.rauf.wtf/?&image=" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `
											return
										}
										msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `//, console.log(msg.content), console.log("Multiple emojis")
										return
									}
									msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += ghostmodetext + "\n" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `//, console.log(msg.content), console.log("First emoji code ran")
									return
								})
							});
						}
						else
						//Original method
						if (!this.settings.ghostMode && !this.settings.uploadEmotes) {
							BdApi.Patcher.unpatchAll("YABDP4Nitro", DiscordModules.MessageActions)
							Patcher.unpatchAll(DiscordModules.MessageActions)
							//console.log("Classic Method (No Ghost)")
							BdApi.Patcher.before("YABDP4Nitro", DiscordModules.MessageActions, "sendMessage", (_, [, msg]) => {
								var currentChannelId = BdApi.findModuleByProps("getLastChannelFollowingDestination").getChannelId();
								msg.validNonShortcutEmojis.forEach(emoji => {
									if (this.settings.PNGemote) {
										emoji.url = emoji.url.replace('.webp', '.png')
									}
									if (emoji.url.startsWith("/assets/")) return;
									if (this.emojiBypassForValidEmoji(emoji, currentChannelId)) { return }
									if (msg.content.includes(("https://embed.rauf.wtf/?&image=" + emoji.url.split("?")[0]))) {//Duplicate emoji handling (second duplicate)
										msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + "https://test.rauf.workers.dev/?&image=" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `
										return
									}
									if (msg.content.includes(emoji.url.split("?")[0])) { //Duplicate emoji handling (first duplicate)
										msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, ""), msg.content += " " + "https://embed.rauf.wtf/?&image=" + emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `
										return
									}
									msg.content = msg.content.replace(`<${emoji.animated ? "a" : ""}${emoji.allNamesString.replace(/~\d/g, "")}${emoji.id}>`, emoji.url.split("?")[0] + `?size=${this.settings.emojiSize}&size=${this.settings.emojiSize} `)//, console.log(msg.content), console.log("no ghost")
								})
							});
							//editing message (in classic mode)
							BdApi.Patcher.before("YABDP4Nitro", DiscordModules.MessageActions, "editMessage", (_, obj) => {
								let msg = obj[2].content
								if (msg.search(/\d{18}/g) == -1) return;
								if (msg.includes(":ENC:")) return; //Fix jank with editing SimpleDiscordCrypt encrypted messages.
								msg.match(/<a:.+?:\d{18}>|<:.+?:\d{18}>/g).forEach(idfkAnymore => {
									obj[2].content = obj[2].content.replace(idfkAnymore, `https://cdn.discordapp.com/emojis/${idfkAnymore.match(/\d{18}/g)[0]}?size=${this.settings.emojiSize}`)
								})
							});
						}
					}
					if (!this.settings.emojiBypass) Patcher.unpatchAll(DiscordModules.MessageActions);
					
					//Apply custom screen share options
					if (this.settings.ResolutionEnabled) this.customVideoSettings();
					
					this.videoQualityModule(); //Bitrate Module
					this.audioShare(); //Audio PID module
					if(document.getElementById("qualityButton")) document.getElementById("qualityButton").remove();
					if(document.getElementById("qualityMenu")) document.getElementById("qualityMenu").remove();
					if(document.getElementById("qualityInput")) document.getElementById("qualityInput").remove();
					this.buttonCreate(); //Fast Quality Button and Menu
					document.getElementById("qualityInput").addEventListener("input", this.updateQuick);
					document.getElementById("qualityInputFPS").addEventListener("input", this.updateQuick);
					if(!this.settings.ResolutionSwapper){
						if(document.getElementById("qualityButton") != undefined) document.getElementById("qualityButton").style.display = 'none'
						if(document.getElementById("qualityMenu") != undefined) document.getElementById("qualityMenu").style.display = 'none'
					}
					
					if(this.settings.stickerBypass){
						DiscordModules.UserStore.getCurrentUser().premiumType = 2;
						this.stickerSending();
					}
					if(!this.settings.stickerBypass && this.settings.emojiBypass){
						DiscordModules.UserStore.getCurrentUser().premiumType = 1;
					}
					if(!this.settings.emojiBypass && !this.settings.stickerBypass){
						DiscordModules.UserStore.getCurrentUser().premiumType = undefined;
					}
					
					let permissions = BdApi.findModuleByProps("canUseCustomBackgrounds");
					if(this.settings.profileV2 == true){
					BdApi.Patcher.instead("YABDP4Nitro", permissions, "isPremiumAtLeast", () => {
						return true;
					})};
					
				} //End of saveAndUpdate
				
				updateQuick(){
					parseInt(document.getElementById("qualityInput").value);
					BdApi.getData("YABDP4Nitro", "settings").CustomResolution = parseInt(document.getElementById("qualityInput").value);
					parseInt(document.getElementById("qualityInputFPS").value);
					BdApi.getData("YABDP4Nitro", "settings").CustomFPS = parseInt(document.getElementById("qualityInputFPS").value);
				}
				
				audioShare(){
					let shareModule = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byPrototypeFields("setSoundshareSource")).prototype;
					//console.log(shareModule);
					if(this.settings.audioSourcePID != 0){
					BdApi.Patcher.before("YABDP4Nitro", shareModule, "setSoundshareSource", (a,b) => {
						if(this.settings.audioSourcePID == 0){
							return
						}
						b[0] = this.settings.audioSourcePID;
					});
					}
				}
				
				videoQualityModule(){ //Custom Bitrates
					let b = BdApi.Webpack.getBulk({filter: ((BdApi.Webpack.Filters.byStrings("audioSSRC"))), first: true});
					let videoOptionFunctions = b[0].prototype;
					if(this.settings.CustomBitrateEnabled){
						BdApi.Patcher.before("YABDP4Nitro", videoOptionFunctions, "updateVideoQuality", (e) => {
							//Minimum Bitrate
							e.framerateReducer.sinkWants.qualityOverwrite.bitrateMin = (this.settings.minBitrate * 1000);
							e.videoQualityManager.qualityOverwrite.bitrateMin = (this.settings.minBitrate * 1000);
							
							
							//Maximum Bitrate
							e.framerateReducer.sinkWants.qualityOverwrite.bitrateMax = (this.settings.maxBitrate * 1000);
							e.videoQualityManager.qualityOverwrite.bitrateMax = (this.settings.maxBitrate * 1000);
							
							
							//Target Bitrate
							e.framerateReducer.sinkWants.qualityOverwrite.bitrateTarget = (this.settings.targetBitrate * 1000);
							e.videoQualityManager.qualityOverwrite.bitrateTarget = (this.settings.targetBitrate * 1000);
							
							//Bonus: Audio Bitrate
							e.voiceBitrate = (this.settings.voiceBitrate * 1000);
						});
					}
					if(this.settings.CustomFPSEnabled){
						BdApi.Patcher.before("YABDP4Nitro", videoOptionFunctions, "updateVideoQuality", (e) => {
							e.videoQualityManager.options.videoBudget.framerate = this.settings.CustomFPS;
							e.videoQualityManager.options.videoCapture.framerate = this.settings.CustomFPS;
						});
					}
					if(this.settings.CameraSettingsEnabled){ //If Camera Patching On
						
						BdApi.Patcher.after("YABDP4Nitro", videoOptionFunctions, "updateVideoQuality", (e) => {
							
							//Is the camera active and screen share not enabled?
							if(e.stats !== undefined){ //Error prevention
							if(e.stats.camera !== undefined){
							if(e.videoStreamParameters[0] !== undefined){
							
							e.videoStreamParameters[0].maxPixelCount = (this.settings.CameraHeight * this.settings.CameraWidth);
							
							
							if(e.videoStreamParameters[0].maxResolution.height){
							if(this.settings.CameraHeight >= 0){ //Height in pixels
								e.videoStreamParameters[0].maxResolution.height = this.settings.CameraHeight;
							}}
							if(e.videoStreamParameters[0].maxResolution.width){
							if(this.settings.CameraWidth >= 0){ //Width in pixels
								e.videoStreamParameters[0].maxResolution.width = this.settings.CameraWidth;
							}}
							}
							if(e.videoStreamParameters[1] !== undefined){
								if(this.settings.CameraHeight >= 0){ //Height in pixels
									e.videoStreamParameters[1].maxResolution.height = this.settings.CameraHeight;
								}
								
								if(this.settings.CameraWidth >= 0){ //Width in pixels
									e.videoStreamParameters[1].maxResolution.width = this.settings.CameraWidth;
								}
							e.videoStreamParameters[1].maxPixelCount = (this.settings.CameraHeight * this.settings.CameraWidth);
							}
							//---- VQM Bypasses ----//
							if(this.settings.CameraWidth >= 0){
								e.videoQualityManager.options.videoCapture.width = this.settings.CameraWidth;
								e.videoQualityManager.options.videoBudget.width = this.settings.CameraWidth;
							}
							if(this.settings.CameraHeight >= 0){
								e.videoQualityManager.options.videoCapture.height = this.settings.CameraHeight;
								e.videoQualityManager.options.videoBudget.height = this.settings.CameraHeight;
							}
							e.videoQualityManager.ladder.pixelBudget = (this.settings.CameraHeight * this.settings.CameraWidth);
							 
							}
							}
						});	
					}
				}
				
				buttonCreate(){
					var qualityButton = document.createElement('button');
					qualityButton.id = 'qualityButton';
					qualityButton.innerHTML = 'Quality';
					qualityButton.style.zIndex = "2";
					qualityButton.style.bottom = "-30%";
					qualityButton.style.left = "-60%";
					qualityButton.style.height = "14px";
					qualityButton.style.width = "50px";
					qualityButton.className = "buttonColor-3bP3fX button-f2h6uQ lookFilled-yCfaCM colorBrand-I6CyqQ"
					try{
						document.getElementsByClassName("container-YkUktl")[0].appendChild(qualityButton)
						}catch(err){
						console.warn("YABDP4Nitro: What the fuck happened? During buttonCreate()");
						console.log(err);
					};
					//document.body.appendChild(qualityButton);

					var qualityMenu = document.createElement('div');
					qualityMenu.id = 'qualityMenu';
					qualityMenu.style.display = 'none';
					qualityMenu.style.position = "absolute";
					qualityMenu.style.zIndex = "1";
					qualityMenu.style.bottom = "140%";
					qualityMenu.style.left = "-45%";
					qualityMenu.style.height = "20px";
					qualityMenu.style.width = "100px";
					document.getElementById("qualityButton").appendChild(qualityMenu);

					var qualityInput = document.createElement('input');
					qualityInput.id = 'qualityInput';
					qualityInput.type = 'text';
					qualityInput.placeholder = 'Resolution';
					qualityInput.style.width = "33%";
					qualityInput.style.zIndex = "1";
					qualityInput.value = this.settings.CustomResolution;
					qualityMenu.appendChild(qualityInput);
					
					var qualityInputFPS = document.createElement('input');
					qualityInputFPS.id = 'qualityInputFPS';
					qualityInputFPS.type = 'text';
					qualityInputFPS.placeholder = 'FPS';
					qualityInputFPS.style.width = "33%";
					qualityInputFPS.style.zIndex = "1";
					qualityInputFPS.value = this.settings.CustomFPS;
					qualityMenu.appendChild(qualityInputFPS);
					
					qualityButton.onclick = function() {
					  if (qualityMenu.style.display === 'none') {
						qualityMenu.style.display = 'block';
					  } else {
						qualityMenu.style.display = 'none';
					  }
					}
				}
				
				async stickerSending(){
					BdApi.Patcher.instead("YABDP4Nitro", DiscordModules.MessageActions, "sendStickers", (_,b) => {
						let stickerID = b[1][0];
						let stickerURL = "cdn.discordapp.com/stickers/" + stickerID + ".png?size=4096&size=4096"
						this.UploadEmote(stickerURL, b[0]);
					});
				}
				
				friendInvites(){
					let friendInvitesModule = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("createFriendInvite"));
					console.log(friendInvitesModule);
				}
				
				onStart() {
					this.friendInvites();
					this.originalNitroStatus = DiscordModules.UserStore.getCurrentUser().premiumType;
					DiscordModules.UserStore.getCurrentUser().premiumType = 2;
					this.saveAndUpdate();
				}

				onStop() {
					DiscordModules.UserStore.getCurrentUser().premiumType = this.originalNitroStatus;
					Patcher.unpatchAll();
					BdApi.Patcher.unpatchAll("YABDP4Nitro");
					if(document.getElementById("qualityButton")) document.getElementById("qualityButton").remove();
					if(document.getElementById("qualityMenu")) document.getElementById("qualityMenu").remove();
					if(document.getElementById("qualityInput")) document.getElementById("qualityInput").remove();
				}
			};
		};
		return plugin(Plugin, Api);
	})(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/