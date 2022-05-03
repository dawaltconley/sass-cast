const data = {
    location: 'Gdynia',
    image: 'https://images.pexels.com/photos/6025785/pexels-photo-6025785.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260',
}

module.exports = () => new Promise(resolve =>
    setTimeout(() => resolve(data), 1))
