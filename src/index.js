const HTTP_PORT = 18399
const server = require('http').createServer()
const io = require('socket.io')(server)
const googleMaps = require('@google/maps').createClient({
	key: 'AIzaSyAqcPrwNOpMl4IZL64QjfnBdPoE5dcZ28w',
	Promise,
})
const collection = require('./cities')

const makeGoogleMapsFetch = async () => {
	const randomlySelectedCity = collection[Math.floor((Math.random() * collection.length) + 1)]
	return googleMaps.geocode({ address: randomlySelectedCity })
		.asPromise()
		.then(response => response.json.results)
		.then(data => data[0])
		.then(data => ({
			city: randomlySelectedCity,
			location: data.geometry.location,
		}))
		.catch(err => {
			console.log(err)
		})
}
const generateRandomCities = async () => {
	let results = []
	Promise.all([
		makeGoogleMapsFetch(),
		makeGoogleMapsFetch(),
		makeGoogleMapsFetch(),
		makeGoogleMapsFetch(),
		makeGoogleMapsFetch(),
	])
		.then(response => (
			response.map(res => res)))
		.then(values => {
			results = values
			console.log(results)
		})
}

const generateUUID = () => {
	let uuid = ''; let i; let
		random
	for (i = 0; i < 32; i += 1) {
		random = Math.random() * 16 | 0

		if (i === 8 || i === 12 || i === 16 || i === 20) {
			uuid += '-'
		}
		uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16)
	}
	return uuid
}

const newUser = (user, data, gameid) => ({
	name: data.name, score: 0, id: user.id, inGameId: gameid,
})
let usersInLobby = []
const newLobby = () => ({ id: generateUUID() })
const newGame = array => ({ array, gameId: generateUUID() })
const onGoingGames = []
const userList = []
const getUsersInGame = id => {
	const users = userList.filter(obj => obj.gameId === id.gameId)
	return users
}
let currentLobby = newLobby()
const findUserObjectById = id => userList.find(obj => obj.id === id)

io.on('connection', client => {
	const startNewGame = () => {
		// TODO initial City locations
		const sendGameLocations = generateRandomCities()
		io.in(currentLobby.id).emit('start', sendGameLocations)
		console.log(userList)
		currentLobby = newLobby()
		onGoingGames.push(newGame(usersInLobby))
		usersInLobby = []
	}
	const finishGame = () => {

	}
	const updateUser = user => {
		const users = getUsersInGame(user.gameId)
		users.map(target => {
			io.socket(target.id).emit(user.metadata)
		})
	}
	const handleConnect = data => {
		const user = newUser(client, data, currentLobby.id)
		userList.push(user)
	}
	const cleanUpAfterDC = () => {
		const result = findUserObjectById(client.id)
		const index = userList.indexOf(result)
		userList.splice(index, 1)
	}
	const rewardUserForAnswer = user => {

	}

	client.join(currentLobby.id)
	client.on('initial', handleConnect)
	client.on('finish', finishGame)
	client.on('start', startNewGame)
	client.on('correct', rewardUserForAnswer)
	client.on('update', updateUser)
	client.on('disconnect', cleanUpAfterDC)
})
server.listen(HTTP_PORT)
