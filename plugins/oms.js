'use strict';

const cmdChar = Config.commandCharacter;

/**
 * Obtains the OM Plugin's database. If the database
 * wasn't already initialised, then it is done here.
 * @return {AnyObject}
 */
function getOMDatabase() {
	// In case a Room object was passed:
	let database = Storage.databases['oms'];
	if (!database) database = Object.create(null);
	return database;
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	om: function (target, room, user) {
		if (!target) return this.say(`Correct syntax: **${cmdChar}om [Other Metagame]**, **${cmdChar}om add [Other Metagame (no spaces)], [link], [desc]**, or **${cmdChar}om remove [Other Metagame]**`);
		let targets = target.split(' ');
		let database = getOMDatabase();
		switch (Tools.toId(targets[0])) {
		case 'add':
		case 'new':
		case 'create': {
			// @ts-ignore
			if (!user.canPerform(room, '%')) return this.pm(user, "You don't have permission to do that.");
			let subtargets = targets.slice(1).join(' ').trim();
			let subtarget = subtargets.split(',');
			let tZero = Tools.toId(subtarget[0]);
			if (!subtarget[0] || ['/', '!'].includes(subtarget[0].trim()[0])) return this.say("Please provide a valid OM name.");
			if (!subtarget[1] || !subtarget[1].trim().startsWith('http') || ['/', '!'].includes(subtarget[1].trim()[0])) return this.say("Please provide a valid OM link.");
			if (!subtarget[2] || ['/', '!'].includes(subtarget[2].trim()[0])) return this.say("Please provide a valid OM description.");
			if (Tools.toId(subtarget[0]) in database) return this.say("That OM is already listed.");
			database[tZero] = {};
			database[tZero].link = subtarget[1].trim();
			if (database[tZero].link.length + ' - '.length + subtarget.slice(2).join(',').trim().length > 258 - '@om '.length - subtarget[0].length) {
				return this.say("Your description is too long.");
			} else {
				database[tZero].desc = subtarget.slice(2).join(',').trim();
			}
			Storage.exportDatabase('oms');
			return this.say(`OM ${subtarget[0]} successfully added.`);
		}

		case 'del':
		case 'delete':
		case 'remove': {
			// @ts-ignore
			if (!user.canPerform(room, '%')) return this.pm(user, "You don't have permission to do that.");
			if (!(Tools.toId(targets.slice(1).join(' ').trim()) in database)) return this.say("That OM doesn't exist.");
			delete database[Tools.toId(targets.slice(1).join(' ').trim())];
			Storage.exportDatabase('oms');
			return this.say(`OM ${targets.slice(1).join(' ').trim()} successfully removed.`);
		}

		default: {
			let text;
			if (!database) text = "There are currently no OMs.";
			if (!(Tools.toId(targets.join(' ')) in database)) {
				text = "That OM does not exist.";
				// @ts-ignore
				if (!user.canPerform(room, '+')) return this.pm(user, text);
				return this.say(text);
			}
			if (targets.length > 1) {
				let subtargets = targets.slice(1).join(' ').trim();
				let subtarget = subtargets.split(',');
				let validActions = ['desc', 'link', 'name'];
				// @ts-ignore
				if (!user.canPerform(room, '@')) return this.pm(user, "You don't have permission to do that");
				if (validActions.includes(subtarget[0])) {
					if (subtarget[0] === 'desc' || subtarget[0] === 'changedesc') {
						if (!subtarget[1] || ['/', '!'].includes(subtarget[1].trim()[0])) return this.say("Please provide a valid OM description.");
						database[Tools.toId(targets[0])].desc = subtarget.slice(1).join(',').trim();
						Storage.exportDatabase('oms');
						return this.say(`The description of '${targets[0]}' has been changed to: "${subtarget.slice(1).join(',').trim()}`);
					}
					if (subtarget[0] === 'link' || subtarget[0] === 'changelink') {
						if (!subtarget[1] || !subtarget[1].trim().startsWith('http') || ['/', '!'].includes(subtarget[1].trim()[0])) return this.say("Please provide a valid OM link.");
						database[Tools.toId(targets[0])].link = subtarget[1].trim();
						Storage.exportDatabase('oms');
						return this.say(`The link of '${targets[0]}' has been changed to: ${subtarget[1]}`);
					}
					if (subtarget[0] === 'name' || subtarget[0] === 'changename') {
						if (!subtarget[1] || ['/', '!'].includes(subtarget[1].trim()[0])) return this.say("Please provide a valid OM name.");
						database[Tools.toId(subtarget[1])] = Object.create(null);
						database[Tools.toId(subtarget[1])].link = database[Tools.toId(targets[0])].link;
						database[Tools.toId(subtarget[1])].desc = database[Tools.toId(targets[0])].desc;
						delete database[Tools.toId(targets[0])];
						Storage.exportDatabase('oms');
						return this.say(`The name of '${targets[0]}' has been changed to: ${subtarget[1]}`);
					}
				} else {
					let t = targets.join(' ').trim();
					text = "" + database[Tools.toId(t)].desc + " - " + database[Tools.toId(t)].link;
					// @ts-ignore
					if (!user.canPerform(room, '+')) return this.pm(user, text);
					return this.say(text);
				}
			}
			text = "" + database[Tools.toId(target)].desc + " - " + database[Tools.toId(target)].link;
			// @ts-ignore
			if (!user.canPerform(room, '+')) return this.pm(user, text);
			return this.say(text);
		}
		}
	},
	scale: 'scalemons',
	scalemons: function (target, room, user) {
		if (!target) return this.say(`Correct syntax: **${cmdChar}scalemons pokemon** - Shows a Pokemon's scaled stats.`);
		let template = Object.assign(Object.create(null), Tools.getPokemon(target));
		if (!(Tools.toId(target) in Tools.data.pokedex)) {
			if (!(Tools.toId(target) in Tools.data.aliases)) return this.say(`Pokemon '${target}' not found.`);
			template = Object.assign(Object.create(null), Tools.getPokemon(Tools.data.aliases[Tools.toId(target)]));
		}
		template.baseStats = Object.assign(Object.create(null), template.baseStats);
		let stats = ['atk', 'def', 'spa', 'spd', 'spe'];
		let pst = stats.map(stat => template.baseStats[stat]).reduce((x, y) => x + y);
		let scale = 600 - template.baseStats['hp'];
		let atk = Math.floor(template.baseStats['atk'] * scale / pst);
		if (atk > 255) {
			atk = 255;
		} else if (atk < 1) {
			atk = 1;
		}
		let def = Math.floor(template.baseStats['def'] * scale / pst);
		if (def > 255) {
			def = 255;
		} else if (def < 1) {
			def = 1;
		}
		let spa = Math.floor(template.baseStats['spa'] * scale / pst);
		if (spa > 255) {
			spa = 255;
		} else if (spa < 1) {
			spa = 1;
		}
		let spd = Math.floor(template.baseStats['spd'] * scale / pst);
		if (spd > 255) {
			spd = 255;
		} else if (spd < 1) {
			spd = 1;
		}
		let spe = Math.floor(template.baseStats['spe'] * scale / pst);
		if (spe > 255) {
			spe = 255;
		} else if (spe < 1) {
			spe = 1;
		}
		let text = "Scaled stats for " + template.species + ": " + template.baseStats['hp'] + " / " + atk + " / " + def + " / " + spa + " / " + spd + " / " + spe;
		// @ts-ignore
		if (!user.canPerform(room, '+')) return this.pm(user, text);
		this.say(text);
	},
};

exports.commands = commands;
