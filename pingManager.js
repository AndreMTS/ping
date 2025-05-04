const { exec } = require('child_process');
const fs = require('fs-extra');
const moment = require('moment');
const axios = require('axios');
const config = require('./config.json');

let pingInterval = null;
let pingResults = [];
let logFile = null;
let testStartTime = null;
let testEndTime = null;
let currentCompany = null;

async function ensureLogDirectory() {
  await fs.ensureDir(config.logDirectory);
}

function calculateMetrics() {
  if (pingResults.length === 0) return null;

  const times = pingResults.map(r => r.time);
  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    totalPings: pingResults.length,
    successRate: (pingResults.filter(r => r.success).length / pingResults.length) * 100
  };
}

function parsePingOutput(output) {
  // Procura por "tempo=XXms" no output do ping em português
  const timeMatch = output.match(/tempo=(\d+)ms/i);
  if (timeMatch) {
    return {
      time: parseInt(timeMatch[1]),
      success: true
    };
  }
  return {
    time: 0,
    success: false
  };
}

async function startTest(target, company, durationHours) {
  await ensureLogDirectory();
  
  const timestamp = moment().format('YYYYMMDD_HHmmss');
  logFile = `${config.logDirectory}/${timestamp}_${company}_ping.txt`;
  currentCompany = company;
  testStartTime = new Date().toISOString();
  
  pingResults = [];
  
  const durationMs = durationHours ? durationHours * 60 * 60 * 1000 : null;
  const startTime = Date.now();
  
  // Adiciona um log inicial com informações do teste
  const initialLog = `Starting ping test at ${testStartTime}\nTarget: ${target}\nCompany: ${company}\nDuration: ${durationHours || 'Continuous'}\n\n`;
  fs.appendFileSync(logFile, initialLog);
  
  pingInterval = setInterval(async () => {
    try {
      const result = await new Promise((resolve, reject) => {
        // Usa o comando ping com opções específicas para Windows
        const command = `ping -n 1 -w 1000 ${target}`;
        console.log('Executing command:', command); // Debug
        
        exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
          if (error) {
            console.error('Ping error:', error); // Debug
            console.error('stderr:', stderr); // Debug
            reject(error);
          } else {
            console.log('Ping output:', stdout); // Debug
            resolve(stdout);
          }
        });
      });

      const pingData = parsePingOutput(result);
      const pingResult = {
        timestamp: new Date().toISOString(),
        time: pingData.time,
        success: pingData.success,
        error: pingData.success ? null : 'Host not reachable'
      };
      
      pingResults.push(pingResult);
      
      const logEntry = `[${pingResult.timestamp}] ${pingResult.success ? `Time: ${pingResult.time}ms` : `Error: ${pingResult.error}`}\n`;
      fs.appendFileSync(logFile, logEntry);
      
      if (durationMs && Date.now() - startTime >= durationMs) {
        await stopTest();
      }
    } catch (error) {
      console.error('Ping error:', error);
      const errorResult = {
        timestamp: new Date().toISOString(),
        time: 0,
        success: false,
        error: error.message || 'Unknown error'
      };
      pingResults.push(errorResult);
      const logEntry = `[${errorResult.timestamp}] Error: ${errorResult.error}\n`;
      fs.appendFileSync(logFile, logEntry);
    }
  }, config.defaultPingInterval * 1000);
  
  return { status: 'started', logFile };
}

async function stopTest() {
  if (!pingInterval) return { status: 'not_running' };
  
  clearInterval(pingInterval);
  pingInterval = null;
  testEndTime = new Date().toISOString();
  
  const metrics = calculateMetrics();
  const finalLog = `\nTest completed at ${testEndTime}\nMetrics:\n${JSON.stringify(metrics, null, 2)}\n`;
  fs.appendFileSync(logFile, finalLog);
  
  try {
    // Lê o arquivo de log e converte para base64
    const logContent = await fs.readFile(logFile, 'utf8');
    const logBase64 = Buffer.from(logContent).toString('base64');
    
    await axios.post(config.apiEndpoint, {
      company: currentCompany,
      startTime: testStartTime,
      endTime: testEndTime,
      metrics,
      logFile: logBase64,
      fileName: logFile.split('/').pop(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to send results to API:', error);
  }
  
  return { status: 'stopped', metrics };
}

async function exportResults() {
  if (!logFile) return { status: 'no_results' };
  
  const exportPath = logFile.replace('.txt', '_export.txt');
  await fs.copy(logFile, exportPath);
  
  return { status: 'exported', path: exportPath };
}

module.exports = {
  startTest,
  stopTest,
  exportResults
}; 