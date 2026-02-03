module.exports = {
    apps: [
        {
            name: 'email-api',
            script: './src/server.js',
            instances: 2,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            time: true,
            max_memory_restart: '500M',
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
        },
        {
            name: 'orchestrator',
            script: './src/workers/orchestrator.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/orchestrator-error.log',
            out_file: './logs/orchestrator-out.log',
            time: true,
            max_memory_restart: '300M',
            restart_delay: 5000,
            max_restarts: 10,
            min_uptime: '10s'
        },
        {
            name: 'cron-scheduler',
            script: './src/cron/scheduler.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './logs/cron-error.log',
            out_file: './logs/cron-out.log',
            time: true,
            max_memory_restart: '200M',
            cron_restart: '0 0 * * *'
        }
    ]
};
