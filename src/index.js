const HTTP_PORT = 18399
const apiKey = ''
const server = require('http').createServer()
const io = require('socket.io')(server)
const googleMaps = require('@google/maps').createClient({
	key: apiKey,
	Promise,
})
const collection = require('./cities')

const makeGoogleMapsFetch = async () => {
	const randomlySelectedCity = collection[Math.floor((Math.random() * collection.length))]
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
	const results = Promise.all([
		makeGoogleMapsFetch(),
		makeGoogleMapsFetch(),
		makeGoogleMapsFetch(),
		makeGoogleMapsFetch(),
		makeGoogleMapsFetch(),
	])
		.then(response => (
			response.map(res => {
				if (res !== undefined) {
					return res
				}
			})))
		.then(values => values)
		.catch(err => { console.log(err) })
	return results
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
		const sendGamePositions = generateRandomCities()
			.then(data => {
				io.in(currentLobby.id).emit('start', data)
				currentLobby = newLobby()
				onGoingGames.push(newGame(usersInLobby))
				usersInLobby = []
			})
			.catch(err => console.log(err))
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
		usersInLobby.push(user)
		io.to(currentLobby.id).emit('updateUsers', usersInLobby)
		// console.log('user joined', client.id)
	}
	const cleanUpAfterDC = () => {
		// console.log('user left: ', client.id)
		const result = findUserObjectById(client.id)
		console.log('results was: ', result, 'and client read id: ', client.id)
		const index = userList.indexOf(result)
		if (index !== -1) {
			userList.splice(index, 1)
		} else {
			(
				console.log('didnt remove', client.id, ' ID wasnt found in userList')
			)
		}
		const idx = usersInLobby.indexOf(result)
		if (idx !== -1) {
			usersInLobby.splice(idx, 1)
		} else {
			console.log('didnt remove ', client.id, 'ID wasnt found in usersInLobby')
		}
		io.to(currentLobby.id).emit('updateUsers', usersInLobby)
	}
	const rewardUserForAnswer = () => {
		const user = findUserObjectById(client.id)
		user.score += 1
		const arrayOfGamers = getUsersInGame(user.inGameId)
		io.to(user.inGameId).emit('userScored', arrayOfGamers)
	}
	client.join(currentLobby.id)
	client.on('finish', finishGame)
	client.on('start', startNewGame)
	client.on('correct', rewardUserForAnswer)
	client.on('update', updateUser)
	client.on('disconnect', cleanUpAfterDC)
	client.on('initial', handleConnect)
})
server.listen(HTTP_PORT)
