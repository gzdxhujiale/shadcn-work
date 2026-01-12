
import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

export default function configWriter(): Plugin {
    return {
        name: 'vite-plugin-config-writer',
        configureServer(server) {
            server.middlewares.use('/__api/write-config', async (req, res, next) => {
                if (req.method === 'GET') {
                    const url = new URL(req.url!, `http://${req.headers.host}`)
                    const filename = url.searchParams.get('filename')

                    if (!filename) {
                        res.statusCode = 400
                        res.end('Missing filename')
                        return
                    }

                    const targetPath = path.resolve(process.cwd(), 'src/config', filename)
                    const configDir = path.resolve(process.cwd(), 'src/config')

                    if (!targetPath.startsWith(configDir)) {
                        res.statusCode = 403
                        res.end('Access denied')
                        return
                    }

                    if (fs.existsSync(targetPath)) {
                        const content = fs.readFileSync(targetPath, 'utf-8')
                        res.statusCode = 200
                        res.end(JSON.stringify({ content }))
                    } else {
                        res.statusCode = 404
                        res.end('File not found')
                    }
                    return
                }

                if (req.method !== 'POST') {
                    return next()
                }

                const chunks: Buffer[] = []
                req.on('data', (chunk) => chunks.push(chunk))
                req.on('end', () => {
                    try {
                        const body = JSON.parse(Buffer.concat(chunks).toString())
                        const { filename, content } = body

                        if (!filename || !content) {
                            res.statusCode = 400
                            res.end('Missing filename or content')
                            return
                        }

                        // 安全检查：只允许写入 src/config 下的文件，防止任意文件写入
                        const targetPath = path.resolve(process.cwd(), 'src/config', filename)
                        const configDir = path.resolve(process.cwd(), 'src/config')

                        if (!targetPath.startsWith(configDir)) {
                            res.statusCode = 403
                            res.end('Access denied: Can only write to src/config')
                            return
                        }

                        // 写入文件
                        fs.writeFileSync(targetPath, content, 'utf-8')
                        console.log(`[Config Writer] Updated ${filename}`)

                        res.statusCode = 200
                        res.end(JSON.stringify({ success: true }))
                    } catch (e) {
                        console.error('[Config Writer] Error:', e)
                        res.statusCode = 500
                        res.end(JSON.stringify({ error: String(e) }))
                    }
                })
            })
        }
    }
}
