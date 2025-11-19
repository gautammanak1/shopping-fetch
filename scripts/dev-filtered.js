#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

const nextDev = spawn('next', ['dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: path.resolve(__dirname, '..'),
})

nextDev.stdout.on('data', (data) => {
  const output = data.toString()
  if (!output.includes('POST /api/github/sync-stars')) {
    process.stdout.write(output)
  }
})

nextDev.stderr.on('data', (data) => {
  const output = data.toString()
  if (!output.includes('POST /api/github/sync-stars')) {
    process.stderr.write(output)
  }
})

nextDev.on('close', (code) => {
  process.exit(code)
})

process.on('SIGINT', () => {
  nextDev.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM')
  process.exit(0)
})

