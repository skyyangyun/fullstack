import Halfstack, { Router } from 'https://deno.land/x/halfstack@0.3.0/mod.ts'
import { STATUS_CODE, serveDir } from 'https://deno.land/std/http/mod.ts'
import * as esbuild from 'https://deno.land/x/esbuild@v0.21.4/mod.js'
import { denoResolverPlugin, denoLoaderPlugin } from "jsr:@luca/esbuild-deno-loader@0.9.0";
import progressPlugin from "npm:esbuild-plugin-progress";
import vuePlugin from "../esbuild-vue-plugin-deno/mod.ts";

interface FullstackConfig {
    apiPrefix?: string,
    apiDir?: string,
}
export default class Fullstack {
    #halfstack
    config: Required<FullstackConfig>
    constructor(config?: FullstackConfig) {
        this.config = config = {
            apiPrefix: '/api',
            apiDir: 'backend/api',
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

    async #handler({ request }) {
        const url = new URL(request.url)
        const pathname = url.pathname

        const response = await serveDir(request, {
            fsRoot: Deno.cwd() + '/public'
        })
        if (response.status !== STATUS_CODE.NotFound) return response

        const filename: string = pathname.split('/').at(-1) ?? ''
        if(filename.includes('.')) return response

        return fetch(import.meta.resolve('./template.html'))
    }

    listen(options = {}) {
        return this.#halfstack.listen(options)
    }
    shutdown() {
        return this.#halfstack.shutdown()
    }
}

export async function build() {
    await esbuild.build({
        entryPoints: ['frontend/main.js'],
        charset: 'utf8',
        bundle: true,
        format: 'esm',
        target: ['es2020'],
        outdir : 'dist' ,
        plugins: [
            denoResolverPlugin({configPath: `${Deno.cwd()}/deno.json`}),
            vuePlugin(),
            denoLoaderPlugin(),
            progressPlugin()
        ],
    })
    await esbuild.stop()
}

export async function run() {
    const ctx = await esbuild.context({
        entryPoints: ['frontend/index.js'],
        charset: 'utf8',
        bundle: true,
        format: 'esm',
        target: ['es2020'],
        outdir: 'dist',
        plugins: [
            denoResolverPlugin({configPath: `${Deno.cwd()}/deno.json`}),
            vuePlugin(),
            denoLoaderPlugin(),
            progressPlugin()
        ],
    })
    const {host, port} = await ctx.serve({
        host: 'localhost'
    })
    console.debug(host)
    console.debug(`http://localhost:${port}`)
    const app = new Fullstack()
    app.listen({
        port: 3100,
    }).then(() => console.debug('server is showdown'))
}
