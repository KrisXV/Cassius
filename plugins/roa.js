'use strict';

const cmdChar = Config.commandCharacter;

/** @return {AnyObject} */
function getDatabase() {
	if (!Storage.databases['roa']) Storage.databases['roa'] = {};
	let database = Storage.databases['roa'];
	if (!database.hosts) database.hosts = [];
	if (!database.tour) database.tour = {"addedRules": [], "removedRules": [], "banlist": [], "unbanlist": []};
	return database;
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	addhost: 'host',
	host: function (target, room, user) {
		// @ts-ignore
		if (!user.canPerform('ruinsofalph', '%')) return this.say("You don't have permission to do that.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}host __[user]__`);
		target = target.trim();
		let hosts = getDatabase().hosts;
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
		let hosts = getDatabase().hosts;
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
		getDatabase().hosts = [];
		Storage.exportDatabase('roa');
		return this.say(`Host list successfully cleared.`);
	},
	hosts: 'viewhosts',
	viewhosts: function (target, room, user) {
		// @ts-ignore
		if (!user.canPerform('ruinsofalph', '@')) return this.say("You don't have permission to do that.");
		let hosts = getDatabase().hosts;
		if (!hosts.length) return this.say("There are currently no hosts.");
		let prettifiedHostList = "Hosts for " + room.id + ":\n\n" + hosts.map(
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
		if (room instanceof Users.User) return this.say("That command is only usable in rooms.");
		if (!user.canPerform(room, '%') && !user.isHost()) return;
		let targets = target.split(' ');
		if (!targets[0]) {
			let ex = [
				`gen1ou`,
				`gen1ou, elimination`,
				`gen1ou, elimination, 64`,
				`gen1ou, elimination, 64, 2`,
			];
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
		let tour = getDatabase().tour;
		let finalRuleset = [];
		switch (Tools.toId(targets[0])) {
		case 'start': case 'forcestart':
			if (user.isHost()) this.say(`/modnote Tournament started by ${user.id}`);
			this.say("/tour start");
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			Storage.exportDatabase('roa');
			return;
		case 'end': case 'forceend':
			if (user.isHost()) this.say(`/modnote Tournament ended by ${user.id}`);
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			Storage.exportDatabase('roa');
			return this.say("/tour end");
		case 'name': case 'setname':
			let name = targets.slice(1).join(' ').trim();
			if (!name) return this.say(`Correct syntax: ${cmdChar}etour name/setname __[name]__`);
			if (user.isHost()) this.say(`/modnote Tournament renamed by ${user.id}`);
			return this.say(`/tour name ${name}`);
		case 'clearname': case 'delname':
			if (user.isHost()) this.say(`/modnote Tournament name cleared by ${user.id}`);
			return this.say(`/tour clearname`);
		case 'autostart': case 'setautostart': case 'as':
			if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}etour autostart/setautostart/as __[number (minutes)]__`);
			if (Tools.toId(targets[1]) === 'off') return this.say(`/tour autostart off`);
			let asTimer = parseInt(targets[1]);
			if (isNaN(asTimer)) return this.say(`${targets[1]} is not a number.`);
			if (user.isHost()) this.say(`/modnote Tournament autostart set by ${user.id}`);
			return this.say(`/tour autostart ${asTimer}`);
		case 'autodq': case 'setautodq': case 'adq':
			if (!targets[1]) return this.say(`Correct syntax: ${cmdChar}etour autodq/setautodq/adq __[number (minutes)]__`);
			if (Tools.toId(targets[1]) === 'off') return this.say(`/tour autodq off`);
			let dqTimer = parseInt(targets[1]);
			if (isNaN(dqTimer)) return this.say(`${targets[1]} is not a number.`);
			if (user.isHost()) this.say(`/modnote Tournament autodq set by ${user.id}`);
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
			Storage.exportDatabase('roa');
			finalRuleset = tour["addedRules"].concat(tour["removedRules"]).concat(tour["banlist"]).concat(tour["unbanlist"]);
			if (user.isHost()) this.say(`/modnote Tournament ruleset adjusted by ${user.id}`);
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
			Storage.exportDatabase('roa');
			finalRuleset = tour["addedRules"].concat(tour["removedRules"]).concat(tour["banlist"]).concat(tour["unbanlist"]);
			if (user.isHost()) this.say(`/modnote Tournament ruleset adjusted by ${user.id}`);
			return this.say(`/tour rules ${finalRuleset.join(',')}`);
		case 'ban':
			let banlist = targets.slice(1).join(' ').trim().split(',');
			let banlistString = banlist.join(',').trim();
			if (!banlistString) return this.say(`Please provide Pokemon to ban from the tournament.`);
			for (const ban of banlist) {
				if (!Tools.getPokemon(ban) && !Tools.toId(Tools.getTiers()).includes(Tools.toId(ban))) {
					return this.say(`${ban} isn't a real Pokemon/tier.`);
				}
				if (tour["unbanlist"].includes(`+${ban.trim()}`)) {
					tour["unbanlist"].splice(tour["unbanlist"].indexOf(`+${ban.trim()}`), 1);
					tour["banlist"].push(`-${ban.trim()}`);
				} else {
					if (tour["banlist"].includes(`-${ban.trim()}`)) return this.say(`The ban ${ban.trim()} is already in the tournament's banlist.`);
					tour["banlist"].push(`-${ban.trim()}`);
				}
			}
			Storage.exportDatabase('roa');
			finalRuleset = tour["addedRules"].concat(tour["removedRules"]).concat(tour["banlist"]).concat(tour["unbanlist"]);
			if (user.isHost()) this.say(`/modnote Tournament ruleset adjusted by ${user.id}`);
			return this.say(`/tour rules ${finalRuleset.join(',')}`);
		case 'unban':
			let unbanlist = targets.slice(1).join(' ').trim().split(',');
			let unbanlistString = unbanlist.join(',').trim();
			if (!unbanlistString) return this.say(`Please provide Pokemon to unban from the tournament.`);
			for (const unban of unbanlist) {
				if (!Tools.getPokemon(unban) && !Tools.toId(Tools.getTiers()).includes(Tools.toId(unban))) {
					return this.say(`${unban} isn't a real Pokemon/tier.`);
				}
				if (tour["banlist"].includes(`-${unban.trim()}`)) {
					tour["banlist"].splice(tour["banlist"].indexOf(`-${unban.trim()}`), 1);
					tour["unbanlist"].push(`+${unban.trim()}`);
				} else {
					if (tour["banlist"].includes(`+${unban.trim()}`)) return this.say(`The ban ${unban.trim()} is already removed from the tournament's banlist.`);
					tour["unbanlist"].push(`+${unban.trim()}`);
				}
			}
			Storage.exportDatabase('roa');
			finalRuleset = tour["addedRules"].concat(tour["removedRules"]).concat(tour["banlist"]).concat(tour["unbanlist"]);
			if (user.isHost()) this.say(`/modnote Tournament ruleset adjusted by ${user.id}`);
			return this.say(`/tour rules ${finalRuleset.join(',')}`);
		case 'clearrules':
			tour["addedRules"] = [];
			tour["removedRules"] = [];
			tour["banlist"] = [];
			tour["unbanlist"] = [];
			if (user.isHost()) this.say(`/modnote Tournament ruleset cleared by ${user.id}`);
			this.say("/tour clearrules");
			Storage.exportDatabase('roa');
			return this.say("Custom rules cleared.");
		default:
			targets = target.split(',');
			let f = targets[0];
			let format = Tools.getFormat(f);
			if (!format) return this.say(`The format ${f} does not exist.`);
			let formatid = format.id;
			if (targets.length < 2) {
				tour["addedRules"] = [];
				tour["removedRules"] = [];
				tour["banlist"] = [];
				tour["unbanlist"] = [];
				Storage.exportDatabase('roa');
				if (user.isHost()) this.say(`/modnote Tournament made by ${user.id}`);
				return this.say(`/tour new ${formatid}, elimination`);
			}
			if (targets[1]) {
				if (!['elimination', 'roundrobin'].includes(Tools.toId(targets[1]))) return this.say(`${targets[1]} is not a valid tournament type.`);
				if (targets.length < 3) {
					tour["addedRules"] = [];
					tour["removedRules"] = [];
					tour["banlist"] = [];
					tour["unbanlist"] = [];
					Storage.exportDatabase('roa');
					if (user.isHost()) this.say(`/modnote Tournament made by ${user.id}`);
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
					Storage.exportDatabase('roa');
					if (user.isHost()) this.say(`/modnote Tournament made by ${user.id}`);
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
					Storage.exportDatabase('roa');
					if (user.isHost()) this.say(`/modnote Tournament made by ${user.id}`);
					return this.say(`/tour new ${formatid}, ${Tools.toId(targets[1])}, ${parseInt(Tools.toId(targets[2]))}, ${parseInt(Tools.toId(targets[3]))}`);
				}
			}
		}
	},
};

exports.commands = commands;