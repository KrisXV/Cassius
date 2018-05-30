'use strict';

const cmdChar = Config.commandCharacter;

/**
 * @param {Room | string} room
 * @return {AnyObject}
 */
function getDatabase(room) {
	if (room instanceof Rooms.Room) room = room.id;
	if (!Storage.databases[room]) Storage.databases[room] = Object.create(null);
	let database = Storage.databases[room];
	if (!database.hosts) database.hosts = [];
	if (!database.tour) database.tour = {"addedRules": [], "removedRules": [], "banlist": [], "unbanlist": []};
	if (!database.tourconfig) {
		database.tourconfig = {
			"autodq": {"randoms": 2, "normal": 3},
			"autostart": 3,
			/*
			 * For later
			 * "customtours": Object.create(null),
			 */
		};
	}
	if (!database.samples) database.samples = Object.create(null);
	return database;
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	econfig: function (target, room, user) {
		if (room instanceof Users.User) return;
		if (!user.canPerform(room, '@')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}econfig autostart/autodq`);
		target = target.trim();
		let targets = target.split(' ');
		let tourconfig = getDatabase(room).tourconfig;
		switch (Tools.toId(targets[0])) {
		case 'reset':
			getDatabase(room).tourconfig = {
				"autodq": {
					"randoms": 2,
					"normal": 3,
				},
				"autostart": 3,
			};
			Storage.exportDatabase(room.id);
			return this.say("``etour`` configuration reset.");
		case 'autodq':
		case 'setautodq':
		case 'adq':
			if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}econfig autodq randoms/normal __[number/"off"]__ (Using 0 as a number is the same as "off")`);
			if (!['randoms', 'normal'].includes(Tools.toId(targets[1]))) return this.say(`Correct syntax: ${cmdChar}econfig autodq randoms/normal __[number/"off"]__ (Using 0 as a number is the same as "off")`);
			if (!targets[2]) return this.say(`Correct syntax: ${cmdChar}econfig autodq randoms/normal __[number/"off"]__ (Using 0 as a number is the same as "off")`);
			let tTwoId = Tools.toId(targets[2]);
			let tTwoInt = parseInt(tTwoId);
			if (Tools.toId(targets[1]) === 'randoms') {
				if (tTwoId !== 'off' && isNaN(tTwoInt)) return this.say(`${targets[2]} must either be a number or the word "off".`);
				if (tTwoId === 'off' || tTwoInt === 0) {
					tourconfig["autodq"]["randoms"] = "off";
					Storage.exportDatabase(room.id);
					return this.say(`Auto DQ timer for random formats successfully turned off.`);
				}
				tourconfig["autodq"]["randoms"] = tTwoInt.toString();
				Storage.exportDatabase(room.id);
				return this.say(`Auto DQ timer for random formats successfully set to ${tTwoInt.toString()}.`);
			}
			if (tTwoId !== 'off' && isNaN(tTwoInt)) return this.say(`${targets[2]} must either be a number or the word "off".`);
			if (tTwoId === 'off' || tTwoInt === 0) {
				tourconfig["autodq"]["normal"] = "off";
				Storage.exportDatabase(room.id);
				return this.say(`Auto DQ timer for non-random formats successfully turned off.`);
			}
			tourconfig["autodq"]["normal"] = tTwoInt.toString();
			Storage.exportDatabase(room.id);
			return this.say(`Auto DQ timer for non-random formats successfully set to ${tTwoInt.toString()}.`);
		case 'autostart':
		case 'setautostart':
		case 'as':
			if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}econfig autostart __[number/"off"]__ (Using 0 as a number is the same as "off")`);
			let tOneId = Tools.toId(targets[1]);
			let tOneInt = parseInt(tOneId);
			if (tOneId !== 'off' && isNaN(tOneInt)) return this.say(`${targets[2]} must either be a number or the word "off".`);
			if (tOneId === 'off' || tOneInt === 0) {
				tourconfig["autostart"] = "off";
				Storage.exportDatabase(room.id);
				return this.say(`Autostart successfully turned off.`);
			}
			tourconfig["autostart"] = tOneInt.toString();
			Storage.exportDatabase(room.id);
			return this.say(`Autostart successfully set to ${tOneInt.toString()}.`);
		default:
			return this.say(`Correct syntax: ${cmdChar}econfig autostart/autodq`);
		}
	},
	addsamples: 'addsample',
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
	deletesamples: 'removesample',
	deletesample: 'removesample',
	removesamples: 'removesample',
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
		database[tZeroId].splice(index, 1);
		if (!database[tZeroId].length) {
			delete database[tZeroId];
			this.say(`The sample team index for ${tZeroId} is now empty, so it has been deleted.`);
		}
		Storage.exportDatabase(room.id);
		return this.say("Sample team removed.");
	},
	listsample: 'listsamples',
	listsamples: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This can only be used in rooms.");
		if (!user.canPerform(room, '%')) return this.say("You don't have permission to do that.");
		target = target.trim();
		let database = getDatabase(room.id).samples;
		if (!target) {
			if (!database) return this.say("There are currently no formats.");
			let dbList = [];
			for (let i in database) {
				dbList.push(i);
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
	sample: 'samples',
	samples: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This can only be used in rooms.");
		if (!target) {
			if (user.canPerform(room, '+')) return this.say(`Correct syntax: ${cmdChar}samples <__[tier]__>`);
			return this.pm(user, `Correct syntax: ${cmdChar}samples <__[tier]__>`);
		}
		target = target.trim();
		let database = getDatabase(room).samples;
		let tZeroId = Tools.toId(target);
		if (!(tZeroId in database)) return this.say(`The format ${target.trim()} wasn't found.`);
		if (!database[tZeroId].length) return this.say(`There are currently no sample teams for the format ${tZeroId} in the room ${room.id}.`);
		if (database[tZeroId].length < 2) return this.say(`Sample teams for __${tZeroId}__: ${database[tZeroId][0]}`);
		if (Users.self.hasRank(room, '*')) {
			let buf = `<h4>Sample teams for ${tZeroId}:</h4>`;
			buf += `<ul>`;
			for (const link of database[tZeroId]) {
				buf += `<li><a href="${link}">${link}</a></li>`;
			}
			buf += `</ul>`;
			return user.canPerform(room, '+') ? this.sayHtml(buf) : this.pmHtml(user, buf);
		}
		let prettifiedTeamList = "Sample teams for " + tZeroId + ":\n\n" + database[tZeroId].map(
			/**
			 * @param {string} team
			 * @param {number} index
			 */
			(team, index) => (index + 1) + ": " + team
		).join("\n");
		Tools.uploadToHastebin(prettifiedTeamList, /**@param {string} hastebinUrl */ hastebinUrl => {
			if (user.canPerform(room, '+')) return this.say("Sample teams for " + tZeroId + ": " + hastebinUrl);
			return this.pm(user, "Sample teams for " + tZeroId + ": " + hastebinUrl);
		});
	},
	addhost: 'host',
	host: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command can only be used in rooms.");
		if (!user.canPerform(room, '%')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}host __[user]__`);
		target = target.trim();
		let hosts = getDatabase(room.id).hosts;
		if (target.length > 18) return this.say("Please provide a real username.");
		let index = hosts.findIndex(/**@param {string} host */ host => Tools.toId(host) === Tools.toId(target));
		if (index >= 0) return this.say("That user is already a host.");
		hosts.push(Tools.toId(target));
		Storage.exportDatabase(room.id);
		return this.say(`User ${target} successfully added as a host.`);
	},
	dehost: 'unhost',
	unhost: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command can only be used in rooms.");
		if (!user.canPerform(room, '%')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}dehost __[user]__`);
		target = target.trim();
		let hosts = getDatabase(room.id).hosts;
		if (target.length > 18) return this.say("Please provide a real username.");
		let index = hosts.findIndex(/**@param {string} host */ host => Tools.toId(host) === Tools.toId(target));
		if (index < 0) return this.say("That user is not a host.");
		hosts.splice(index, 1);
		Storage.exportDatabase(room.id);
		return this.say(`User ${target} successfully dehosted.`);
	},
	clearhosts: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command can only be used in rooms.");
		if (!user.canPerform(room, '@')) return this.say("You don't have permission to do that.");
		target = target.trim();
		getDatabase(room.id).hosts = [];
		Storage.exportDatabase(room.id);
		return this.say(`Host list successfully cleared.`);
	},
	hosts: 'viewhosts',
	viewhosts: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command can only be used in rooms.");
		if (!user.canPerform(room, '%')) return this.say("You don't have permission to do that.");
		let hosts = getDatabase(room.id).hosts;
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
		if (!user.canPerform(room, '%') && !user.isHost(room)) return;
		let targets = target.split(' ');
		if (!targets[0]) {
			let ex = [
				`gen1ou`,
				`gen1ou, elimination`,
				`gen1ou, elimination, 64`,
				`gen1ou, elimination, 64, 2`,
			];
			if (room instanceof Users.User) return this.pm(user, `${cmdChar}etour command guide: https://hastebin.com/raw/iyapadihof`);
			if (!Users.self.hasRank(room, '*')) {
				return this.say(`${cmdChar}etour command guide: https://hastebin.com/raw/iyapadihof`);
			} else {
				return this.pmHtml(user,
					`<h4><code>${cmdChar}etour</code>: correct syntaxes</h4>` +
					`<p style="margin:0;">` +
					`<span style="font-size:8pt;">start/forcestart</span><small> - Starts tour</small><br />` +
					`<span style="font-size:8pt;">end/forceend</span><small> - Ends tour</small><br />` +
					`<span style="font-size:8pt;">name/setname <i>[name]</i></span><small> - Renames tour</small><br />` +
					`<span style="font-size:8pt;">clearname/delname</span><small> - Clears tour's custom name</small><br />` +
					`<span style="font-size:8pt;">autostart/setautostart/as <i>[number/"off"]</i></span><small> - Sets autostart timer</small><br />` +
					`<span style="font-size:8pt;">autodq/setautodq/adq <i>[number/"off"]</i></span><small> - Sets autodq timer</small><br />` +
					`<span style="font-size:8pt;">addrule/removerule <i>[rule 1, rule 2, rule 3, ...]</i></span><small> - Adds/removes rules from tour; no need to precede removed rules w/ <code>!</code> anymore</small><br />` +
					`<span style="font-size:8pt;">ban/unban <i>[(un)ban 1, (un)ban 2, (un)ban 3, ...]</i></span><small> - (Un)bans Pokemon from tour; no need to precede w/ <code>+</code> or <code>-</code> anymore</small><br />` +
					`<span style="font-size:8pt;">clearrules</span><small> - Clears all custom rules (Useful as a last-ditch effort)</small><br />` +
					`<span style="font-size:8pt;">viewrules</span><small> - Command for hosts to display rules</small></small><br />` +
					`<span style="font-size:8pt;">timer/forcetimer <i>[on/off]</i></span><small> - Toggles the forced timer (default off)</small><br />` +
					`<span style="font-size:8pt;">scouting/scout <i>[on/off]</i></span><small> - Allows/disallows scouting (default allowed)</small><br />` +
					`<span style="font-size:8pt;">[format]&lt;, <i>[type]</i>&lt;, <i>[player cap]</i>&lt;, <i>[rounds]</i>&gt;&gt;&gt;</span></p>` +
					`<ul><li style="margin-top:0"><strong>Examples:</strong><ul><li>${ex.join("</li><li>")}</li></ul></li>` +
					`<li>Each argument enclosed with &lt;&gt; is optional.</li></ul>`
				);
			}
		}
		if (room instanceof Users.User) return;
		let tour = getDatabase(room).tour;
		let samples = getDatabase(room).samples;
		let tourconfig = getDatabase(room).tourconfig;
		let finalRuleset = [];
		switch (Tools.toId(targets[0])) {
		case 'start':
		case 'forcestart':
			this.say(`/modnote Tournament started by ${user.id}`);
			this.say("/tour start");
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			Storage.exportDatabase(room.id);
			return;
		case 'end':
		case 'forceend':
			this.say(`/modnote Tournament ended by ${user.id}`);
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			Storage.exportDatabase(room.id);
			return this.say("/tour end");
		case 'name':
		case 'setname':
			let name = targets.slice(1).join(' ').trim();
			if (!name) return this.say(`Correct syntax: ${cmdChar}etour name/setname __[name]__`);
			this.say(`/modnote Tournament renamed by ${user.id}`);
			return this.say(`/tour name ${name}`);
		case 'clearname':
		case 'delname':
			this.say(`/modnote Tournament name cleared by ${user.id}`);
			return this.say(`/tour clearname`);
		case 'autostart':
		case 'setautostart':
		case 'as':
			if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}etour autostart/setautostart/as __[number (minutes)]__`);
			if (Tools.toId(targets[1]) === 'off') return this.say(`/tour autostart off`);
			let asTimer = parseInt(targets[1]);
			if (isNaN(asTimer)) return this.say(`${targets[1]} is not a number.`);
			this.say(`/modnote Tournament autostart set by ${user.id}`);
			return this.say(`/tour autostart ${asTimer}`);
		case 'autodq':
		case 'setautodq':
		case 'adq':
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
				if (!Tools.getTemplate(ban) && !Tools.getItem(ban) && !Tools.getAbility(ban) && !Tools.getMove(ban) && !Tools.toId(Tools.getTiers()).includes(Tools.toId(ban))) {
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
				if (!Tools.getTemplate(unban) && !Tools.getItem(unban) && !Tools.getAbility(unban) && !Tools.getMove(unban) && !Tools.toId(Tools.getTiers()).includes(Tools.toId(unban))) {
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
		case 'viewrules':
			return this.say("!tour viewrules");
		case 'timer':
		case 'forcetimer':
			if (!targets[1] || !["on", "off"].includes(Tools.toId(targets[1]))) return this.say(`Correct syntax: ${cmdChar}etour timer/forcetimer [on/off]`);
			if (Tools.toId(targets[1]) === "on") return this.say("/tour forcetimer on");
			return this.say("/tour forcetimer off");
		case 'scout':
		case 'scouting':
			if (!targets[1] || !["on", "off"].includes(Tools.toId(targets[1]))) return this.say(`Correct syntax: ${cmdChar}etour scout/scouting [on/off]`);
			if (Tools.toId(targets[1]) === "on") return this.say("/tour scouting allow");
			return this.say("/tour forcetimer disallow");
		default:
			targets = target.split(',');
			let f = targets[0];
			let format = Tools.getFormat(f);
			/**@type {string} */
			let formatid;
			if (!format) return this.say("Please provide a valid format.");
			formatid = format.id;
			let tourcmd = `/tour new ${formatid}, elimination`;
			if (targets[1]) {
				if (!['elimination', 'elim', 'roundrobin'].includes(Tools.toId(targets[1]))) return this.say(`${targets[1]} is not a valid tournament type.`);
				tourcmd = `/tour new ${formatid}, ${Tools.toId(targets[1])}`;
			}
			if (targets[2]) {
				if (isNaN(parseInt(Tools.toId(targets[2])))) return this.say(`${targets[2]} is not a number. (the third argument must be a number because it sets the tournament's player cap)`);
				tourcmd = `/tour new ${formatid}, ${Tools.toId(targets[1])}, ${parseInt(Tools.toId(targets[2]))}`;
			}
			if (targets[3]) {
				if (isNaN(parseInt(Tools.toId(targets[3])))) return this.say(`${targets[3]} is not a number. (the fourth argument must be a number because it sets the tournament's rounds)`);
				tourcmd = `/tour new ${formatid}, ${Tools.toId(targets[1])}, ${parseInt(Tools.toId(targets[2]))}, ${parseInt(Tools.toId(targets[3]))}`;
			}
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			Storage.exportDatabase(room.id);
			this.say(`/modnote Tournament made by ${user.id}`);
			this.say(tourcmd);
			if (tourconfig["autostart"] && !['off', '0'].includes(tourconfig["autostart"].toString())) this.say(`/tour autostart ${tourconfig["autostart"].toString()}`);
			if (!(formatid in samples)) return;
			if (samples[formatid].length < 2) return this.say(`Sample teams for __${formatid}__: ${samples[formatid][0]}`);
			if (Users.self.hasRank(room, '*')) {
				let buf = `<h4>Sample teams for ${formatid}:</h4>`;
				buf += `<ul>`;
				for (const link of samples[formatid]) {
					buf += `<li><a href="${link}">${link}</a></li>`;
				}
				buf += `</ul>`;
				this.sayHtml(buf);
			}
			let prettifiedTeamList = "Sample teams for " + formatid + ":\n\n" + samples[formatid].map(
				/**
				 * @param {string} team
				 * @param {number} index
				 */
				(team, index) => (index + 1) + ": " + team
			).join("\n");
			Tools.uploadToHastebin(prettifiedTeamList, /**@param {string} hastebinUrl */ hastebinUrl => {
				this.say("Sample teams for " + formatid + ": " + hastebinUrl);
			});
			return;
		}
	},
};

exports.commands = commands;