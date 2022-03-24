const express = require('express')
const path = require('path')
const redis = require('redis')

// connect to redis
const client = redis.createClient({ url: process.env.REDIS_URL })
client.on('error', error => console.error('Redis Client Error', error))

const app = express()
app.use(express.json())

app.use(express.static(path.join(__dirname, '/static')))

app.post('/order', async (request, response) => {
	request.body.map( async ({ username, id, quantity, price, total }) => {
		const time = Date.now()
		const data = { username, id, quantity, price, total, time }
		await client.set(`${username}-${time}`, JSON.stringify(data))
	})
	response.json({ message: 'Order Successful 🎉' })
})

app.get('/orders/:username', async (request, response) => {
	const { username } = request.params
	const data = []
	for await (const key of client.scanIterator()) {
		data.push(JSON.parse(await client.get(key)))
	}
	response.json(JSON.stringify(data))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT} 🌈`))

async function connect() {
	await client.connect()
}

connect().then(() => console.log('Connected to Redis'))