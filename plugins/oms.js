'use strict';

/**
 * Obtains the OM Plugin's database. If the database
 * wasn't already initialised, then it is done here.
 * @return {AnyObject}
 */
function getOMDatabase() {
	// In case a Room object was passed:
	let database = Storage.getDatabase('oms');
	if (!database.oms) database.oms = Object.create(null);
	return database;
}

/**
 * @param {User} user
 * @param {Room | string} room
 * @param {string} rank
 * @return {boolean}
*/
function canPerform(user, room, rank) {
	return user.hasRank(room, rank) || user.isDeveloper();
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	om: function (target, room, user) {
		if (!(room instanceof Rooms.Room)) return;
		if (!target) return this.say("Correct syntax: ``@om [Other Metagame]`` or ``@om add | [Other Metagame :: description :: link]`` or ``@om remove | [Other Metagame]``");
		let targets = target.split('|');
		let database = getOMDatabase();
		let oms = database.oms;
		if (['add', 'new', 'create'].includes(Tools.toId(targets[0]))) {
			if (!canPerform(user, room, '%')) return this.pm(user, "You don't have permission to do that.");
			let subtarget = targets[1].split('::');
			if (!subtarget[0]) return this.say("Please provide a valid OM name.");
			if (!subtarget[1]) return this.say("Please provide a valid OM description.");
			if (!subtarget[2]) return this.say("Please provide a valid OM link.");
			if (Tools.toId(subtarget[0]) in oms) return this.say("That OM is already listed.");
			oms[Tools.toId(subtarget[0])].desc = subtarget[1].trim();
			oms[Tools.toId(subtarget[0])].link = subtarget[2].trim();
			Storage.exportDatabase('oms');
			return this.say("OM " + subtarget[0] + " successfully added.");
		} else if (['del', 'delete', 'remove'].includes(Tools.toId(targets[0]))) {
			if (!canPerform(user, room, '%')) return this.pm(user, "You don't have permission to do that.");
			if (!(Tools.toId(targets[1]) in oms)) return this.say("That OM doesn't exist.");
			delete oms[Tools.toId(targets[1])];
			Storage.exportDatabase('oms');
			return this.say("OM " + targets[1] + " successfully removed.");
		} else {
			let text;
			if (!oms) text = "There are currently no OMs.";
			if (!(Tools.toId(targets[0]) in oms)) {
				text = "That OM does not exist.";
				if (!canPerform(user, room, '+')) return this.pm(user, text);
				return this.say(text);
			}
			text = "" + oms[Tools.toId(target)].desc + " - " + oms[Tools.toId(target)].link;
			if (!canPerform(user, room, '+')) return this.pm(user, text);
			return this.say(text);
		}
	},
	scale: 'scalemons',
	scalemons: function (target, room, user) {
		if (!(room instanceof Rooms.Room)) return;
		if (!target) return this.say("Correct syntax: ``@scalemons pokemon`` - Shows a Pokemon's scaled stats.");
		if (!(Tools.toId(target) in Tools.data.pokedex) || Tools.toId(target) === 'constructor') return this.say("Pokemon '" + target + "' not found.");
		let template = Object.assign({}, Tools.getPokemon(target));
		template.baseStats = Object.assign({}, template.baseStats);
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
		if (!canPerform(user, room, '+')) return this.pm(user, text);
		this.say(text);
	},
};

exports.commands = commands;
