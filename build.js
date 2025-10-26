import esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['src/app.ts'],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    outfile: 'dist/app.js',
    external: [
        '@slack/bolt',
        '@slack/web-api',
        'unique-names-generator',
        'dotenv',
    ],
    banner: {
        js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
    },
})


console.log('✅ Build complete')

