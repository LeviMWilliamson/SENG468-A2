// utilities
function hydrateList(listElement, listItemTemplate, listData) {
	listElement.append( ...listData.map( listItem => {
		const listItemElement = listItemTemplate.cloneNode(true)
		listItemElement
			.querySelectorAll('[slot]')
			.forEach( slot => { slot.innerText = listItem[slot.getAttribute('slot')] })
		listItemElement
			.querySelectorAll('button')
			.forEach( bindElement => { bindElement.setAttribute('data-list-item-id', listItem.id) })
		return listItemElement
	}))
}

// draw the page
const bookListElement = document.getElementById('book-list')
const bookListingTemplate = document.getElementById('book-listing-template').content
const bookData = [
	{
		id: 0,
		title: 'Moby Dick',
		description: 'Cool book about whales.',
		price: '25.00',
	},
	{
		id: 1,
		title: 'Beowulf',
		description: 'Really old British book.',
		price: '30.00',
	},
	{
		id: 2,
		title: 'Manual',
		description: 'Something nobody reads.',
		price: '5.00',
	}
]
hydrateList(bookListElement, bookListingTemplate, bookData)

const networkStatusElement = document.getElementById('network-status')

const cart = []
const cartListElement = document.getElementById('cart-list')
const cartListingTemplate = document.getElementById('cart-listing-template').content

const orderListElement = document.getElementById('order-list')
const orderListingTemplate = document.getElementById('order-listing-template').content
const orderButton = document.getElementById('order')
orderButton.disabled = true

// bind event listeners
let username = 'UNSET'
const usernameInput = document.getElementById('username')
usernameInput.addEventListener('input', event => { username = event.target.value })

const refreshOrdersButton = document.getElementById('refresh-orders')
refreshOrdersButton.addEventListener('click', async event => {
	const data = JSON.parse(await (await fetch(`/orders/${username}`)).json())
	console.log(data)
	while(orderListElement.firstChild)
		orderListElement.removeChild(orderListElement.firstChild)
	hydrateList(orderListElement, orderListingTemplate, data)
})

orderButton.addEventListener('click', async event => {
	if(orderButton.disabled) {
		event.preventDefault()
		return
	}

	const order = [...cart.map( ({ id, quantity, price, total }) => ({ username, id, quantity, price, total }))]
	
	try {
		networkStatusElement.innerText = 'Sending Order 🛰'
		await fetch('/order', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(order)
		})
	} catch(error) {
		networkStatusElement.innerText = 'Order Failed 🚫'
		return
	}
	networkStatusElement.innerText = 'Order Successful 🎉'
})

document
	.querySelectorAll('button.add-to-cart')
	.forEach( buttonElement => {
		buttonElement.addEventListener('click', event => {
			const { listItemId } = event.target.dataset
			const itemIndex = cart.findIndex( item => item.id === listItemId )
			if (itemIndex !== -1) {
				cart[itemIndex].quantity++
				cart[itemIndex].total = (parseFloat(cart[itemIndex].price) * cart[itemIndex].quantity).toFixed(2)
			}
			else
				cart.push({
					id: listItemId,
					title: bookData[listItemId].title,
					price: bookData[listItemId].price,
					quantity: 1,
					total: bookData[listItemId].price
				})
			
			while(cartListElement.firstChild)
				cartListElement.removeChild(cartListElement.firstChild)

			hydrateList(cartListElement, cartListingTemplate, cart)
			bindCartRemovalButtons()
			orderButton.disabled = false
		})
	})

function bindCartRemovalButtons() {
	document
		.querySelectorAll('button.remove-from-cart')
		.forEach( buttonElement => {
			buttonElement.addEventListener('click', event => {
				const { listItemId } = event.target.dataset
				const itemIndex = cart.findIndex( item => item.id === listItemId )
				if (itemIndex !== -1) {
					cart[itemIndex].quantity--
					if (cart[itemIndex].quantity === 0) {
						cart.splice(itemIndex, 1)
						orderButton.disabled = true
					}
					else
						cart[itemIndex].total = (parseFloat(cart[itemIndex].price) * cart[itemIndex].quantity).toFixed(2)
				}
				
				while(cartListElement.firstChild)
					cartListElement.removeChild(cartListElement.firstChild)

				hydrateList(cartListElement, cartListingTemplate, cart)
				bindCartRemovalButtons()
			})
		})
}
