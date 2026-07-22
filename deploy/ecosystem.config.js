module.exports = {
  apps: [
    {
      name: 'pushstop-web',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/pushstop',
      env: { NODE_ENV: 'production', PORT: 4000 },
      max_memory_restart: '512M',
    },
    {
      name: 'pushstop-ws',
      script: 'dist/server/ws-server.js',
      cwd: '/var/www/pushstop',
      env: { NODE_ENV: 'production', WS_PORT: 4001 },
      max_memory_restart: '256M',
    },
  ],
};
