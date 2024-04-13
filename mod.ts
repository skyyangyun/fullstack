import Halfstack, { Router } from 'https://deno.land/x/halfstack@0.3.0/mod.ts'

interface FullstackConfig {
    apiPrefix?: string,
    apiDir?: string
}
export default class Fullstack {
    #halfstack
    config: Required<FullstackConfig>
    constructor(config: FullstackConfig) {
        this.config = config = {
            apiPrefix: '/api',
            apiDir: 'api',
            ...config
        }
        if(!/^\/\w+/.test(config.apiPrefix!)) throw new TypeError('apiPrefix must start with a forward slash')

        this.#halfstack = new Halfstack({
            docPath: config.apiPrefix!,
            apiDir: {
                dir: config.apiDir!,
                prefix: config.apiPrefix!,
            }
        })
        this.#halfstack.addRouter(new Router('/', {
            exclude: ['/api'],
            handler: this.#handler.bind(this)
        }))
    }

    #handler() {
        return fetch(import.meta.resolve('./template.html'))
    }

    listen(options = {}) {
        return this.#halfstack.listen(options)
    }
    shutdown() {
        return this.#halfstack.shutdown()
    }
}
