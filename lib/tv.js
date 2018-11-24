const fs       = require('fs')
const fetch    = require('node-fetch')
const OMDB_KEY = fs.readFileSync(`${__dirname}/.keys/omdb`)

class TVLibrary {
    static get url_api() {
        return `http://www.omdbapi.com/?apikey=${OMDB_KEY}`
    }
    static get url_poster() {
        return `http://img.omdbapi.com/?apikey=${OMDB_KEY}`
    }

    static async search(title, type, { year, page=1, plot=false } = {}) {
        let url = `${TVLibrary.url_api}&r=json&type=${type}&page=${page}&s=${title}`

        if (plot) url += `&plot=full`
        if (year) url += `&y=${year}`

        return await fetch(url).then(res => res.json())
    }

    static async searchMovies(title, { year, page=1, plot=false } = {}) {
        return TVLibrary.search(title, 'movie', { year, page, plot })
    }
    static async searchSeries(title, { year, page=1, plot=false } = {}) {
        return TVLibrary.search(title, 'series', { year, page, plot })
    }
}

module.exports = TVLibrary