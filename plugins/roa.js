'use strict';

const cmdChar = Config.commandCharacter;

/**
 * @param {Room | string} room
 * @return {AnyObject}
 */
function getDatabase(room) {
	if (room instanceof Rooms.Room) room = room.id;
	if (!Storage.databases[room]) Storage.databases[room] = {};
	let database = Storage.databases[room];
	if (!database.hosts) database.hosts = [];
	if (!database.tour) database.tour = {"addedRules": [], "removedRules": [], "banlist": [], "unbanlist": []};
	if (!database.samples) database.samples = Object.create(null);
	return database;
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	addsample: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This can only be used in rooms.");
		if (!user.canPerform(room, '%')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}addsample __[tier]__, __[link]__`);
		target = target.trim();
		let targets = target.split(',');
		let database = getDatabase(room.id).samples;
		if (!targets[0]) return this.say(`Correct syntax: ${cmdChar}addsample __[tier]__, __[link]__`);
		let tZeroId = Tools.toId(targets[0]);
		if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}addsample __[tier]__, __[link]__`);
		if (!targets[1].trim().startsWith('http')) return this.say("Please provide a valid link.");
		if (!(tZeroId in database)) {
			database[tZeroId] = [];
			this.say(`Sample team storage for ${targets[0].trim()} created.`);
		}
		let index = database[tZeroId].findIndex(/**@param {string} tier */ tier => Tools.toId(tier) === Tools.toId(targets[1]));
		if (index >= 0) return this.say("That link is already in the database.");
		database[tZeroId].push(targets[1].trim());
		Storage.exportDatabase(room.id);
		return this.say("Sample team added.");
	},
	removesample: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This can only be used in rooms.");
		if (!user.canPerform(room, '%')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}removesample __[tier]__, __[link]__`);
		target = target.trim();
		let targets = target.split(',');
		let database = getDatabase(room.id).samples;
		if (!targets[0]) return this.say(`Correct syntax: ${cmdChar}removesample __[tier]__, __[link]__`);
		let tZeroId = Tools.toId(targets[0]);
		if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}removesample __[tier]__, __[link]__`);
		if (!targets[1].trim().startsWith('http')) return this.say("Please provide a valid link.");
		if (!(tZeroId in database)) return this.say(`The format ${targets[0].trim()} wasn't found.`);
		let index = database[tZeroId].findIndex(/**@param {string} link */ link => Tools.toId(link) === Tools.toId(targets[1]));
		if (index < 0) return this.say("That link isn't in the database.");
		database[tZeroId].slice(index, 1);
		Storage.exportDatabase(room.id);
		return this.say("Sample team removed.");
	},
	listsamples: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This can only be used in rooms.");
		if (!user.canPerform(room, '%')) return this.say("You don't have permission to do that.");
		target = target.trim();
		let database = getDatabase(room.id).samples;
		if (!target) {
			if (!database) return this.say("There are currently no formats.");
			let dbList = [];
			for (let i in database) {
				dbList.push(Tools.toId(database[i]));
			}
			let prettifiedDbList = "Sample team formats for " + room.id + ":\n\n" + dbList.map(
				/**
				 * @param {string} db
				 * @param {number} index
				 */
				(db, index) => (index + 1) + ": " + db
			).join("\n");
			Tools.uploadToHastebin(prettifiedDbList, /**@param {string} hastebinUrl */ hastebinUrl => {
				this.say("Sample team formats: " + hastebinUrl);
			});
		} else {
			let tZeroId = Tools.toId(target);
			if (!(tZeroId in database)) return this.say(`The format ${target.trim()} wasn't found.`);
			if (!database[tZeroId].length) return this.say(`There are currently no sample teams for the format ${tZeroId} in the room ${room.id}.`);
			let prettifiedTeamList = "Sample teams for format " + tZeroId + " for " + room.id + ":\n\n" + database[tZeroId].map(
				/**
				 * @param {string} team
				 * @param {number} index
				 */
				(team, index) => (index + 1) + ": " + team
			).join("\n");
			Tools.uploadToHastebin(prettifiedTeamList, /**@param {string} hastebinUrl */ hastebinUrl => {
				this.say("Sample team list: " + hastebinUrl);
			});
		}
	},
	samples: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This can only be used in rooms.");
		if (!user.canPerform(room, '%')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}listsamples <__[tier]__>`);
		target = target.trim();
		let database = getDatabase(room.id).samples;
		let tZeroId = Tools.toId(target);
		if (!(tZeroId in database)) return this.say(`The format ${target.trim()} wasn't found.`);
		if (!database[tZeroId].length) return this.say(`There are currently no sample teams for the format ${tZeroId} in the room ${room.id}.`);
		if (database[tZeroId].length < 2) {
			return this.say(`Sample teams for __${tZeroId}__: ${database[tZeroId][0]}`);
		} else {
			if (Users.self.hasRank(room, '*')) {
				let buf = `<h4>Sample teams for ${tZeroId}:</h4>`;
				buf += `<ul>`;
				for (const link of database[tZeroId]) {
					buf += `<li><a href="${link}">${link}</a></li>`;
				}
				buf += `</ul>`;
				return this.sayHtml(buf);
			} else {
				let prettifiedTeamList = "Sample teams for " + tZeroId + ":\n\n" + database[tZeroId].map(
					/**
					 * @param {string} team
					 * @param {number} index
					 */
					(team, index) => (index + 1) + ": " + team
				).join("\n");
				Tools.uploadToHastebin(prettifiedTeamList, /**@param {string} hastebinUrl */ hastebinUrl => {
					this.say("Sample teams for " + tZeroId + ": " + hastebinUrl);
				});
			}
		}
	},
	addhost: 'host',
	host: function (target, room, user) {
		if (!user.canPerform('ruinsofalph', '%')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}host __[user]__`);
		target = target.trim();
		let hosts = getDatabase('roa').hosts;
		if (target.length > 18) return this.say("Please provide a real username.");
		let index = hosts.findIndex(/**@param {string} host */ host => Tools.toId(host) === Tools.toId(target));
		if (index >= 0) return this.say("That user is already a host.");
		hosts.push(Tools.toId(target));
		Storage.exportDatabase('roa');
		return this.say(`User ${target} successfully added as a host.`);
	},
	dehost: 'unhost',
	unhost: function (target, room, user) {
		// @ts-ignore
		if (!user.canPerform('ruinsofalph', '%')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}host __[user]__`);
		target = target.trim();
		let hosts = getDatabase('roa').hosts;
		if (target.length > 18) return this.say("Please provide a real username.");
		let index = hosts.findIndex(/**@param {string} host */ host => Tools.toId(host) === Tools.toId(target));
		if (index < 0) return this.say("That user is not a host.");
		hosts.splice(index, 1);
		Storage.exportDatabase('roa');
		return this.say(`User ${target} successfully dehosted.`);
	},
	clearhosts: function (target, room, user) {
		// @ts-ignore
		if (!user.canPerform('ruinsofalph', '@')) return this.say("You don't have permission to do that.");
		target = target.trim();
		getDatabase('roa').hosts = [];
		Storage.exportDatabase('roa');
		return this.say(`Host list successfully cleared.`);
	},
	hosts: 'viewhosts',
	viewhosts: function (target, room, user) {
		// @ts-ignore
		if (!user.canPerform('ruinsofalph', '@')) return this.say("You don't have permission to do that.");
		let hosts = getDatabase('roa').hosts;
		if (!hosts.length) return this.say("There are currently no hosts.");
		let prettifiedHostList = "Hosts for Ruins of Alph:\n\n" + hosts.map(
			/**
			 * @param {string} host
			 * @param {number} index
			 */
			(host, index) => (index + 1) + ": " + host
		).join("\n");
		Tools.uploadToHastebin(prettifiedHostList, /**@param {string} hastebinUrl */ hastebinUrl => {
			this.say("Ruins of Alph Hosts: " + hastebinUrl);
		});
	},
	etour: function (target, room, user) {
		// @ts-ignore
		if (!user.canPerform(room, '%') && !user.isHost()) return;
		let targets = target.split(' ');
		if (!targets[0]) {
			let ex = [
				`gen1ou`,
				`gen1ou, elimination`,
				`gen1ou, elimination, 64`,
				`gen1ou, elimination, 64, 2`,
			];
			// @ts-ignore
			if (!Users.self.hasRank(room, '*')) {
				return this.say("@etour command guide: https://hastebin.com/raw/raperayisa");
			} else {
				return this.pmHtml(user,
					`<h4><code>${cmdChar}etour</code>: correct syntaxes</h4><p style="margin-top:0;"><code>${cmdChar}etour</code> +<br /><br />` +
					`<span style="font-size:8pt;font-weight:bold;">start/forcestart</span><small> - Starts tour</small><br />` +
					`<span style="font-size:8pt;font-weight:bold;">end/forceend</span><small> - Ends tour</small><br />` +
					`<span style="font-size:8pt;font-weight:bold;">name/setname <i>[name]</i></span><small> - Renames tour</small><br />` +
					`<span style="font-size:8pt;font-weight:bold;">clearname/delname</span><small> - Clears tour's custom name</small><br />` +
					`<span style="font-size:8pt;font-weight:bold;">autostart/setautostart/as <i>[number/"off"]</i></span><small> - Sets autostart timer</small><br />` +
					`<span style="font-size:8pt;font-weight:bold;">autodq/setautodq/adq <i>[number/"off"]</i></span><small> - Sets autodq timer</small><br />` +
					`<span style="font-size:8pt;font-weight:bold;">addrule/removerule <i>[rule 1, rule 2, rule 3, ...]</i></span><small> - Adds/removes rules from tour; no need to precede removed rules w/ <code>!</code> anymore</small><br />` +
					`<span style="font-size:8pt;font-weight:bold;">ban/unban <i>[(un)ban 1, (un)ban 2, (un)ban 3, ...]</i></span><small> - (Un)bans Pokemon from tour; no need to precede w/ <code>+</code> or <code>-</code> anymore</small><br />` +
					`<span style="font-size:8pt;font-weight:bold;">clearrules</span><small> - Clears all custom rules <small>(Useful as a last-ditch effort)</small></small><br />` +
					`<span style="font-size:8pt;font-weight:bold;"><i>[format]</i>&lt;, <i>[type]</i>&lt;, <i>[player cap]</i>&lt;, <i>[rounds]</i>&gt;&gt;&gt;</span></p>` +
					`<ul><li style="margin-top:0"><strong>Examples:</strong><ul><li>${ex.join("</li><li>")}</li></ul></li>` +
					`<li>Each argument enclosed with &lt;&gt; is optional.</li></ul>`
				);
			}
		}
		if (room instanceof Users.User) return;
		let tour = getDatabase(room).tour;
		let finalRuleset = [];
		switch (Tools.toId(targets[0])) {
		case 'start': case 'forcestart':
			this.say(`/modnote Tournament started by ${user.id}`);
			this.say("/tour start");
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			Storage.exportDatabase(room.id);
			return;
		case 'end': case 'forceend':
			this.say(`/modnote Tournament ended by ${user.id}`);
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			Storage.exportDatabase(room.id);
			return this.say("/tour end");
		case 'name': case 'setname':
			let name = targets.slice(1).join(' ').trim();
			if (!name) return this.say(`Correct syntax: ${cmdChar}etour name/setname __[name]__`);
			this.say(`/modnote Tournament renamed by ${user.id}`);
			return this.say(`/tour name ${name}`);
		case 'clearname': case 'delname':
			this.say(`/modnote Tournament name cleared by ${user.id}`);
			return this.say(`/tour clearname`);
		case 'autostart': case 'setautostart': case 'as':
			if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}etour autostart/setautostart/as __[number (minutes)]__`);
			if (Tools.toId(targets[1]) === 'off') return this.say(`/tour autostart off`);
			let asTimer = parseInt(targets[1]);
			if (isNaN(asTimer)) return this.say(`${targets[1]} is not a number.`);
			this.say(`/modnote Tournament autostart set by ${user.id}`);
			return this.say(`/tour autostart ${asTimer}`);
		case 'autodq': case 'setautodq': case 'adq':
			if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}etour autodq/setautodq/adq __[number (minutes)]__`);
			if (Tools.toId(targets[1]) === 'off') return this.say(`/tour autodq off`);
			let dqTimer = parseInt(targets[1]);
			if (isNaN(dqTimer)) return this.say(`${targets[1]} is not a number.`);
			this.say(`/modnote Tournament autodq set by ${user.id}`);
			return this.say(`/tour autodq ${dqTimer}`);
		case 'addrule':
			let addedRules = targets.slice(1).join(' ').trim().split(',');
			let addedRulesString = addedRules.join(',').trim();
			if (!addedRulesString) return this.say(`Please provide Validator Rules to add to the tournament.`);
			for (const rule of addedRules) {
				if (tour["removedRules"].includes(`!${rule.trim()}`)) {
					tour["removedRules"].splice(tour["removedRules"].indexOf(`!${rule.trim()}`), 1);
					tour["addedRules"].push(rule.trim());
				} else {
					if (tour["addedRules"].includes(rule.trim())) return this.say(`The rule ${rule} is already in the tournament's banlist.`);
					tour["addedRules"].push(rule.trim());
				}
			}
			Storage.exportDatabase(room.id);
			finalRuleset = tour["addedRules"].concat(tour["removedRules"]).concat(tour["banlist"]).concat(tour["unbanlist"]);
			this.say(`/modnote Tournament ruleset adjusted by ${user.id}`);
			return this.say(`/tour rules ${finalRuleset.join(',')}`);
		case 'removerule':
			let removedRules = targets.slice(1).join(' ').trim().split(',');
			let removedRulesString = removedRules.join(',').trim();
			if (!removedRulesString) return this.say(`Please provide Validator Rules to add to the tournament.`);
			for (const rule of removedRules) {
				if (tour["addedRules"].includes(rule.trim())) {
					tour["addedRules"].splice(tour["addedRules"].indexOf(rule.trim()), 1);
					tour["removedRules"].push(`!${rule.trim()}`);
				} else {
					if (tour["removedRules"].includes(`!${rule.trim()}`)) return this.say(`The rule ${rule.trim()} is already removed from the tournament's banlist.`);
					tour["removedRules"].push(`!${rule.trim()}`);
				}
			}
			Storage.exportDatabase(room.id);
			finalRuleset = tour["addedRules"].concat(tour["removedRules"]).concat(tour["banlist"]).concat(tour["unbanlist"]);
			this.say(`/modnote Tournament ruleset adjusted by ${user.id}`);
			return this.say(`/tour rules ${finalRuleset.join(',')}`);
		case 'ban':
			let banlist = targets.slice(1).join(' ').trim().split(',');
			let banlistString = banlist.join(',').trim();
			if (!banlistString) return this.say(`Please provide Pokemon to ban from the tournament.`);
			for (const ban of banlist) {
				if (!Tools.getPokemon(ban) && !Tools.getItem(ban) && !Tools.getAbility(ban) && !Tools.getMove(ban) && !Tools.toId(Tools.getTiers()).includes(Tools.toId(ban))) {
					return this.say(`Pokemon, move, nature, ability, or tier ${ban} not found.`);
				}
				if (tour["unbanlist"].includes(`+${ban.trim()}`)) {
					tour["unbanlist"].splice(tour["unbanlist"].indexOf(`+${ban.trim()}`), 1);
					tour["banlist"].push(`-${ban.trim()}`);
				} else {
					if (tour["banlist"].includes(`-${ban.trim()}`)) return this.say(`The ban ${ban.trim()} is already in the tournament's banlist.`);
					tour["banlist"].push(`-${ban.trim()}`);
				}
			}
			Storage.exportDatabase(room.id);
			finalRuleset = tour["addedRules"].concat(tour["removedRules"]).concat(tour["banlist"]).concat(tour["unbanlist"]);
			this.say(`/modnote Tournament ruleset adjusted by ${user.id}`);
			return this.say(`/tour rules ${finalRuleset.join(',')}`);
		case 'unban':
			let unbanlist = targets.slice(1).join(' ').trim().split(',');
			let unbanlistString = unbanlist.join(',').trim();
			if (!unbanlistString) return this.say(`Please provide Pokemon to unban from the tournament.`);
			for (const unban of unbanlist) {
				if (!Tools.getPokemon(unban) && !Tools.getItem(unban) && !Tools.getAbility(unban) && !Tools.getMove(unban) && !Tools.toId(Tools.getTiers()).includes(Tools.toId(unban))) {
					return this.say(`Pokemon, move, nature, ability, or tier ${unban} not found.`);
				}
				if (tour["banlist"].includes(`-${unban.trim()}`)) {
					tour["banlist"].splice(tour["banlist"].indexOf(`-${unban.trim()}`), 1);
					tour["unbanlist"].push(`+${unban.trim()}`);
				} else {
					if (tour["banlist"].includes(`+${unban.trim()}`)) return this.say(`The ban ${unban.trim()} is already removed from the tournament's banlist.`);
					tour["unbanlist"].push(`+${unban.trim()}`);
				}
			}
			Storage.exportDatabase(room.id);
			finalRuleset = tour["addedRules"].concat(tour["removedRules"]).concat(tour["banlist"]).concat(tour["unbanlist"]);
			this.say(`/modnote Tournament ruleset adjusted by ${user.id}`);
			return this.say(`/tour rules ${finalRuleset.join(',')}`);
		case 'clearrules':
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			this.say(`/modnote Tournament ruleset cleared by ${user.id}`);
			this.say("/tour clearrules");
			Storage.exportDatabase(room.id);
			return this.say("Custom rules cleared.");
		default:
			targets = target.split(',');
			let f = targets[0];
			let format = Tools.getFormat(f);
			let formatid;
			if (!format) {
				formatid = Tools.toId(f).startsWith('gen7') ? Tools.toId(f) : 'gen7' + Tools.toId(f);
			} else {
				formatid = format.id;
			}
			if (targets.length < 2) {
				tour["addedRules"] = [];
				tour["removedRules"] = [];
				tour["banlist"] = [];
				tour["unbanlist"] = [];
				Storage.exportDatabase(room.id);
				this.say(`/modnote Tournament made by ${user.id}`);
				return this.say(`/tour new ${formatid}, elimination`);
			}
			if (targets[1]) {
				if (!['elimination', 'roundrobin'].includes(Tools.toId(targets[1]))) return this.say(`${targets[1]} is not a valid tournament type.`);
				if (targets.length < 3) {
					tour["addedRules"] = [];
					tour["removedRules"] = [];
					tour["banlist"] = [];
					tour["unbanlist"] = [];
					Storage.exportDatabase(room.id);
					this.say(`/modnote Tournament made by ${user.id}`);
					return this.say(`/tour new ${formatid}, ${Tools.toId(targets[1])}`);
				}
			}
			if (targets[2]) {
				if (isNaN(parseInt(Tools.toId(targets[2])))) return this.say(`${targets[2]} is not a number. (the third argument must be a number because it sets the tournament's player cap)`);
				if (targets.length < 4) {
					tour["addedRules"] = [];
					tour["removedRules"] = [];
					tour["banlist"] = [];
					tour["unbanlist"] = [];
					Storage.exportDatabase(room.id);
					this.say(`/modnote Tournament made by ${user.id}`);
					return this.say(`/tour new ${formatid}, ${Tools.toId(targets[1])}, ${parseInt(Tools.toId(targets[2]))}`);
				}
			}
			if (targets[3]) {
				if (isNaN(parseInt(Tools.toId(targets[3])))) return this.say(`${targets[3]} is not a number. (the fourth argument must be a number because it sets the tournament's rounds)`);
				if (targets.length < 5) {
					tour["addedRules"] = [];
					tour["removedRules"] = [];
					tour["banlist"] = [];
					tour["unbanlist"] = [];
					Storage.exportDatabase(room.id);
					this.say(`/modnote Tournament made by ${user.id}`);
					return this.say(`/tour new ${formatid}, ${Tools.toId(targets[1])}, ${parseInt(Tools.toId(targets[2]))}, ${parseInt(Tools.toId(targets[3]))}`);
				}
			}
		}
	},
};

exports.commands = commands;