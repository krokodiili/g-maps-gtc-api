const HTTP_PORT = 18399
const server = require('http').createServer()
const io = require('socket.io')(server)

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

const newUser = name => ({
	name, score: 0, id: generateUUID(), inGameId: false,
})
let usersInLobby = []
const newGame = array => ({ array, gameId: generateUUID() })
const onGoingGames = []
const userList = []
const getUsersInGame = id => {
	const users = userList.filter(obj => obj.gameId === id.gameId)
	return users
}

io.on('connection', client => {
	const startNewGame = () => {
		onGoingGames.push(newGame(usersInLobby))
		usersInLobby = []
	}
	const finishGame = () => {

	}
	const updateUser = user => {
		const users = getUsersInGame(user.gameId)
		users.map(target => {
			io.sockets.socket(target.id).emit(user.metadata)
		})
	}
	const rewardUserForAnswer = user => {

	}

	const user = newUser(client.name)
	usersInLobby.push(user)

	client.on('finish', finishGame)
	client.on('start', startNewGame)
	client.on('correct', rewardUserForAnswer)
	client.on('update', updateUser)
	client.on('disconnect', () => { client.destroy() })
})
server.listen(HTTP_PORT)
