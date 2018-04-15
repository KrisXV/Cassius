'use strict';

/**
 * Obtains the OM Plugin's database. If the database
 * wasn't already initialised, then it is done here.
 * @return {AnyObject}
 */
function getOMDatabase() {
	// In case a Room object was passed:
	let database = Storage.getDatabase('oms');
	if (!database.oms) database.oms = [];
	if (!database.omlinks) database.omlinks = {};
	if (!database.omdescs) database.omdescs = {};
	return database;
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	om: function (target, room, user) {
		if (!(room instanceof Rooms.Room)) return;
		if (!target) return this.say("Correct syntax: ``@om [Other Metagame]`` or ``@om add | [Other Metagame :: description :: link]`` or ``@om remove | [Other Metagame]``");
		let targets = target.split('|');
		let database = getOMDatabase();
		let oms = database.oms;
		let index;
		if (['add', 'new', 'create'].includes(Tools.toId(targets[0]))) {
			if (!user.hasRank(room, '%')) return this.pm(user, "You don't have permission to do that.");
			let subtarget = targets[1].split('::');
			if (!subtarget[0]) return this.say("Please provide a valid OM name.");
			if (!subtarget[1]) return this.say("Please provide a valid OM description.");
			if (!subtarget[2]) return this.say("Please provide a valid OM link.");
			index = oms.findIndex(/**@param {string} om */ om => Tools.toId(om) === Tools.toId(subtarget[0]));
			if (index >= 0) return this.say("That OM is already listed.");
			oms.push(subtarget[0].trim());
			database.omdescs[Tools.toId(subtarget[0])] = subtarget[1].trim();
			database.omlinks[Tools.toId(subtarget[0])] = subtarget[2].trim();
			Storage.exportDatabase('oms');
			return this.say("OM " + subtarget[0] + " successfully added.");
		} else if (['del', 'delete', 'remove'].includes(Tools.toId(targets[0]))) {
			if (!user.hasRank(room, '%')) return this.pm(user, "You don't have permission to do that.");
			index = oms.findIndex(/**@param {string} om */ om => Tools.toId(om) === Tools.toId(targets[1]));
			if (index < 0) return this.say("That OM does not exist.");
			oms.splice(index, 1);
			delete database.omlinks[Tools.toId(targets[1])];
			delete database.omdescs[Tools.toId(targets[1])];
			Storage.exportDatabase('oms');
			return this.say("OM " + targets[1] + " successfully removed.");
		} else {
			let text;
			if (!oms.length) text = "There are currently no OMs.";
			index = oms.findIndex(/**@param {string} om */ om => Tools.toId(om) === Tools.toId(targets[0]));
			if (index < 0) {
				text = "That OM does not exist.";
				if (!user.hasRank(room, '+')) return this.pm(user, text);
				return this.say(text);
			}
			text = "" + database.omdescs[Tools.toId(target)] + " -- " + database.omlinks[Tools.toId(target)];
			if (!user.hasRank(room, '+')) return this.pm(user, text);
			return this.say(text);
		}
	},
	scale: 'scalemons',
	scalemons: function (target, room, user) {
		if (!(room instanceof Rooms.Room)) return;
		if (!target) return this.say("Correct syntax: ``@scalemons pokemon`` - Shows a Pokemon's scaled stats.");
		if (!(Tools.toId(target) in Tools.data.pokedex)) return this.say("Pokemon '" + target + "' not found.");
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
		if (!user.hasRank(room, '+')) return this.pm(user, text);
		this.say(text);
	},
};

exports.commands = commands;
