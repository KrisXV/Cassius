/**
 * Extra
 * One Botty Boi - link here
 *
 * All-around plugin for Extra
 *
 * @license MIT license
 */

'use strict';

const cmdChar = Config.commandCharacter;

/**
 * Obtains the given room's database. If the quotes database
 * wasn't already initialised, then it is done here.
 * @param {Room | string} room
 * @return {AnyObject}
 */
function getDatabase(room) {
	// In case a Room object was passed:
	if (room instanceof Rooms.Room) room = room.id;
	if (!Storage.databases[room]) Storage.databases[room] = {};
	let database = Storage.databases[room];
	if (!database.roasts) database.roasts = [];
	return database;
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	plop: function (target, room, user) {
		if (room instanceof Users.User || !room.isPrivate()) return;
		let text = "plop";
		// @ts-ignore
		if (!user.canPerform(room, '+')) return this.pm(user, text);
		return this.say(text);
	},
	overpay: function (target, room, user) {
		if (room instanceof Users.User || !room.isPrivate()) return;
		let text = "OVERPAY!";
		// @ts-ignore
		if (!user.canPerform(room, '+')) return this.pm(user, "**" + text + "**");
		return this.say("/wall " + text);
	},
	bop: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command only works in rooms.");
		if (!room.isPrivate()) return;
		if (!Users.self.hasRank(room, '*')) return;
		if (!user.canPerform(room, '@')) return this.pm(user, "You don't have permission to use that command.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}bop __[user]__`);
		if (target.length > 18) return this.say("Please provide a valid username.");
		this.say(`/m ${target}`);
		this.say(`/hidetext ${target}`);
		this.say(`/um ${target}`);
	},
	addroast: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command only works in rooms.");
		if (!room.isPrivate()) return;
		if (!user.canPerform(room, '+')) return this.pm(user, "You don't have permission to use that command.");
		let database = getDatabase(room.id);
		target = target.trim();
		if (!target) return this.say(`Correct syntax: ${cmdChar}addroast __[roast]__`);
		let roasts = database.roasts;
		let index = roasts.findIndex(/**@param {string} roast */ roast => Tools.toId(roast) === Tools.toId(target));
		if (index >= 0) return this.say("That roast already exists.");
		if (!target.includes('{user}')) return this.say(`Your roast doesn't have the filler __{user}__ in it. (__{user}__ is used to locate where the target username goes when you use ${cmdChar}roast __{user}__)`);
		if (['/', '!'].includes(target[0])) return this.say("Roasts aren't allowed to start with slashes.");
		for (const letter of target.replace(' ', '')) {
			if (target[target.indexOf(letter) + 1] === letter &&
				target[target.indexOf(letter) + 2] === letter &&
				target[target.indexOf(letter) + 3] === letter) {
				return this.say("Please don't put spam as a roast.");
			}
		}
		roasts.push(target);
		Storage.exportDatabase(room.id);
		this.say("Your roast was successfully added.");
	},
	removeroast: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command only works in rooms.");
		if (!room.isPrivate()) return;
		if (!user.canPerform(room, '+')) return this.pm(user, "You don't have permission to use that command.");
		let database = getDatabase(room.id);
		target = target.trim();
		if (!target) return this.say(`Correct syntax: ${cmdChar}removeroast __[roast]__`);
		let roasts = database.roasts;
		let index = roasts.findIndex(/**@param {string} roast */ roast => Tools.toId(roast) === Tools.toId(target));
		if (index < 0) return this.say("Your roast doesn't exist in the database.");
		roasts.splice(index, 1);
		Storage.exportDatabase(room.id);
		this.say("Your roast was successfully removed.");
	},
	roast: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command only works in rooms.");
		if (!room.isPrivate()) return;
		if (!user.canPerform(room, '+')) return this.pm(user, "You don't have permission to use that command.");
		let database = getDatabase(room.id);
		let roasts = database.roasts;
		if (!roasts.length) return this.say("This room doesn't have any roasts.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}roast __[username]__`);
		if (target.length > 18) return this.say("Please use a real username.");
		if (['/', '!'].includes(target[0])) return this.say("Usernames aren't allowed to start with slashes.");
		this.say(Tools.sampleOne(roasts).replace(/{user}/g, target));
	},
	fancyroast: function (target, room, user) {
		if (room instanceof Users.User) return this.say("This command only works in rooms.");
		if (!room.isPrivate()) return;
		if (!Users.self.hasRank(room, '*')) return this.say("I need Bot Rank (*) to perform that command.");
		if (!user.canPerform(room, '@')) return this.pm(user, "You don't have permission to use that command.");
		let database = getDatabase(room.id);
		let roasts = database.roasts;
		if (!roasts.length) return this.say("This room doesn't have any roasts.");
		if (!target) return this.say(`Correct syntax: ${cmdChar}roast __[username]__`);
		if (target.length > 18) return this.say("Please use a real username.");
		if (['/', '!'].includes(target[0])) return this.say("Usernames aren't allowed to start with slashes.");
		this.sayHtml(`<h2 style="text-align:center;background-color:black;color:white;font-family:'courier new';letter-spacing:3pt;">${Tools.sampleOne(roasts).replace(/{user}/g, target)}</h2>`);
	},
	roasts: function (target, room, user) {
		if (room instanceof Rooms.Room && !room.isPrivate()) return;
		// @ts-ignore
		if (!user.canPerform(room, '+')) return this.pm(user, "You don't have permission to use that command.");
		let database = getDatabase(room.id);
		let roasts = database.roasts;
		if (!roasts.length) return this.say("This room doesn't have any roasts.");
		let prettifiedRoasts = "Roasts for " + room.id + ":\n\n" + roasts.map(
			/**
			 * @param {string} roast
			 * @param {number} index
			 */
			(roast, index) => (index + 1) + ": " + roast
		).join("\n");
		Tools.uploadToHastebin(prettifiedRoasts, /**@param {string} hastebinUrl */ hastebinUrl => {
			this.say("Roasts: " + hastebinUrl);
		});
	},
};

exports.commands = commands;
