import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createClient } from 'redis';
import cors from 'cors';

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().catch(console.error);

const PORT = process.env.PORT || 3000;
const TEMP_DIR = '/app/temp'; // inside the API container
const HOST_TEMP_DIR = process.env.HOST_TEMP_DIR || path.join(process.cwd(), 'temp_files'); // on the host

// Ensure temp directory exists locally
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

app.post('/execute', async (req, res) => {
    const { language, code, input } = req.body;
    if (!language || !code) {
        return res.status(400).json({ error: 'Language and code are required' });
    }

    const cacheKey = crypto.createHash('sha256').update(`${language}:${code}:${input || ''}`).digest('hex');
    try {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
            return res.json({ source: 'cache', ...JSON.parse(cachedResult) });
        }
    } catch (e) {
        console.error('Redis cache error', e);
    }

    const fileId = crypto.randomUUID();
    let fileExt = '';
    let runnerImage = '';

    if (language === 'python') {
        fileExt = '.py';
        runnerImage = 'polyglot-runner-python:latest';
    } else if (language === 'nodejs' || language === 'javascript') {
        fileExt = '.js';
        runnerImage = 'polyglot-runner-nodejs:latest';
    } else if (language === 'c') {
        fileExt = '.c';
        runnerImage = 'polyglot-runner-c:latest';
    } else if (language === 'cpp' || language === 'c++') {
        fileExt = '.cpp';
        runnerImage = 'polyglot-runner-cpp:latest';
    } else if (language === 'java') {
        fileExt = '.java';
        runnerImage = 'polyglot-runner-java:latest';
    } else {
        return res.status(400).json({ error: 'Unsupported language' });
    }

    const fileName = `code-${fileId}${fileExt}`;
    const localFilePath = path.join(TEMP_DIR, fileName);
    
    const inputFileName = `input-${fileId}.txt`;
    const localInputPath = path.join(TEMP_DIR, inputFileName);

    try {
        await fs.writeFile(localFilePath, code);
        if (input) {
            await fs.writeFile(localInputPath, input);
        }

        // Security limits are implemented here:
        // - Ephemeral container (--rm)
        // - Non-root runner user (via Dockerfile)
        // - Resource limits (--memory=256m --cpus=0.5)
        // - No network access (--network none)
        // - Read-only volume mount (:ro)
        
        // Use HOST_TEMP_DIR dynamically passed from docker-compose so the runner maps the correct host path
        let dockerCmd = `docker run --rm --memory=256m --cpus="0.5" --network none -v "${HOST_TEMP_DIR}:/code:ro" ${runnerImage} /code/${fileName}`;
        if (input) {
            dockerCmd = `docker run -i --rm --memory=256m --cpus="0.5" --network none -v "${HOST_TEMP_DIR}:/code:ro" ${runnerImage} /code/${fileName} < "${localInputPath}"`;
        }
        
        try {
            const { stdout, stderr } = await execAsync(dockerCmd, { timeout: 10000 });
            const result = {
                source: 'execution',
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                error: null
            };
            
            try {
                await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
            } catch (e) {
                 console.error('Redis save error', e);
            }
            
            // Clean up temp files
            await fs.unlink(localFilePath).catch(console.error);
            if (input) await fs.unlink(localInputPath).catch(console.error);
            
            return res.json(result);
        } catch (execError: any) {
            // exec timeout or docker run error (e.g. exit code 1)
            const result = {
                source: 'execution',
                stdout: execError.stdout ? execError.stdout.trim() : '',
                stderr: execError.stderr ? execError.stderr.trim() : '',
                error: execError.message
            };
            
            // Clean up temp files
            await fs.unlink(localFilePath).catch(console.error);
            if (input) await fs.unlink(localInputPath).catch(console.error);
            
            return res.status(400).json(result);
        }
        
    } catch (error: any) {
        console.error('CRITICAL: Server execution error', error);
        return res.status(500).json({ error: 'Server Execution failed', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Polyglot API listening on port ${PORT}`);
});
