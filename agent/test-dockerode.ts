#!/usr/bin/env bun

import Docker from 'dockerode';

async function testDockerode() {
  const docker = new Docker();
  const containerName = `test-nginx-${Date.now()}`;
  console.log(`Testing with container: ${containerName}`);

  let container;

  try {
    // Create
    console.log('Creating container...');
    container = await docker.createContainer({
      Image: 'nginx:alpine',
      name: containerName
    });
    console.log(`Container created with ID: ${container.id}`);
  } catch (error: any) {
    console.error('Create failed:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
    if (error.json) console.error('JSON:', error.json.message);
    process.exit(1);
  }

  try {
    // Start
    console.log('Starting container...');
    await container.start();
    console.log('Container started');
  } catch (error: any) {
    console.error('Start failed:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
    if (error.json) console.error('JSON:', error.json.message);
    process.exit(1);
  }

  try {
    // Logs
    console.log('Getting logs...');
    const logs = await container.logs({ tail: 5, stdout: true, stderr: true });
    const logString = logs.toString();
    const logLines = logString.split('\n').filter(line => line.trim());
    console.log('Last 5 log lines:');
    logLines.slice(-5).forEach((line, index) => {
      console.log(`  ${index + 1}: ${line}`);
    });
  } catch (error: any) {
    console.error('Logs failed:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
    if (error.json) console.error('JSON:', error.json.message);
    // Continue even if logs fail
  }

  try {
    // Stop
    console.log('Stopping container...');
    await container.stop();
    console.log('Container stopped');
  } catch (error: any) {
    console.error('Stop failed:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
    if (error.json) console.error('JSON:', error.json.message);
    process.exit(1);
  }

  try {
    // Restart
    console.log('Restarting container...');
    await container.restart();
    console.log('Container restarted');
  } catch (error: any) {
    console.error('Restart failed:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
    if (error.json) console.error('JSON:', error.json.message);
    process.exit(1);
  }

  try {
    // Delete
    console.log('Deleting container...');
    await container.remove({ force: true });
    console.log('Container deleted');
  } catch (error: any) {
    console.error('Delete failed:', error.message);
    if (error.statusCode) console.error('Status:', error.statusCode);
    if (error.json) console.error('JSON:', error.json.message);
    process.exit(1);
  }

  console.log('All Docker operations successful');
}

testDockerode().catch(console.error);