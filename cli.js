import Fullstack, { build, run } from "./mod.ts";

const COMMAND = {
    help() {
        console.log(`
fullstack [command]

command:
    help
    run[:env]
    build[:env]
`)
    },
    run(env) {
        run()
    },
    build(env) {
        build()
    }
}

if (import.meta.main) {
    (function cli() {
        const args = Deno.args
        for(let index=0; index < args.length; index++) {
            const arg=args[index]
            if(!arg.startsWith('-')) {
                const [command, env = 'dev'] = arg.split(':')
                const fun =  COMMAND[command] || COMMAND['help']
                return fun(env, args.slice(index))
            }
        }
    })()
}
