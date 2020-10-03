const axios = require('axios');

const API_KEY = "a0213092-fcb0-4211-a1de-13bebf64170c"; // TODO store in .env

const BASE_URL = "https://open.faceit.com";
const UNDA_PLAYER_ID = "13ac5a5e-dacb-457b-b424-d3677ec4c7d1";
const game = "csgo";
const limit = 50;

const axiosInstance = axios.create({
	baseURL: 'https://some-domain.com/api/',
	timeout: 5000,
	headers: {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${API_KEY}`
	}
});

init();

async function init() {
	const dateFrom = new Date('01 Jan 20');
	const timestampFrom = Math.round(dateFrom.getTime() / 1000);
	const playerHistory = await getPlayerHistory(UNDA_PLAYER_ID, timestampFrom);
	const historyMatches = playerHistory.data.items;
	console.log('historyMatches.length: ', historyMatches.length);
	const wins = getWins(historyMatches, UNDA_PLAYER_ID);
	console.log('wins.length: ', wins.length);
	const losses = getLosses(historyMatches, UNDA_PLAYER_ID);
	console.log('losses.length: ', losses.length);

	const winMatchStats = await getMultipleMatchStats(wins);
	console.log('winMatchStats: ', winMatchStats);
	const lossMatchStats = await getMultipleMatchStats(losses);
	const winStats = [];
	winMatchStats.map(function(winStatsMap) {
		const winMatchStats = getPlayerStatsFromMatchStats(winStatsMap, UNDA_PLAYER_ID);
		winStats.push(winMatchStats);
	});
	const lossStats = [];
	lossMatchStats.map(function(lossStatsMap) {
		const lossMatchStats = getPlayerStatsFromMatchStats(lossStatsMap, UNDA_PLAYER_ID);
		lossStats.push(lossMatchStats);
	});
	console.log('winStats: ', winStats);
	winsKills = getKillsFromMatchesStats(winStats);
	winsDeaths = getDeathsFromMatchesStats(winStats);
	console.log('winsKills: ', winsKills);
	console.log('winsDeaths: ', winsDeaths);

	lossKills = getKillsFromMatchesStats(lossStats);
	lossDeaths = getDeathsFromMatchesStats(lossStats);
	console.log('lossKills: ', lossKills);
	console.log('lossDeaths: ', lossDeaths);

	// TODO function which just gets all maps
	const dust2WinStats = getMapMatchesFromMatchStats(winMatchStats, 'de_dust2');
	console.log('dust2WinStats: ', dust2WinStats);
}

async function getMultipleMatchStats(historyMatches) {
	const matchesStats = [];
	for (const historyMatch of historyMatches) {
		const matchStats = await getMatchStats(historyMatch.match_id);
		matchesStats.push(matchStats.data);
	}

	return matchesStats;
}

// TODO move API methods to their own class
async function getPlayerHistory(playerId, from, to = Date.now() / 1000 | 0) {
	try {
	  return await axiosInstance.get(`${BASE_URL}/data/v4/players/${playerId}/history?game=${game}&from=${from}&to=${to}&offset=0&limit=${limit}`);
	} catch (error) {
	  console.error(error);
	}
}

async function getMatchStats(matchId) {
	try {
	  return await axiosInstance.get(`${BASE_URL}/data/v4/matches/${matchId}/stats`);
	} catch (error) {
	  console.error(error);
	}
}

function getWins(historyMatches, playerId) {
	const wins = historyMatches.filter(function (match) {
		const isFaction1 = match.teams.faction1.players.includes(playerId);
		const faction = isFaction1 ? "faction1" : "faction2";

		return match.results.winner == faction;
	});

	return wins;
}

function getLosses(historyMatches, playerId) {
	const losses = historyMatches.filter(function (match) {
		const isFaction1 = match.teams.faction1.players.includes(playerId);
		const faction = isFaction1 ? "faction1" : "faction2";

		return match.results.winner != faction;
	});

	return losses;
}

function getMapMatchesFromMatchStats(matchStats, map) {
	return matchStats.filter(function(match) {
		return match.rounds[0].round_stats['Map'] == map;
	});
}

function getPlayerStatsFromMatchStats(matchStats, playerId) {
	let playerStats;
	matchStats.rounds[0].teams.map(function(team) {
		const player = team.players.filter(function(player) {
			return player.player_id == playerId;
		});
		if (player.length) {
			playerStats = player[0].player_stats;
		}
	});

	return playerStats;
}

function getKillsFromMatchesStats(matchesStats) {
	let kills = 0;
	matchesStats.map(function(matchStats) {
		kills += parseInt(matchStats.Kills);
	});

	return kills;
}

function getDeathsFromMatchesStats(matchesStats) {
	let deaths = 0;
	matchesStats.map(function(matchStats) {
		deaths += parseInt(matchStats.Deaths);
	});

	return deaths;
}